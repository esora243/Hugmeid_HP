"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { TimetableClassDto, TimetableDay, TimetableGridDto } from "@/lib/timetable-dto";
import {
  STATUS_DOTS,
  SUBJECT_CATEGORY_STYLES,
  classifySubject,
  deriveClassStatus,
  formatWeekLabel,
  getWeekDates,
} from "./school-workspace-shared";

type SchoolTimetableTabProps = {
  authHydrated: boolean;
  loadingMyTimetable: boolean;
  isLoggedIn: boolean;
  myTimetableError: string | null;
  hasTimetable: boolean;
  days: TimetableDay[];
  periods: number[];
  timetableGrid: TimetableGridDto;
  onLogin: () => void;
  onOpenSyllabus: () => void;
  onSelectClass: (item: TimetableClassDto) => void;
};

export function SchoolTimetableTab({
  authHydrated,
  loadingMyTimetable,
  isLoggedIn,
  myTimetableError,
  hasTimetable,
  days,
  periods,
  timetableGrid,
  onLogin,
  onOpenSyllabus,
  onSelectClass,
}: SchoolTimetableTabProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const referenceDate = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekLabel = useMemo(() => formatWeekLabel(referenceDate), [referenceDate]);
  const weekDates = useMemo(() => getWeekDates(referenceDate, days), [referenceDate, days]);
  const today = useMemo(() => new Date(), []);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const hasAnyClass = useMemo(() => {
    if (!hasTimetable) return false;
    return days.some((d) => periods.some((p) => timetableGrid[d]?.[p]));
  }, [hasTimetable, days, periods, timetableGrid]);

  return (
    <div className="space-y-3">
      {/* 月週ナビ */}
      <div className="flex items-center justify-between px-2 mb-1">
        <button
          type="button"
          onClick={() => setWeekOffset((v) => v - 1)}
          className="p-1.5 rounded-full hover:bg-orange-50 text-gray-500 hover:text-orange-500 transition-colors"
          aria-label="前の週"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <span className="block font-bold text-gray-800 text-sm">{weekLabel}</span>
          {!isLoggedIn ? (
            <span className="block text-[10px] text-gray-400">共有授業を閲覧中</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setWeekOffset((v) => v + 1)}
          className="p-1.5 rounded-full hover:bg-orange-50 text-gray-500 hover:text-orange-500 transition-colors"
          aria-label="次の週"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {!authHydrated || loadingMyTimetable ? (
        <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
          <Loader2 className="mx-auto text-orange-300 mb-3 animate-spin" size={40} />
          <p className="font-bold text-gray-800">時間割を読み込んでいます</p>
        </div>
      ) : !isLoggedIn && !hasAnyClass ? (
        <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
          <Calendar className="mx-auto text-orange-200 mb-3" size={40} />
          <p className="font-bold text-gray-800 mb-2">マイ時間割にはログインが必要です</p>
          <p className="text-sm text-gray-500 mb-4">シラバスから授業を探すことはできます。</p>
          <button
            onClick={onLogin}
            className="bg-orange-500 text-white font-bold py-2 px-5 rounded-full shadow-sm hover:bg-orange-600 transition-colors"
          >
            ログインする
          </button>
        </div>
      ) : myTimetableError ? (
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
          <Calendar className="mx-auto text-red-200 mb-3" size={40} />
          <p className="font-bold text-gray-800 mb-2">マイ時間割を取得できませんでした</p>
          <p className="text-sm text-gray-500">{myTimetableError}</p>
        </div>
      ) : (
        <>
          <div className="bg-white">
            {/* 曜日ヘッダー（日付 + 曜日） */}
            <div className="grid grid-cols-[28px_repeat(5,minmax(0,1fr))] gap-1 mb-2">
              <div />
              {days.slice(0, 5).map((day) => {
                const date = weekDates[day];
                const isToday = date ? isSameDay(date, today) : false;
                return (
                  <div key={day} className="text-center flex flex-col items-center">
                    <span
                      className={`text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full ${
                        isToday ? "bg-orange-500 text-white" : "text-gray-800"
                      }`}
                    >
                      {date?.getDate() ?? ""}
                    </span>
                    <span
                      className={`text-[10px] mt-0.5 font-medium ${
                        isToday ? "text-orange-500" : "text-gray-500"
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>

            {periods.map((period) => (
              <div
                key={period}
                className="grid grid-cols-[28px_repeat(5,minmax(0,1fr))] gap-1 mb-1"
              >
                <div className="flex flex-col items-center justify-center text-[10px] text-gray-400">
                  <span className="font-bold text-gray-600">{period}</span>
                  <span className="scale-75">限</span>
                </div>
                {days.slice(0, 5).map((day) => {
                  const cell = timetableGrid[day]?.[period];
                  if (!cell) {
                    return (
                      <div
                        key={`${day}-${period}`}
                        className="border border-gray-100 rounded-lg bg-white min-h-[78px]"
                      />
                    );
                  }
                  // 「続き」セル: 同じ授業が前の限にもある場合は薄く表示
                  const prev = timetableGrid[day]?.[period - 1];
                  const isContinuation = prev && prev.id === cell.id;
                  const category = classifySubject(cell.title);
                  const style = SUBJECT_CATEGORY_STYLES[category];
                  const statuses = deriveClassStatus(cell);

                  return (
                    <button
                      key={`${day}-${period}`}
                      onClick={() => onSelectClass(cell)}
                      className={`relative border ${style.border} ${style.bg} ${style.text} rounded-lg p-1.5 min-h-[78px] flex flex-col text-left hover:shadow-md hover:-translate-y-0.5 transition-all`}
                    >
                      {isContinuation ? (
                        <span className="font-medium text-[10px] leading-tight opacity-60">
                          (続き)
                        </span>
                      ) : (
                        <>
                          <span className="font-bold text-[11px] leading-tight tracking-tight line-clamp-2">
                            {cell.title}
                          </span>
                          {cell.room ? (
                            <span className="text-[9px] mt-1 opacity-70 leading-tight line-clamp-1">
                              {cell.room}
                            </span>
                          ) : null}
                          {statuses.length > 0 ? (
                            <div className="flex items-center gap-0.5 mt-auto pt-1">
                              {statuses.map((s) => {
                                const dot = STATUS_DOTS.find((d) => d.key === s);
                                if (!dot) return null;
                                return (
                                  <span
                                    key={s}
                                    className={`w-1.5 h-1.5 rounded-full ${dot.className}`}
                                    aria-label={dot.label}
                                  />
                                );
                              })}
                            </div>
                          ) : null}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 凡例 */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-4 pb-2 text-[10px] text-gray-500">
            {(["anatomy", "physiology", "biochem", "pathology", "clinical"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-sm ${SUBJECT_CATEGORY_STYLES[k].dot}`} />
                {SUBJECT_CATEGORY_STYLES[k].label}
              </span>
            ))}
            {STATUS_DOTS.map((d) => (
              <span key={d.key} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${d.className}`} />
                {d.label}
              </span>
            ))}
          </div>

          {/* 空時間割の場合 */}
          {isLoggedIn && !hasAnyClass ? (
            <div className="bg-white rounded-2xl border border-orange-100 p-6 text-center">
              <Calendar className="mx-auto text-orange-200 mb-2" size={32} />
              <p className="font-bold text-gray-800 mb-2 text-sm">マイ時間割はまだ空です</p>
              <p className="text-xs text-gray-500 mb-4">
                シラバスから授業を追加するとここに表示されます。
              </p>
              <button
                onClick={onOpenSyllabus}
                className="bg-orange-500 text-white font-bold py-2 px-5 rounded-full shadow-sm hover:bg-orange-600 transition-colors text-sm"
              >
                授業を探す
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
