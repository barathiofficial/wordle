import wordListRaw from './words_common.txt?raw'

export const WORD_LIST = wordListRaw
    .split('\n')
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length === 5)

const VALID_WORDS = new Set(WORD_LIST)

export function isValidWord(word) {
    return VALID_WORDS.has(word.toLowerCase())
}

export function getRandomWord(excludeWord = null) {
    let word = excludeWord
    while (word === excludeWord) {
        word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
    }
    return word
}
