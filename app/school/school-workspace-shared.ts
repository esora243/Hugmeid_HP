import { schoolArticles } from "@/lib/data";
import type { TimetableClassDto, TimetableDay, TimetableGridDto } from "@/lib/timetable-dto";

export type SchoolWorkspaceTab = "timetable" | "syllabus" | "articles";
export type SchoolWorkspaceView = "main" | "detail";
export type SchoolClassSource = "personal" | "shared";
export type SchoolArticle = (typeof schoolArticles)[number];

export const CATEGORIES = ["すべて", ...Array.from(new Set(schoolArticles.map((article) => article.category)))];

export const DAY_ACCENTS: Record<TimetableDay, string> = {
  月: "border-sky-100 bg-sky-50 text-sky-900",
  火: "border-rose-100 bg-rose-50 text-rose-900",
  水: "border-emerald-100 bg-emerald-50 text-emerald-900",
  木: "border-amber-100 bg-amber-50 text-amber-900",
  金: "border-violet-100 bg-violet-50 text-violet-900",
  土: "border-gray-100 bg-gray-50 text-gray-900",
  日: "border-gray-100 bg-gray-50 text-gray-900",
};

export function emptyTimetableGrid(): TimetableGridDto {
  return { 月: {}, 火: {}, 水: {}, 木: {}, 金: {}, 土: {}, 日: {} };
}

export function formatClassTime(item: TimetableClassDto) {
  if (!item.startsAt || !item.endsAt) return `${item.period}限`;
  return `${item.period}限 ${item.startsAt}-${item.endsAt}`;
}
