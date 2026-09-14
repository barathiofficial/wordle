const STATS_KEY = 'wordle-stats'
const SETTINGS_KEY = 'wordle-settings'

const DEFAULT_STATS = {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0], // index 0 = won in 1 guess, etc.
}

export function loadStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY)
        if (!raw) return { ...DEFAULT_STATS, guessDistribution: [...DEFAULT_STATS.guessDistribution] }
        const parsed = JSON.parse(raw)
        return { ...DEFAULT_STATS, ...parsed }
    } catch {
        return { ...DEFAULT_STATS, guessDistribution: [...DEFAULT_STATS.guessDistribution] }
    }
}

export function recordResult(won, guessCount) {
    const stats = loadStats()
    stats.played += 1
    if (won) {
        stats.won += 1
        stats.currentStreak += 1
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak)
        stats.guessDistribution[guessCount - 1] += 1
    } else {
        stats.currentStreak = 0
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
    return stats
}

export function loadSettings() {
    const defaults = { darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false, hardMode: false }
    try {
        const raw = localStorage.getItem(SETTINGS_KEY)
        if (!raw) return defaults
        return { ...defaults, ...JSON.parse(raw) }
    } catch {
        return defaults
    }
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
