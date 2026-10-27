import { cookies } from "next/headers";

export async function getCookies() {
    return await cookies();
}

export async function getCookie(name: string) {
    const cookies = await getCookies();
    return cookies.get(name)?.value || null;
}

export async function setCookie(name: string, value: string) {
    const cookies = await getCookies();
    cookies.set(name, value, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
    });
}

export async function deleteCookie(name: string) {
    const cookies = await getCookies();
    cookies.delete(name);
}
