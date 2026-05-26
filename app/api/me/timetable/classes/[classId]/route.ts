import { removeUserTimetableClassForSession } from "@/lib/personal-timetable";
import { removeUserTimetableClassJson } from "@/lib/timetable-route-handlers";
import { guardedSessionJsonRoute } from "@/lib/next-json-route";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ classId: string }>;
};

export async function DELETE(request: Request, { params }: RouteContext) {
  const { classId } = await params;
  return guardedSessionJsonRoute(
    request,
    { code: "timetable_remove_failed", message: "Failed to remove timetable class" },
    (session) => removeUserTimetableClassJson({ removeClass: removeUserTimetableClassForSession }, session, classId),
  );
}
