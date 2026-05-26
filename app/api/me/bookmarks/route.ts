import { listJobBookmarksForSession } from "@/lib/bookmarks";
import { getBookmarksJson } from "@/lib/bookmark-route-handlers";
import { sessionJsonRoute } from "@/lib/next-json-route";

export const dynamic = "force-dynamic";

export async function GET() {
  return sessionJsonRoute(
    { code: "bookmarks_fetch_failed", message: "Failed to fetch bookmarks" },
    (session) => getBookmarksJson({ listBookmarks: listJobBookmarksForSession }, session),
  );
}
