import { GameState } from "@/types/Game";
import { deleteCookie, getCookie, setCookie } from "./cookie";
import { decryptToken, encryptToken } from "./jwt";

const TOKEN_NAME = "game";

export async function saveState(state: GameState) {
    const token = await encryptToken({ ...state });
    await setCookie(TOKEN_NAME, token);
}

export async function loadState(): Promise<GameState | null> {
    const token = await getCookie(TOKEN_NAME);
    if (!token) return null;
    return await decryptToken(token);
}

export async function clearState() {
    await deleteCookie(TOKEN_NAME);
}
