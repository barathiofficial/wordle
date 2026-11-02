import words from "@/data/words.json";
import { saveState } from "@/lib/server/game";

export async function POST() {
    const i = Math.floor(Math.random() * words.length);
    await saveState({ i, guesses: [] });
    return Response.json({ ok: true });
}
