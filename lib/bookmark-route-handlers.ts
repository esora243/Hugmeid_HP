import type { AuthSessionPayload } from "./auth/types";
import { type ApiJsonResult, notFoundResult, unauthorizedResult } from "./api-results";
import type { BookmarkDto } from "./job-dto";

type BookmarkRouteDeps = {
  listBookmarks: (session: AuthSessionPayload) => Promise<BookmarkDto[] | null>;
  saveBookmark: (session: AuthSessionPayload, jobId: string) => Promise<"saved" | "unauthorized" | "not_found">;
  deleteBookmark: (session: AuthSessionPayload, jobId: string) => Promise<"deleted" | "unauthorized">;
};

export async function getBookmarksJson(
  deps: Pick<BookmarkRouteDeps, "listBookmarks">,
  session: AuthSessionPayload,
): Promise<ApiJsonResult> {
  const items = await deps.listBookmarks(session);
  if (!items) return unauthorizedResult();
  return { body: { ok: true, items } };
}

export async function saveJobBookmarkJson(
  deps: Pick<BookmarkRouteDeps, "saveBookmark">,
  session: AuthSessionPayload,
  jobId: string,
): Promise<ApiJsonResult> {
  const result = await deps.saveBookmark(session, jobId);
  if (result === "unauthorized") return unauthorizedResult();
  if (result === "not_found") return notFoundResult("Job is not bookmarkable");
  return { body: { ok: true, saved: true } };
}

export async function deleteJobBookmarkJson(
  deps: Pick<BookmarkRouteDeps, "deleteBookmark">,
  session: AuthSessionPayload,
  jobId: string,
): Promise<ApiJsonResult> {
  const result = await deps.deleteBookmark(session, jobId);
  if (result === "unauthorized") return unauthorizedResult();
  return { body: { ok: true, saved: false } };
}
