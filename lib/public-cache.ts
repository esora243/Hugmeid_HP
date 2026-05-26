import "server-only";

import { unstable_cache } from "next/cache";
import { getJobBySlugOrId, listJobs } from "@/lib/jobs";
import { listTimetableClasses } from "@/lib/timetable";
import { getProfileOptions } from "@/lib/users";

export const listCachedJobs = unstable_cache(async () => listJobs(), ["public-jobs-v1"], {
  revalidate: 30,
  tags: ["jobs"],
});

export const getCachedJobBySlugOrId = unstable_cache(
  async (slugOrId: string) => getJobBySlugOrId(slugOrId),
  ["public-job-detail-v1"],
  {
    revalidate: 300,
    tags: ["jobs"],
  },
);

export const listCachedTimetableClasses = unstable_cache(
  async () => listTimetableClasses(),
  ["public-timetable-v1"],
  {
    revalidate: 30,
    tags: ["timetable"],
  },
);

export const getCachedProfileOptions = unstable_cache(
  async () => getProfileOptions(),
  ["public-profile-options-v1"],
  {
    revalidate: 300,
    tags: ["profile-options"],
  },
);
