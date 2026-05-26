import { addUserTimetableClassForSession, listUserTimetableForSession } from "@/lib/personal-timetable";
import { addUserTimetableClassJson, getUserTimetableJson } from "@/lib/timetable-route-handlers";
import { guardedSessionJsonBodyRoute, sessionJsonRoute } from "@/lib/next-json-route";

export const dynamic = "force-dynamic";

export async function GET() {
  return sessionJsonRoute(
    { code: "timetable_fetch_failed", message: "Failed to fetch timetable" },
    (session) => getUserTimetableJson({ listTimetable: listUserTimetableForSession }, session),
  );
}

export async function POST(request: Request) {
  return guardedSessionJsonBodyRoute(
    request,
    { code: "timetable_add_failed", message: "Failed to add timetable class" },
    (session, body) => addUserTimetableClassJson({ addClass: addUserTimetableClassForSession }, session, body),
  );
}
