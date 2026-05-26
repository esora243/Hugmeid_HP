import assert from "node:assert/strict";
import test from "node:test";
import { jobBookmarksToSavedEntries, readCampaignSavedEntries, readLegacyJobSavedEntries } from "../lib/saved-items";
import type { BookmarkDto } from "../lib/job-dto";

test("readCampaignSavedEntries keeps campaign local storage entries only", () => {
  assert.deepEqual(
    readCampaignSavedEntries([
      { type: "campaign", id: "campaign-1", savedAt: "2026-05-10T00:00:00.000Z" },
      { type: "job", id: "job-1", savedAt: "2026-05-10T00:00:00.000Z" },
      { type: "campaign", id: 123, savedAt: "2026-05-10T00:00:00.000Z" },
      null,
    ]),
    [{ type: "campaign", id: "campaign-1", savedAt: "2026-05-10T00:00:00.000Z" }],
  );
});

test("readLegacyJobSavedEntries keeps legacy local job entries only", () => {
  assert.deepEqual(
    readLegacyJobSavedEntries([
      { type: "campaign", id: "campaign-1", savedAt: "2026-05-10T00:00:00.000Z" },
      { type: "job", id: "job-1", savedAt: "2026-05-10T00:00:00.000Z" },
      { type: "job", id: 123, savedAt: "2026-05-10T00:00:00.000Z" },
      null,
    ]),
    [{ type: "job", id: "job-1", savedAt: "2026-05-10T00:00:00.000Z" }],
  );
});

test("jobBookmarksToSavedEntries maps server bookmarks into save-state entries", () => {
  const bookmarks: BookmarkDto[] = [
    {
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
    },
  ];

  assert.deepEqual(jobBookmarksToSavedEntries(bookmarks), [
    { type: "job", id: "job-1", savedAt: "2026-05-10T00:00:00.000Z" },
  ]);
});
