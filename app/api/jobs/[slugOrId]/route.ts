import { notFoundResult } from "@/lib/api-results";
import { publicCachedJsonRoute } from "@/lib/next-json-route";
import { getCachedJobBySlugOrId } from "@/lib/public-cache";

export const dynamic = "force-dynamic";
const PUBLIC_JOB_DETAIL_CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=300";

export async function GET(_request: Request, { params }: { params: Promise<{ slugOrId: string }> }) {
  const { slugOrId } = await params;
  return publicCachedJsonRoute(
    { code: "job_fetch_failed", message: "求人の取得に失敗しました" },
    PUBLIC_JOB_DETAIL_CACHE_CONTROL,
    async () => {
      const item = await getCachedJobBySlugOrId(slugOrId);
      return item ? { body: { ok: true, item } } : notFoundResult("求人が見つかりません");
    },
  );
}
