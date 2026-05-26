import { deleteJobBookmarkForSession, saveJobBookmarkForSession } from "@/lib/bookmarks";
import { deleteJobBookmarkJson, saveJobBookmarkJson } from "@/lib/bookmark-route-handlers";
import { guardedSessionJsonRoute } from "@/lib/next-json-route";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { jobId } = await params;
  return guardedSessionJsonRoute(
    request,
    { code: "bookmark_save_failed", message: "Failed to save bookmark" },
    (session) => saveJobBookmarkJson({ saveBookmark: saveJobBookmarkForSession }, session, jobId),
  );
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { jobId } = await params;
  return guardedSessionJsonRoute(
    request,
    { code: "bookmark_delete_failed", message: "Failed to delete bookmark" },
    (session) => deleteJobBookmarkJson({ deleteBookmark: deleteJobBookmarkForSession }, session, jobId),
  );
}
