import type { BookmarkDto } from "./job-dto";
import type { SavedEntry } from "./types";

function readSavedEntries(value: unknown): SavedEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SavedEntry => {
    if (!item || typeof item !== "object") return false;
    const entry = item as Partial<SavedEntry>;
    return (entry.type === "campaign" || entry.type === "job") && typeof entry.id === "string" && typeof entry.savedAt === "string";
  });
}

export function readCampaignSavedEntries(value: unknown): SavedEntry[] {
  return readSavedEntries(value).filter((entry) => entry.type === "campaign");
}

export function readLegacyJobSavedEntries(value: unknown): SavedEntry[] {
  return readSavedEntries(value).filter((entry) => entry.type === "job");
}

export function jobBookmarksToSavedEntries(bookmarks: BookmarkDto[]): SavedEntry[] {
  return bookmarks.map((bookmark) => ({ type: "job", id: bookmark.job.id, savedAt: bookmark.savedAt }));
}
