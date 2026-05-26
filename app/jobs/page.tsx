import { SavedItemsBoundary } from "@/components/SavedItemsBoundary";
import type { JobListItemDto } from "@/lib/job-dto";
import { listCachedJobs } from "@/lib/public-cache";
import { JobsPageClient } from "@/app/jobs/JobsPageClient";

export default async function JobsPage() {
  let initialJobs: JobListItemDto[] = [];
  let initialLoadError: string | null = null;

  try {
    initialJobs = await listCachedJobs();
  } catch {
    initialLoadError = "求人の取得に失敗しました";
  }

  return (
    <SavedItemsBoundary>
      <JobsPageClient initialJobs={initialJobs} initialLoadError={initialLoadError} />
    </SavedItemsBoundary>
  );
}
