import './style.css'
import { icons } from './icons.js'
import { getRandomWord, isValidWord } from './words.js'
import { WORD_LENGTH, MAX_GUESSES, LETTER_STATE, evaluateGuess, mergeKeyboardState, checkHardModeViolation } from './game.js'
import { loadStats, recordResult, loadSettings, saveSettings } from './stats.js'

const KEYBOARD_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
]

let settings = loadSettings()
applyTheme()

const state = {
    answer: getRandomWord(),
    guesses: [],
    evaluations: [],
    currentGuess: '',
    keyboardState: {},
    gameOver: false,
    won: false,
    hintUsed: false,
    revealedHintLetters: new Set(),
}

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="topbar">
    <div class="topbar-group">
      <button class="chip-btn" id="lang-btn"><span class="flag">🇺🇸</span> EN</button>
      <button class="icon-btn" id="new-word-btn" title="New random word" aria-label="New random word">${icons.plus}</button>
      <button class="chip-btn" id="give-up-btn">Give up</button>
    </div>
    <div class="topbar-group">
      <button class="icon-btn" id="stats-btn" aria-label="Statistics">${icons.stats}</button>
      <button class="icon-btn" id="settings-btn" aria-label="Settings">${icons.settings}</button>
      <button class="icon-btn" id="help-btn" aria-label="How to play">${icons.help}</button>
    </div>
  </div>

  <div class="toast-stack" id="toast-stack"></div>

  <div class="game-area">
    <div class="board" id="board"></div>
    <div class="result-banner" id="result-banner"></div>
  </div>

  <div class="keyboard" id="keyboard"></div>

  <div class="hint-row">
    <button class="hint-btn" id="hint-btn">${icons.bulb} Get hint</button>
  </div>

  <div id="modal-root"></div>
`

const boardEl = document.querySelector('#board')
const keyboardEl = document.querySelector('#keyboard')
const toastStack = document.querySelector('#toast-stack')
const modalRoot = document.querySelector('#modal-root')
const resultBanner = document.querySelector('#result-banner')

// ---------- Board rendering ----------

function renderBoard() {
    boardEl.innerHTML = ''
    for (let r = 0; r < MAX_GUESSES; r++) {
        const row = document.createElement('div')
        row.className = 'board-row'
        row.dataset.row = String(r)

        const guessWord = state.guesses[r] || (r === state.guesses.length ? state.currentGuess : '')
        const evaluation = state.evaluations[r]

        for (let c = 0; c < WORD_LENGTH; c++) {
            const tile = document.createElement('div')
            tile.className = 'tile'
            const letter = guessWord[c] || ''
            tile.textContent = letter

            if (evaluation) {
                tile.classList.add(evaluation[c])
            } else if (letter) {
                tile.classList.add('filled')
            }

            row.appendChild(tile)
        }
        boardEl.appendChild(row)
    }
}

function renderKeyboard() {
    keyboardEl.innerHTML = ''
    KEYBOARD_ROWS.forEach((row) => {
        const rowEl = document.createElement('div')
        rowEl.className = 'keyboard-row'
        row.forEach((key) => {
            const btn = document.createElement('button')
            btn.className = 'key'
            btn.dataset.key = key
            if (key === 'enter' || key === 'backspace') btn.classList.add('wide')

            if (key === 'backspace') {
                btn.innerHTML = icons.backspace
            } else if (key === 'enter') {
                btn.textContent = 'Enter'
            } else {
                btn.textContent = key
            }

            const status = state.keyboardState[key]
            if (status) btn.classList.add(status)

            rowEl.appendChild(btn)
        })
        keyboardEl.appendChild(rowEl)
    })
}

function showToast(message, duration = 2000) {
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = message
    toastStack.appendChild(toast)
    setTimeout(() => toast.remove(), duration)
}

// ---------- Input handling ----------

function handleKeyInput(key) {
    if (state.gameOver) {
        if (key === 'enter') startNewGame(getRandomWord(state.answer))
        return
    }

    if (key === 'enter') {
        submitGuess()
    } else if (key === 'backspace') {
        state.currentGuess = state.currentGuess.slice(0, -1)
        renderBoard()
    } else if (/^[a-z]$/.test(key) && state.currentGuess.length < WORD_LENGTH) {
        state.currentGuess += key
        renderBoard()
        popActiveTile()
    }
}

function popActiveTile() {
    const row = boardEl.children[state.guesses.length]
    const tile = row?.children[state.currentGuess.length - 1]
    if (tile) {
        tile.classList.add('pop')
        tile.addEventListener('animationend', () => tile.classList.remove('pop'), { once: true })
    }
}

function shakeCurrentRow() {
    const row = boardEl.children[state.guesses.length]
    row?.classList.add('shake')
    row?.addEventListener('animationend', () => row.classList.remove('shake'), { once: true })
}

function submitGuess() {
    const guess = state.currentGuess

    if (guess.length !== WORD_LENGTH) {
        shakeCurrentRow()
        showToast('Not enough letters')
        return
    }

    if (!isValidWord(guess)) {
        shakeCurrentRow()
        showToast('Not in word list')
        return
    }

    if (settings.hardMode) {
        const check = checkHardModeViolation(guess, state.guesses, state.evaluations)
        if (!check.valid) {
            shakeCurrentRow()
            showToast(check.reason)
            return
        }
    }

    const evaluation = evaluateGuess(guess, state.answer)
    const rowIndex = state.guesses.length

    state.guesses.push(guess)
    state.evaluations.push(evaluation)
    state.keyboardState = mergeKeyboardState(state.keyboardState, guess, evaluation)
    state.currentGuess = ''

    animateRowFlip(rowIndex, evaluation, () => {
        renderKeyboard()

        const won = evaluation.every((s) => s === LETTER_STATE.CORRECT)
        if (won) {
            state.gameOver = true
            state.won = true
            animateWin(rowIndex)
            recordResult(true, state.guesses.length)
            setTimeout(() => showResultBanner(true), 900)
        } else if (state.guesses.length === MAX_GUESSES) {
            state.gameOver = true
            state.won = false
            recordResult(false, 0)
            showResultBanner(false)
        }
    })
}

function showResultBanner(won) {
    resultBanner.innerHTML = `
    <div class="result-card">
      <p class="result-title">${won ? 'You Won!' : 'You Lost!'}</p>
      <p class="result-word-label">The answer was:</p>
      <p class="result-word">${state.answer.toUpperCase()}</p>
      <button class="play-again-btn" id="banner-new-game">New Game</button>
    </div>
  `
    resultBanner.classList.add('visible')
    document.querySelector('#banner-new-game').addEventListener('click', () => {
        startNewGame(getRandomWord(state.answer))
    })
}

function hideResultBanner() {
    resultBanner.classList.remove('visible')
    resultBanner.innerHTML = ''
}

function animateRowFlip(rowIndex, evaluation, onComplete) {
    const row = boardEl.children[rowIndex]
    const tiles = Array.from(row.children)

    tiles.forEach((tile, i) => {
        setTimeout(() => {
            tile.classList.add('flip')
            setTimeout(() => {
                tile.classList.add(evaluation[i])
                tile.classList.remove('filled')
            }, 275) // halfway through the flip, swap the face
        }, i * 300)
    })

    const totalTime = tiles.length * 300 + 275
    setTimeout(onComplete, totalTime)
}

function animateWin(rowIndex) {
    const row = boardEl.children[rowIndex]
    Array.from(row.children).forEach((tile, i) => {
        setTimeout(() => {
            tile.classList.add('win-bounce')
        }, i * 100)
    })
}

// ---------- Physical + on-screen keyboard wiring ----------

document.addEventListener('keydown', (e) => {
    if (modalRoot.children.length > 0) return
    const key = e.key.toLowerCase()
    if (key === 'enter' || key === 'backspace' || /^[a-z]$/.test(key)) {
        handleKeyInput(key)
    }
})

keyboardEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.key')
    if (btn) handleKeyInput(btn.dataset.key)
})

// ---------- Top bar actions ----------

document.querySelector('#new-word-btn').addEventListener('click', () => {
    startNewGame(getRandomWord(state.answer))
    showToast('New word loaded')
})

document.querySelector('#give-up-btn').addEventListener('click', openGiveUpModal)
document.querySelector('#stats-btn').addEventListener('click', () => openStatsModal(loadStats()))
document.querySelector('#settings-btn').addEventListener('click', openSettingsModal)
document.querySelector('#help-btn').addEventListener('click', openHelpModal)
document.querySelector('#hint-btn').addEventListener('click', giveHint)
document.querySelector('#lang-btn').addEventListener('click', () => showToast('English is the only language available right now'))

function startNewGame(word) {
    state.answer = word
    state.guesses = []
    state.evaluations = []
    state.currentGuess = ''
    state.keyboardState = {}
    state.gameOver = false
    state.won = false
    state.hintUsed = false
    state.revealedHintLetters = new Set()
    closeModal()
    hideResultBanner()
    renderBoard()
    renderKeyboard()
}

function giveHint() {
    if (state.gameOver) return
    const unrevealedPositions = []
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (!state.revealedHintLetters.has(i)) unrevealedPositions.push(i)
    }
    if (unrevealedPositions.length <= 1) {
        showToast("That's most of the word already!")
        return
    }
    const pos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)]
    state.revealedHintLetters.add(pos)
    showToast(`Letter ${pos + 1} is "${state.answer[pos].toUpperCase()}"`, 2500)
}

// ---------- Modals ----------

function closeModal() {
    modalRoot.innerHTML = ''
}

function openModalShell(innerHtml, onMount) {
    modalRoot.innerHTML = `
    <div class="modal-overlay" id="overlay">
      <div class="modal" role="dialog" aria-modal="true">
        <button class="modal-close" id="modal-close-btn" aria-label="Close">${icons.close}</button>
        ${innerHtml}
      </div>
    </div>
  `
    document.querySelector('#modal-close-btn').addEventListener('click', closeModal)
    document.querySelector('#overlay').addEventListener('click', (e) => {
        if (e.target.id === 'overlay') closeModal()
    })
    if (onMount) onMount()
}

function openHelpModal() {
    openModalShell(`
    <h2>How to play</h2>
    <p class="help-text">Guess the word in 6 tries. After each guess, tile colors show how close you were.</p>
    <div class="help-example">
      ${['w', 'e', 'a', 'r', 'y'].map((l, i) => `<div class="tile ${i === 0 ? 'correct' : ''}">${l}</div>`).join('')}
    </div>
    <p class="help-text"><strong>W</strong> is in the word and in the correct spot.</p>
    <div class="help-example">
      ${['p', 'i', 'l', 'o', 't'].map((l, i) => `<div class="tile ${i === 1 ? 'present' : ''}">${l}</div>`).join('')}
    </div>
    <p class="help-text"><strong>I</strong> is in the word but in the wrong spot.</p>
    <div class="help-example">
      ${['v', 'a', 'g', 'u', 'e'].map((l, i) => `<div class="tile ${i === 4 ? 'absent' : ''}">${l}</div>`).join('')}
    </div>
    <p class="help-text"><strong>E</strong> is not in the word at all.</p>
    <hr class="help-divider" />
    <p class="help-text">A new word is available daily, or tap the plus icon for a random one anytime.</p>
  `)
}

function openSettingsModal() {
    openModalShell(`
    <h2>Settings</h2>
    <div class="setting-row">
      <div class="setting-text">
        <h3>Dark mode</h3>
        <p>Easier on the eyes at night.</p>
      </div>
      <button class="switch ${settings.darkMode ? 'on' : ''}" id="dark-switch"><div class="switch-knob"></div></button>
    </div>
    <div class="setting-row">
      <div class="setting-text">
        <h3>Hard mode</h3>
        <p>Any revealed hints must be used in subsequent guesses.</p>
      </div>
      <button class="switch ${settings.hardMode ? 'on' : ''}" id="hard-switch"><div class="switch-knob"></div></button>
    </div>
  `, () => {
        document.querySelector('#dark-switch').addEventListener('click', (e) => {
            settings.darkMode = !settings.darkMode
            saveSettings(settings)
            applyTheme()
            e.currentTarget.classList.toggle('on', settings.darkMode)
        })
        document.querySelector('#hard-switch').addEventListener('click', (e) => {
            if (state.guesses.length > 0 && !state.gameOver) {
                showToast('Hard mode can only be toggled before your first guess')
                return
            }
            settings.hardMode = !settings.hardMode
            saveSettings(settings)
            e.currentTarget.classList.toggle('on', settings.hardMode)
        })
    })
}

function applyTheme() {
    document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light'
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', settings.darkMode ? '#121213' : '#ffffff')
}

function openGiveUpModal() {
    if (state.gameOver) {
        showToast('Game already over — start a new word to play again')
        return
    }
    openModalShell(`
    <h2>Give up?</h2>
    <p class="confirm-text">The answer will be revealed and this counts as a loss in your stats.</p>
    <div class="confirm-actions">
      <button class="confirm-cancel" id="cancel-give-up">Keep playing</button>
      <button class="confirm-danger" id="confirm-give-up">Give up</button>
    </div>
  `, () => {
        document.querySelector('#cancel-give-up').addEventListener('click', closeModal)
        document.querySelector('#confirm-give-up').addEventListener('click', () => {
            state.gameOver = true
            state.won = false
            recordResult(false, 0)
            closeModal()
            showResultBanner(false)
        })
    })
}

function openStatsModal(stats) {
    const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0
    const maxDist = Math.max(1, ...stats.guessDistribution)
    const wonRow = state.gameOver && state.won ? state.guesses.length : null

    const distRows = stats.guessDistribution
        .map((count, i) => {
            const pct = Math.max((count / maxDist) * 100, count > 0 ? 8 : 4)
            const highlight = wonRow === i + 1 ? 'highlight' : ''
            return `
        <div class="dist-row">
          <span class="dist-num">${i + 1}</span>
          <div class="dist-bar-track">
            <div class="dist-bar ${highlight}" style="width: ${pct}%">${count}</div>
          </div>
        </div>
      `
        })
        .join('')

    openModalShell(`
    <h2>Statistics</h2>
    <div class="stats-grid">
      <div class="stat-block"><span class="stat-number">${stats.played}</span><span class="stat-label">Played</span></div>
      <div class="stat-block"><span class="stat-number">${winPct}</span><span class="stat-label">Win %</span></div>
      <div class="stat-block"><span class="stat-number">${stats.currentStreak}</span><span class="stat-label">Current streak</span></div>
      <div class="stat-block"><span class="stat-number">${stats.maxStreak}</span><span class="stat-label">Max streak</span></div>
    </div>
    <p class="dist-title">Guess distribution</p>
    ${distRows}
  `)
}

// ---------- Init ----------

renderBoard()
renderKeyboard()
