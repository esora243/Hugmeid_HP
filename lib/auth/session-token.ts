import type { AuthSessionPayload } from "@/lib/auth/types";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

const MIN_PRODUCTION_SESSION_SECRET_LENGTH = 32;
const MAX_SESSION_TOKEN_LENGTH = 2048;

export class SessionError extends Error {
  code: "session_secret_missing" | "session_invalid";

  constructor(code: SessionError["code"], message: string) {
    super(message);
    this.name = "SessionError";
    this.code = code;
  }
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new SessionError("session_secret_missing", "SESSION_SECRET is required");
  }
  if (process.env.NODE_ENV === "production" && secret.length < MIN_PRODUCTION_SESSION_SECRET_LENGTH) {
    throw new SessionError("session_secret_missing", "SESSION_SECRET must be at least 32 characters in production");
  }
  return secret;
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

async function sign(value: string, secret = getSessionSecret()) {
  const { createHmac } = await import("crypto");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export async function createSessionToken(payload: AuthSessionPayload, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const body = base64UrlEncode(JSON.stringify({ ...payload, exp: expiresAt }));
  return `${body}.${await sign(body)}`;
}

export async function verifySessionToken(token: string): Promise<AuthSessionPayload> {
  if (token.length > MAX_SESSION_TOKEN_LENGTH) {
    throw new SessionError("session_invalid", "Session token is too large");
  }
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) {
    throw new SessionError("session_invalid", "Session token shape is invalid");
  }
  const expected = await sign(body);
  const { timingSafeEqual } = await import("crypto");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new SessionError("session_invalid", "Session signature is invalid");
  }

  const parsed = JSON.parse(base64UrlDecode(body)) as AuthSessionPayload & { exp?: number };
  if (!parsed.userId || typeof parsed.exp !== "number" || parsed.exp <= Math.floor(Date.now() / 1000)) {
    throw new SessionError("session_invalid", "Session payload is invalid");
  }
  return { userId: parsed.userId };
}
