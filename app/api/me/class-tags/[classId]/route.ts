import { listClassTagsForSession, upsertClassTagsForSession } from "@/lib/class-detail";
import { listClassTagsJson, upsertClassTagsJson } from "@/lib/class-detail-route-handlers";
import { guardedSessionJsonBodyRoute, sessionJsonRoute } from "@/lib/next-json-route";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ classId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { classId } = await params;
  return sessionJsonRoute(
    { code: "class_tags_fetch_failed", message: "Failed to fetch class tags" },
    (session) => listClassTagsJson({ listTags: listClassTagsForSession }, session, classId),
  );
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { classId } = await params;
  return guardedSessionJsonBodyRoute(
    request,
    { code: "class_tags_save_failed", message: "Failed to save class tags" },
    (session, body) => upsertClassTagsJson({ upsertTags: upsertClassTagsForSession }, session, classId, body),
  );
}
