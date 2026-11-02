import { EncryptJWT, jwtDecrypt } from "jose";

const SECRET = Buffer.from(process.env.JWT_SECRET!, "hex");

export async function encryptToken(payload: any) {
    return await new EncryptJWT(payload)
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .setExpirationTime("1d")
        .encrypt(SECRET);
}

export async function decryptToken<T>(token: string) {
    try {
        const { payload } = await jwtDecrypt(token, SECRET);
        return payload as T;
    } catch (error) {
        return null;
    }
}
