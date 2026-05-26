import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { mapBookmarkRowToDto } from "../lib/bookmark-requests";
import { deleteJobBookmarkJson, saveJobBookmarkJson } from "../lib/bookmark-route-handlers";
import { withRequiredSession } from "../lib/api-results";
import type { JobRow } from "../lib/jobs";

function jobRow(overrides: Partial<JobRow> = {}): JobRow {
  return {
    id: "job-1",
    slug: "sample-job",
    title: "Sample Job",
    location_pref: "静岡県",
    location_detail: "浜松市",
    summary: "Summary",
    description_md: "Description",
    published_at: "2026-05-01T00:00:00.000Z",
    salary_min: 1200,
    salary_display: "時給1,200円",
    work_schedule: "週1日",
    company_name: "Sample Clinic",
    company_type: "clinic",
    requirements_summary: "医学部生",
    requirements_list: ["医学部生"],
    benefits: ["交通費支給"],
    apply_url: "https://example.com/apply",
    external_source: "cms",
    external_id: "external-1",
    external_slug: "sample-job",
    source_last_modified_at: null,
    synced_at: "2026-05-01T00:00:00.000Z",
    job_categories: { code: "clinical", name: "臨床" },
    employment_types: { code: "part_time", name: "アルバイト" },
    ...overrides,
  };
}

test("bookmark SQL stays scoped to active users and active published job bookmarks", () => {
  const bookmarks = readFileSync(join(process.cwd(), "lib/bookmarks.ts"), "utf8");
  const jobs = readFileSync(join(process.cwd(), "lib/jobs.ts"), "utf8");

  assert.match(bookmarks, /deactivated_at is null/);
  assert.match(bookmarks, /b\.user_id = \$1/);
  assert.match(bookmarks, /b\.content_type = 'job'/);
  assert.match(bookmarks, /j\.is_active = true/);
  assert.match(bookmarks, /j\.published_at is null or j\.published_at <= now\(\)/);
  assert.match(jobs, /where j\.id = \$1/);
  assert.match(jobs, /and j\.is_active = true/);
  assert.match(jobs, /and \(j\.published_at is null or j\.published_at <= now\(\)\)/);
  assert.match(jobs, /normalizeExternalHttpsUrl\(row\.apply_url\)/);
});

test("bookmark delete does not require the job to remain publicly bookmarkable", () => {
  const implementation = readFileSync(join(process.cwd(), "lib/bookmarks.ts"), "utf8");
  const deleteFunction = implementation.match(/export async function deleteJobBookmarkForSession[\s\S]*?\n}/)?.[0] ?? "";

  assert.doesNotMatch(deleteFunction, /getActivePublishedJob/);
  assert.match(deleteFunction, /delete from bookmarks/);
  assert.match(deleteFunction, /content_type = 'job'/);
});

test("bookmark rows map to saved job DTOs without campaign sync", () => {
  const dto = mapBookmarkRowToDto({ id: "bookmark-1", created_at: "2026-05-10T00:00:00.000Z", jobs: jobRow() });

  assert.deepEqual(dto, {
    id: "bookmark-1",
    type: "job",
    savedAt: "2026-05-10T00:00:00.000Z",
    job: {
      id: "job-1",
      slug: "sample-job",
      title: "Sample Job",
      category: { code: "clinical", name: "臨床" },
      employmentType: { code: "part_time", name: "アルバイト" },
      prefecture: "静岡県",
      location: "浜松市",
      salaryMin: 1200,
      salaryDisplay: "時給1,200円",
      schedule: "週1日",
      companyName: "Sample Clinic",
      companyType: "clinic",
      requirements: "医学部生",
      summary: "Summary",
      publishedAt: "2026-05-01T00:00:00.000Z",
      isSaved: true,
    },
  });
});

test("bookmark routes require a session before personal data access", () => {
  const listRoute = readFileSync(join(process.cwd(), "app/api/me/bookmarks/route.ts"), "utf8");
  const itemRoute = readFileSync(join(process.cwd(), "app/api/me/bookmarks/jobs/[jobId]/route.ts"), "utf8");
  const routeHelper = readFileSync(join(process.cwd(), "lib/next-json-route.ts"), "utf8");
  const resultHelper = readFileSync(join(process.cwd(), "lib/api-results.ts"), "utf8");

  assert.match(listRoute, /sessionJsonRoute/);
  assert.match(itemRoute, /guardedSessionJsonRoute/);
  assert.match(routeHelper, /readSessionFromCookies/);
  assert.match(routeHelper, /withRequiredSession/);
  assert.match(resultHelper, /apiErrorResult\("unauthorized", "Login is required", 401\)/);
});

test("shared session boundary does not touch personal data dependencies without a session", async () => {
  let calls = 0;

  assert.deepEqual(
    await withRequiredSession(
      async () => null,
      async () => {
        calls += 1;
        return { body: { ok: true } };
      },
    ),
    { body: { ok: false, error: { code: "unauthorized", message: "Login is required" } }, status: 401 },
  );
  assert.equal(calls, 0);
});

test("bookmark JSON handlers preserve POST not-found and DELETE idempotency contracts", async () => {
  const session = { userId: "user-1" };

  assert.deepEqual(
    await saveJobBookmarkJson({
      saveBookmark: async () => "not_found",
    }, session, "inactive-job"),
    { body: { ok: false, error: { code: "not_found", message: "Job is not bookmarkable" } }, status: 404 },
  );
  assert.deepEqual(
    await deleteJobBookmarkJson({
      deleteBookmark: async () => "deleted",
    }, session, "stale-job"),
    { body: { ok: true, saved: false } },
  );
});
