import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function rateLimitClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) return "unknown";

  const chain = forwardedFor
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (chain.length === 0) return "unknown";
  if (chain.length === 1) return chain[0] ?? "unknown";

  return chain[chain.length - 2] ?? "unknown";
}

export function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { ok: false, error: { code: "rate_limited", message: "Too many requests" } },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export function rejectRateLimitedRequest(
  request: Request,
  {
    namespace,
    identity,
    limit,
    windowMs,
    now = Date.now(),
  }: {
    namespace: string;
    identity?: string;
    limit: number;
    windowMs: number;
    now?: number;
  },
) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  const key = `${namespace}:${identity ?? "anonymous"}:${rateLimitClientIp(request)}`;
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  existing.count += 1;
  if (existing.count > limit) {
    return rateLimitedResponse(Math.max(1, Math.ceil((existing.resetAt - now) / 1000)));
  }

  return null;
}
