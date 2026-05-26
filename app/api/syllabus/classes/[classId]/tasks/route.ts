import { addClassTaskForSession, listClassTasksForSession } from "@/lib/class-detail";
import { addClassTaskJson, listClassTasksJson } from "@/lib/class-detail-route-handlers";
import { guardedSessionJsonBodyRoute, sessionJsonRoute } from "@/lib/next-json-route";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ classId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { classId } = await params;
  return sessionJsonRoute(
    { code: "class_tasks_fetch_failed", message: "Failed to fetch class tasks" },
    (session) => listClassTasksJson({ listTasks: listClassTasksForSession }, session, classId),
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  const { classId } = await params;
  return guardedSessionJsonBodyRoute(
    request,
    { code: "class_task_create_failed", message: "Failed to create class task" },
    (session, body) => addClassTaskJson({ addTask: addClassTaskForSession }, session, classId, body),
  );
}
