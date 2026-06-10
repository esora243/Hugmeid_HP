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

// ==========================================
// ▼ 追加：時間割UI用のステータス・スタイル・日付計算 ▼
// ==========================================

export const STATUS_DOTS = [
  { key: "assignment", label: "課題", className: "bg-blue-500" },
  { key: "quiz", label: "小テスト", className: "bg-red-500" },
  { key: "exam", label: "試験", className: "bg-purple-500" },
] as const;

export const SUBJECT_CATEGORY_STYLES = {
  anatomy: {
    label: "解剖・組織",
    bg: "bg-red-50/50",
    border: "border-red-100",
    text: "text-red-900",
    dot: "bg-red-400",
  },
  physiology: {
    label: "生理・薬理",
    bg: "bg-blue-50/50",
    border: "border-blue-100",
    text: "text-blue-900",
    dot: "bg-blue-400",
  },
  biochem: {
    label: "生化・遺伝",
    bg: "bg-amber-50/50",
    border: "border-amber-100",
    text: "text-amber-900",
    dot: "bg-amber-400",
  },
  pathology: {
    label: "病理・免疫",
    bg: "bg-purple-50/50",
    border: "border-purple-100",
    text: "text-purple-900",
    dot: "bg-purple-400",
  },
  clinical: {
    label: "臨床・公衆",
    bg: "bg-emerald-50/50",
    border: "border-emerald-100",
    text: "text-emerald-900",
    dot: "bg-emerald-400",
  },
  other: {
    label: "その他",
    bg: "bg-gray-50/50",
    border: "border-gray-200",
    text: "text-gray-800",
    dot: "bg-gray-400",
  },
} as const;

export function classifySubject(title: string): keyof typeof SUBJECT_CATEGORY_STYLES {
  if (/解剖|組織|発生|肉眼/i.test(title)) return "anatomy";
  if (/生理|薬理|神経/i.test(title)) return "physiology";
  if (/生化|分子|遺伝/i.test(title)) return "biochem";
  if (/病理|免疫|微生物|感染/i.test(title)) return "pathology";
  if (/内科|外科|公衆衛生|法医|臨床/i.test(title)) return "clinical";
  return "other";
}

export function deriveClassStatus(cell: any): string[] {
  // ※必要に応じてステータス（課題あり等）の判定を追加できます
  return [];
}

// カレンダーの「〇月〇日の週」ラベルを生成する関数
export function formatWeekLabel(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日の週`;
}

// 基準日からその週の各曜日の日付を計算する関数
export function getWeekDates(referenceDate: Date, days: TimetableDay[]): Record<string, Date> {
  const result: Record<string, Date> = {};
  const base = new Date(referenceDate);
  const dayOfWeek = base.getDay(); // 0: 日曜, 1: 月曜, ...
  
  // 月曜日を週の始まりとして計算
  const diff = base.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(base.setDate(diff));

  const dayMap: Record<TimetableDay, number> = { "月": 0, "火": 1, "水": 2, "木": 3, "金": 4, "土": 5, "日": 6 };
  
  days.forEach((d) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayMap[d]);
    result[d] = date;
  });
  
  return result;
}