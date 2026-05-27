import { cookies } from "next/headers";
import type { AuthSessionPayload } from "@/lib/auth/types";
import { createSessionToken, SESSION_TTL_SECONDS, verifySessionToken } from "@/lib/auth/session-token";

const AUTH_SESSION_COOKIE = "HugNavi_session";

export { SessionError } from "@/lib/auth/session-token";

export async function readSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: AuthSessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_SESSION_COOKIE, await createSessionToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
