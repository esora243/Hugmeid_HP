import { putClassTaskStatusForSession } from "@/lib/class-detail";
import { putClassTaskStatusJson } from "@/lib/class-detail-route-handlers";
import { guardedSessionJsonBodyRoute } from "@/lib/next-json-route";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const { taskId } = await params;
  return guardedSessionJsonBodyRoute(
    request,
    { code: "class_task_status_save_failed", message: "Failed to save class task status" },
    (session, body) => putClassTaskStatusJson({ putTaskStatus: putClassTaskStatusForSession }, session, taskId, body),
  );
}
