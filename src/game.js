export const WORD_LENGTH = 5
export const MAX_GUESSES = 6

export const LETTER_STATE = {
    CORRECT: 'correct',
    PRESENT: 'present',
    ABSENT: 'absent',
    EMPTY: 'empty',
}

// Evaluates a guess against the answer using standard Wordle rules:
// exact matches are marked first, then remaining letters are matched
// against remaining letter counts so duplicate letters are handled
// correctly (e.g. guessing "ERROR" against answer "ROBIN").
export function evaluateGuess(guess, answer) {
    const result = new Array(WORD_LENGTH).fill(LETTER_STATE.ABSENT)
    const answerLetters = answer.split('')
    const letterCounts = {}

    for (const letter of answerLetters) {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guess[i] === answerLetters[i]) {
            result[i] = LETTER_STATE.CORRECT
            letterCounts[guess[i]]--
        }
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (result[i] === LETTER_STATE.CORRECT) continue
        const letter = guess[i]
        if (letterCounts[letter] > 0) {
            result[i] = LETTER_STATE.PRESENT
            letterCounts[letter]--
        }
    }

    return result
}

// Merges a new evaluated guess into the running best-known state per
// letter for the on-screen keyboard (correct beats present beats absent).
export function mergeKeyboardState(currentState, guess, evaluation) {
    const rank = { correct: 3, present: 2, absent: 1 }
    const next = { ...currentState }
    for (let i = 0; i < guess.length; i++) {
        const letter = guess[i]
        const status = evaluation[i]
        if (!next[letter] || rank[status] > rank[next[letter]]) {
            next[letter] = status
        }
    }
    return next
}

// Hard mode: any revealed correct/present letter must be reused in later guesses.
export function checkHardModeViolation(guess, previousGuesses, previousEvaluations) {
    const required = {} // position -> letter, for greens
    const mustInclude = new Set() // letters that must appear somewhere, for yellows

    previousGuesses.forEach((prevGuess, gi) => {
        const evaluation = previousEvaluations[gi]
        evaluation.forEach((status, i) => {
            if (status === LETTER_STATE.CORRECT) {
                required[i] = prevGuess[i]
            } else if (status === LETTER_STATE.PRESENT) {
                mustInclude.add(prevGuess[i])
            }
        })
    })

    for (const [pos, letter] of Object.entries(required)) {
        if (guess[pos] !== letter) {
            return { valid: false, reason: `${(letter).toUpperCase()} must be in position ${Number(pos) + 1}` }
        }
    }

    for (const letter of mustInclude) {
        if (!guess.includes(letter)) {
            return { valid: false, reason: `Guess must contain ${letter.toUpperCase()}` }
        }
    }

    return { valid: true }
}
