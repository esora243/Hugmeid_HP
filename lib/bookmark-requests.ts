import type { BookmarkDto } from "./job-dto";
import { mapJobListItem, type JobRow } from "./jobs";

export type BookmarkRow = {
  id: string;
  created_at: string;
  jobs: JobRow | JobRow[] | null;
};

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export function mapBookmarkRowToDto(row: BookmarkRow): BookmarkDto | null {
  const job = firstRelation(row.jobs);
  if (!job) return null;
  return {
    id: row.id,
    type: "job",
    job: mapJobListItem(job, true),
    savedAt: row.created_at,
  };
}
