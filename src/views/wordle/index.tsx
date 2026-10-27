import { WordleBoard } from "@/components/WordleBoard";
import styles from "./index.module.css";
import { WordleKeyboard } from "@/components/WordleKeyboard";

export default function WordleView() {
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
