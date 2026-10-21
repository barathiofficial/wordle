import { WordleBoard } from "@/components/WordleBoard";
import styles from "./page.module.css";
import { WordleKeyboard } from "@/components/WordleKeyboard";

export default function WordlePage() {
    return (
        <div className={styles.container}>
            <div className={styles.board}>
                <WordleBoard />
            </div>
            <div className={styles.keyboard}>
                <WordleKeyboard />
            </div>
        </div>
    );
}
