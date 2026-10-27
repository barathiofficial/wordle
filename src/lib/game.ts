import { GameState } from "@/types/Game";
import { EncryptJWT, jwtDecrypt } from "jose";
import { deleteCookie, getCookie, setCookie } from "./cookie";

const SECRET = Buffer.from(process.env.GAME_SECRET!, "hex");
const TOKEN_NAME = "game";

export async function saveState(state: GameState) {
    const token = await new EncryptJWT({ ...state })
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .setExpirationTime("1d")
        .encrypt(SECRET);

    await setCookie(TOKEN_NAME, token);
}

export async function loadState(): Promise<GameState | null> {
    const token = await getCookie(TOKEN_NAME);
    if (!token) return null;
    try {
        const { payload } = await jwtDecrypt(token, SECRET);
        return { i: payload.i, guesses: payload.guesses } as GameState;
    } catch (error) {
        return null;
    }
}

export async function clearState() {
    await deleteCookie(TOKEN_NAME);
}
