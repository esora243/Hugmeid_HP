import { addClassResourceForSession, listClassResourcesForSession } from "@/lib/class-detail";
import { addClassResourceJson, listClassResourcesJson } from "@/lib/class-detail-route-handlers";
import { guardedSessionJsonBodyRoute, sessionJsonRoute } from "@/lib/next-json-route";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ classId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { classId } = await params;
  return sessionJsonRoute(
    { code: "class_resources_fetch_failed", message: "Failed to fetch class resources" },
    (session) => listClassResourcesJson({ listResources: listClassResourcesForSession }, session, classId),
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  const { classId } = await params;
  return guardedSessionJsonBodyRoute(
    request,
    { code: "class_resource_create_failed", message: "Failed to create class resource" },
    (session, body) => addClassResourceJson({ addResource: addClassResourceForSession }, session, classId, body),
  );
}
