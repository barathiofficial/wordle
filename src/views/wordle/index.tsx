"use client";

import { WordleBoard } from "@/components/WordleBoard";
import styles from "./index.module.css";
import { WordleKeyboard } from "@/components/WordleKeyboard";
import { useEffect } from "react";

export default function WordleView() {
    function newgame() {
        fetch("http://localhost:3000/api/wordle/new-game", { method: "POST" })
            .then((res) => res.json())
            .then(console.log)
            .catch(console.error);
    }

    function guess() {
        fetch("http://localhost:3000/api/wordle/guess", {
            method: "POST",
            body: JSON.stringify({ guess: "world" }),
            headers: { "Content-Type": "application/json" },
        })
            .then((res) => res.json())
            .then(console.log)
            .catch(console.error);
    }

    useEffect(() => {
        newgame();
    }, []);

    return (
        <div className={styles.container}>
            <button onClick={guess}>guess</button>
            <button onClick={newgame}>new game</button>
            <div className={styles.board}>
                <WordleBoard />
            </div>
            <div className={styles.keyboard}>
                <WordleKeyboard />
            </div>
        </div>
    );
}
