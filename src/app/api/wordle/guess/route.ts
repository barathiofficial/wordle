import words from "@/data/words.json";
import { clearState, loadState, saveState } from "@/lib/server/game";

export async function POST(req: Request) {
    const state = await loadState();
    if (!state) return Response.json({ error: "No active game" }, { status: 409 });
    const body = await req.json();
    const guess = body.guess.toLowerCase();
    if (guess.length !== 5 || !words.includes(guess))
        return Response.json({ error: "Not in word list" }, { status: 400 });
    const answer = words[state.i];
    const guesses = [...state.guesses, guess];
    const won = guess === answer;
    const lost = !won && guesses.length >= 6;
    if (won || lost) await clearState();
    else await saveState({ i: state.i, guesses });
    return Response.json({ won, answer: lost ? answer : undefined });
}
