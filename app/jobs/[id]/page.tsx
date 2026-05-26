import { SavedItemsBoundary } from "@/components/SavedItemsBoundary";
import type { JobDetailDto } from "@/lib/job-dto";
import { getCachedJobBySlugOrId } from "@/lib/public-cache";
import { JobDetailPageClient } from "@/app/jobs/[id]/JobDetailPageClient";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  let initialJob: JobDetailDto | null = null;
  let initialLoadError: string | null = null;

  try {
    initialJob = await getCachedJobBySlugOrId(id);
  } catch {
    initialLoadError = "求人の取得に失敗しました";
  }

  return (
    <SavedItemsBoundary>
      <JobDetailPageClient initialJob={initialJob} initialLoadError={initialLoadError} />
    </SavedItemsBoundary>
  );
}
