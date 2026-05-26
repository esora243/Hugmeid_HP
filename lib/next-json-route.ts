import { NextResponse } from "next/server";
import { readSessionFromCookies } from "./auth/session";
import type { AuthSessionPayload } from "./auth/types";
import { DatabaseConfigError } from "./db/postgres";
import { type ApiJsonResult, apiErrorResult, unauthorizedResult, withRequiredSession } from "./api-results";
import { readJsonRequestBody, rejectCrossSiteRequest } from "./security/request";
import { rejectSharedRateLimitedRequest } from "./security/shared-rate-limit";

type RouteFailure = {
  code: string;
  message: string;
};

type JsonRouteHandler = (session: AuthSessionPayload) => Promise<ApiJsonResult>;
type JsonBodyRouteHandler = (session: AuthSessionPayload, body: unknown) => Promise<ApiJsonResult>;
type PublicJsonRouteHandler = () => Promise<ApiJsonResult>;

function jsonResponse(result: ApiJsonResult, headers?: HeadersInit): Response {
  return NextResponse.json(result.body, { status: result.status, headers });
}

function publicCacheHeadersForResult(result: ApiJsonResult, cacheControl: string): HeadersInit {
  const status = result.status ?? 200;
  return status >= 200 && status < 300
    ? { "Cache-Control": cacheControl }
    : { "Cache-Control": "no-store" };
}

function failureResponse(error: unknown, failure: RouteFailure): Response {
  const status = error instanceof DatabaseConfigError ? 503 : 500;
  return jsonResponse(apiErrorResult(failure.code, failure.message, status), { "Cache-Control": "no-store" });
}

async function runJsonRoute(handler: () => Promise<Response>, failure: RouteFailure): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    return failureResponse(error, failure);
  }
}

function unauthorizedResponse(): Response {
  return jsonResponse(unauthorizedResult());
}

function rejectAuthenticatedMutationRateLimit(request: Request, session: AuthSessionPayload) {
  return rejectSharedRateLimitedRequest(request, {
    namespace: `authenticated-mutation:${request.method}:${new URL(request.url).pathname}`,
    identity: `user:${session.userId}`,
    limit: 60,
    windowMs: 60_000,
  });
}

export async function sessionJsonRoute(failure: RouteFailure, handler: JsonRouteHandler): Promise<Response> {
  return runJsonRoute(
    async () => jsonResponse(await withRequiredSession(readSessionFromCookies, handler)),
    failure,
  );
}

export async function publicJsonRoute(failure: RouteFailure, handler: PublicJsonRouteHandler): Promise<Response> {
  return runJsonRoute(async () => jsonResponse(await handler()), failure);
}

export async function publicCachedJsonRoute(
  failure: RouteFailure,
  cacheControl: string,
  handler: PublicJsonRouteHandler,
): Promise<Response> {
  return runJsonRoute(async () => {
    const result = await handler();
    return jsonResponse(result, publicCacheHeadersForResult(result, cacheControl));
  }, failure);
}

export async function guardedSessionJsonRoute(
  request: Request,
  failure: RouteFailure,
  handler: JsonRouteHandler,
): Promise<Response> {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const session = await readSessionFromCookies();
  if (!session) return unauthorizedResponse();
  return runJsonRoute(async () => {
    const rateLimitResponse = await rejectAuthenticatedMutationRateLimit(request, session);
    if (rateLimitResponse) return rateLimitResponse;
    return jsonResponse(await handler(session));
  }, failure);
}

export async function guardedSessionJsonBodyRoute(
  request: Request,
  failure: RouteFailure,
  handler: JsonBodyRouteHandler,
): Promise<Response> {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const session = await readSessionFromCookies();
  if (!session) return unauthorizedResponse();

  return runJsonRoute(async () => {
    const rateLimitResponse = await rejectAuthenticatedMutationRateLimit(request, session);
    if (rateLimitResponse) return rateLimitResponse;
    const jsonBody = await readJsonRequestBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    return jsonResponse(await handler(session, jsonBody.body));
  }, failure);
}
