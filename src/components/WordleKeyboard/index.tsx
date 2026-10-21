import styles from "./index.module.css";

interface WordleKeyboardProps {
    rowCount?: number;
    wordLength?: number;
}

const KEYBOARD_LAYOUT = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
];

export function WordleKeyboard({ rowCount = 6, wordLength = 5 }: WordleKeyboardProps) {
    return (
        <div className={styles.keyboard}>
            {KEYBOARD_LAYOUT.map((row, rowIndex) => {
                return (
                    <div className={styles.row} key={rowIndex}>
                        {row.map((key) => {
                            return (
                                <button className={styles.key} key={key}>
                                    {key}
                                </button>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
