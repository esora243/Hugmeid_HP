import { getClassMemoForSession, putClassMemoForSession } from "@/lib/class-detail";
import { getClassMemoJson, putClassMemoJson } from "@/lib/class-detail-route-handlers";
import { guardedSessionJsonBodyRoute, sessionJsonRoute } from "@/lib/next-json-route";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ classId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { classId } = await params;
  return sessionJsonRoute(
    { code: "class_memo_fetch_failed", message: "Failed to fetch class memo" },
    (session) => getClassMemoJson({ getMemo: getClassMemoForSession }, session, classId),
  );
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { classId } = await params;
  return guardedSessionJsonBodyRoute(
    request,
    { code: "class_memo_save_failed", message: "Failed to save class memo" },
    (session, body) => putClassMemoJson({ putMemo: putClassMemoForSession }, session, classId, body),
  );
}
