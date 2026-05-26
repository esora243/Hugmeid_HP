import type { AuthSessionPayload } from "./auth/types";
import { type ApiJsonResult, invalidRequestResult, notFoundResult, unauthorizedResult } from "./api-results";
import type { UserTimetableResponse } from "./timetable-dto";

type TimetableRouteDeps = {
  listTimetable: (session: AuthSessionPayload) => Promise<UserTimetableResponse | null>;
  addClass: (session: AuthSessionPayload, classId: string) => Promise<"added" | "unauthorized" | "not_found">;
  removeClass: (session: AuthSessionPayload, classId: string) => Promise<"removed" | "unauthorized">;
};

function readClassId(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const classId = (body as Record<string, unknown>).classId;
  return typeof classId === "string" && classId.trim() ? classId : null;
}

export async function getUserTimetableJson(
  deps: Pick<TimetableRouteDeps, "listTimetable">,
  session: AuthSessionPayload,
): Promise<ApiJsonResult> {
  const timetable = await deps.listTimetable(session);
  if (!timetable) return unauthorizedResult();
  return { body: timetable };
}

export async function addUserTimetableClassJson(
  deps: Pick<TimetableRouteDeps, "addClass">,
  session: AuthSessionPayload,
  body: unknown,
): Promise<ApiJsonResult> {
  const classId = readClassId(body);
  if (!classId) return invalidRequestResult("classId is required");

  const result = await deps.addClass(session, classId);
  if (result === "unauthorized") return unauthorizedResult();
  if (result === "not_found") return notFoundResult("Class is not available");
  return { body: { ok: true, added: true } };
}

export async function removeUserTimetableClassJson(
  deps: Pick<TimetableRouteDeps, "removeClass">,
  session: AuthSessionPayload,
  classId: string,
): Promise<ApiJsonResult> {
  const result = await deps.removeClass(session, classId);
  if (result === "unauthorized") return unauthorizedResult();
  return { body: { ok: true, removed: true } };
}
