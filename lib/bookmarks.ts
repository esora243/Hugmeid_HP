import "server-only";

import type { AuthSessionPayload } from "./auth/types";
import { dbQuery } from "./db/postgres";
import type { BookmarkDto } from "./job-dto";
import {
  mapBookmarkRowToDto,
  type BookmarkRow,
} from "./bookmark-requests";
import { getActiveJobRowById } from "./jobs";

type ActiveUser = {
  id: string;
  deactivated_at: string | null;
};

async function requireActiveUser(session: AuthSessionPayload) {
  const { rows } = await dbQuery<ActiveUser>(
    `
      select id::text, deactivated_at::text
      from users
      where id = $1
        and deactivated_at is null
      limit 1
    `,
    [session.userId],
  );
  return rows[0] ?? null;
}

async function getActivePublishedJob(jobId: string) {
  return getActiveJobRowById(jobId);
}

export async function listJobBookmarksForSession(session: AuthSessionPayload): Promise<BookmarkDto[] | null> {
  const user = await requireActiveUser(session);
  if (!user) return null;

  const { rows } = await dbQuery<BookmarkRow>(
    `
      select
        b.id::text,
        b.created_at::text,
        json_build_object(
          'id', j.id::text,
          'slug', j.slug,
          'title', j.title,
          'location_pref', j.location_pref,
          'location_detail', j.location_detail,
          'summary', j.summary,
          'description_md', j.description_md,
          'published_at', j.published_at::text,
          'salary_min', j.salary_min,
          'salary_display', j.salary_display,
          'work_schedule', j.work_schedule,
          'company_name', j.company_name,
          'company_type', j.company_type,
          'requirements_summary', j.requirements_summary,
          'requirements_list', j.requirements_list,
          'benefits', j.benefits,
          'apply_url', j.apply_url,
          'external_source', j.external_source,
          'external_id', j.external_id,
          'external_slug', j.external_slug,
          'source_last_modified_at', j.source_last_modified_at::text,
          'synced_at', j.synced_at::text,
          'job_categories', json_build_object('code', jc.code, 'name', jc.name),
          'employment_types', json_build_object('code', et.code, 'name', et.name)
        ) as jobs
      from bookmarks b
      join jobs j on j.id = b.job_id
      join job_categories jc on jc.id = j.job_category_id
      join employment_types et on et.id = j.employment_type_id
      where b.user_id = $1
        and b.content_type = 'job'
        and j.is_active = true
        and (j.published_at is null or j.published_at <= now())
      order by b.created_at desc
    `,
    [session.userId],
  );
  return rows.map(mapBookmarkRowToDto).filter((item): item is BookmarkDto => item !== null);
}

export async function saveJobBookmarkForSession(session: AuthSessionPayload, jobId: string) {
  const user = await requireActiveUser(session);
  if (!user) return "unauthorized" as const;

  const job = await getActivePublishedJob(jobId);
  if (!job) return "not_found" as const;

  await dbQuery(
    `
      insert into bookmarks (user_id, content_type, source_system, job_id)
      values ($1, 'job', 'cms', $2)
      on conflict (user_id, content_type, job_id) do nothing
    `,
    [session.userId, jobId],
  );
  return "saved" as const;
}

export async function deleteJobBookmarkForSession(session: AuthSessionPayload, jobId: string) {
  const user = await requireActiveUser(session);
  if (!user) return "unauthorized" as const;

  await dbQuery("delete from bookmarks where user_id = $1 and content_type = 'job' and job_id = $2", [session.userId, jobId]);
  return "deleted" as const;
}
