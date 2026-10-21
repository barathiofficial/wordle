import styles from "./index.module.css";

interface WordleBoardProps {
    rowCount?: number;
    wordLength?: number;
}

export function WordleBoard({ rowCount = 6, wordLength = 5 }: WordleBoardProps) {
    return (
        <div className={styles.board}>
            {Array.from({ length: rowCount }).map((_, rowIndex) => {
                return (
                    <div className={styles.row} key={rowIndex}>
                        {Array.from({ length: wordLength }).map((_, cellIndex) => {
                            return <span className={styles.cell} key={cellIndex}></span>;
                        })}
                    </div>
                );
            })}
        </div>
    );
}
