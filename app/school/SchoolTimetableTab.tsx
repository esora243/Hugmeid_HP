import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { TimetableClassDto, TimetableDay, TimetableGridDto } from "@/lib/timetable-dto";
import { DAY_ACCENTS } from "./school-workspace-shared";

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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="p-1" aria-hidden="true"><ChevronLeft size={20} className="text-gray-300" /></div>
        <div className="text-center">
          <span className="block font-bold text-gray-800">マイ時間割</span>
          <span className="block text-[10px] text-gray-400">devユーザーのログイン後画面想定</span>
        </div>
        <div className="p-1" aria-hidden="true"><ChevronRight size={20} className="text-gray-300" /></div>
      </div>

      {!authHydrated || loadingMyTimetable ? (
        <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
          <Loader2 className="mx-auto text-orange-300 mb-3 animate-spin" size={40} />
          <p className="font-bold text-gray-800">時間割を読み込んでいます</p>
        </div>
      ) : !isLoggedIn ? (
        <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
          <Calendar className="mx-auto text-orange-200 mb-3" size={40} />
          <p className="font-bold text-gray-800 mb-2">マイ時間割にはログインが必要です</p>
          <p className="text-sm text-gray-500 mb-4">シラバスから授業を探すことはできます。</p>
          <button onClick={onLogin} className="bg-orange-500 text-white font-bold py-2 px-5 rounded-full shadow-sm hover:bg-orange-600 transition-colors">ログインする</button>
        </div>
      ) : myTimetableError ? (
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
          <Calendar className="mx-auto text-red-200 mb-3" size={40} />
          <p className="font-bold text-gray-800 mb-2">マイ時間割を取得できませんでした</p>
          <p className="text-sm text-gray-500">{myTimetableError}</p>
        </div>
      ) : hasTimetable ? (
        <div className="bg-white">
          <div className="grid grid-cols-[24px_repeat(5,minmax(0,1fr))] gap-1 mb-2">
            <div />
            {days.map((day) => (
              <div key={day} className="text-center flex flex-col items-center">
                <span className="text-gray-800 text-xs font-bold h-6 flex items-center justify-center">{day}</span>
                <span className="text-gray-500 text-[10px] mt-0.5">曜</span>
              </div>
            ))}
          </div>

          {periods.map((period) => (
            <div key={period} className="grid grid-cols-[24px_repeat(5,minmax(0,1fr))] gap-1 mb-1">
              <div className="flex flex-col items-center justify-center text-[10px] text-gray-400">
                <span className="font-bold">{period}</span>
                <span className="scale-75">限</span>
              </div>
              {days.map((day) => {
                const cell = timetableGrid[day]?.[period];
                if (!cell) {
                  return <div key={`${day}-${period}`} className="border border-gray-200 rounded-md bg-gray-50/30 min-h-[76px]" />;
                }
                return (
                  <button
                    key={`${day}-${period}`}
                    onClick={() => onSelectClass(cell)}
                    className={`relative border rounded-md p-1.5 min-h-[76px] flex flex-col text-left hover:opacity-80 transition-opacity ${DAY_ACCENTS[day]}`}
                  >
                    <span className="font-bold text-[10px] leading-tight tracking-tight line-clamp-3">{cell.title}</span>
                    {cell.room ? <span className="text-[8px] mt-1 opacity-70 leading-tight line-clamp-1">{cell.room}</span> : null}
                    {cell.instructor ? <span className="text-[8px] mt-auto opacity-60 leading-tight line-clamp-1">{cell.instructor}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
          <Calendar className="mx-auto text-orange-200 mb-3" size={40} />
          <p className="font-bold text-gray-800 mb-2">マイ時間割はまだ空です</p>
          <p className="text-sm text-gray-500 mb-4">シラバスから授業を追加するとここに表示されます。</p>
          <button onClick={onOpenSyllabus} className="bg-orange-500 text-white font-bold py-2 px-5 rounded-full shadow-sm hover:bg-orange-600 transition-colors">授業を探す</button>
        </div>
      )}
    </div>
  );
}
