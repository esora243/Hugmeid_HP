import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createSessionToken, SessionError, verifySessionToken } from "../lib/auth/session-token";

test("session token verifies a signed payload", async () => {
  process.env.SESSION_SECRET = "test-secret";
  const token = await createSessionToken({ userId: "user-1" });
  assert.deepEqual(await verifySessionToken(token), { userId: "user-1" });
});

test("session token rejects a tampered signature", async () => {
  process.env.SESSION_SECRET = "test-secret";
  const token = await createSessionToken({ userId: "user-1" });
  const tampered = `${token.split(".")[0]}.invalid-signature`;
  await assert.rejects(
    () => verifySessionToken(tampered),
    (error) => error instanceof SessionError && error.code === "session_invalid",
  );
});

test("session token rejects oversized cookie payloads before signature work", async () => {
  process.env.SESSION_SECRET = "test-secret";
  await assert.rejects(
    () => verifySessionToken(`${"x".repeat(2049)}.signature`),
    (error) => error instanceof SessionError && error.code === "session_invalid",
  );
});

test("production session secret must have enough entropy", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, enumerable: true, writable: true });
  process.env.SESSION_SECRET = "short";
  await assert.rejects(
    () => createSessionToken({ userId: "user-1" }),
    (error) => error instanceof SessionError && error.code === "session_secret_missing",
  );
  Object.defineProperty(process.env, "NODE_ENV", { value: previousNodeEnv, configurable: true, enumerable: true, writable: true });
});

test("session cookies are signed httpOnly cookies with production secure mode", () => {
  const source = readFileSync(join(process.cwd(), "lib/auth/session.ts"), "utf8");
  const tokenSource = readFileSync(join(process.cwd(), "lib/auth/session-token.ts"), "utf8");

  assert.match(source, /httpOnly:\s*true/);
  assert.match(source, /secure:\s*process\.env\.NODE_ENV === "production"/);
  assert.match(source, /sameSite:\s*"lax"/);
  assert.match(source, /maxAge:\s*SESSION_TTL_SECONDS/);
  assert.match(tokenSource, /timingSafeEqual/);
});

test("LINE session route does not expose raw SessionError details", () => {
  const source = readFileSync(join(process.cwd(), "app/api/auth/line/session/route.ts"), "utf8");
  const sessionErrorBlock = source.slice(source.indexOf("if (error instanceof SessionError)"));

  assert.doesNotMatch(sessionErrorBlock, /message:\s*error\.message/);
  assert.doesNotMatch(sessionErrorBlock, /code:\s*error\.code/);
  assert.match(sessionErrorBlock, /code:\s*"session_unavailable"/);
});
