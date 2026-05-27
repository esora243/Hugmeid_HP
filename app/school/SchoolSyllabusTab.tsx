import { Calendar, Loader2, Search } from "lucide-react";
import type { TimetableClassDto } from "@/lib/timetable-dto";

type SchoolSyllabusTabProps = {
  searchQuery: string;
  syllabusUrl: string;
  loadingSharedClasses: boolean;
  sharedClassesError: string | null;
  syllabusClasses: TimetableClassDto[];
  myClassIds: Set<string>;
  mutatingClassIds: Set<string>;
  authHydrated: boolean;
  isLoggedIn: boolean;
  onSearchQueryChange: (value: string) => void;
  onSelectClass: (item: TimetableClassDto) => void;
  onToggleClass: (classId: string, inMyTimetable: boolean) => void;
};

export function SchoolSyllabusTab({
  searchQuery,
  syllabusUrl,
  loadingSharedClasses,
  sharedClassesError,
  syllabusClasses,
  myClassIds,
  mutatingClassIds,
  authHydrated,
  isLoggedIn,
  onSearchQueryChange,
  onSelectClass,
  onToggleClass,
}: SchoolSyllabusTabProps) {
  return (
    <div className="space-y-4">
      <div className="relative px-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input type="text" placeholder="授業名・教員・教室で検索" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm transition-colors" />
      </div>

      {syllabusUrl ? (
        <div className="w-full h-72 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-50">
          <iframe src={syllabusUrl} title="大学シラバス" className="relative z-10 w-full h-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </div>
      ) : null}

      {loadingSharedClasses ? (
        <div className="rounded-2xl border border-orange-100 p-8 text-center"><Loader2 className="mx-auto text-orange-300 mb-3 animate-spin" size={36} /></div>
      ) : sharedClassesError ? (
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
          <Calendar className="mx-auto text-red-200 mb-3" size={40} />
          <p className="font-bold text-gray-800 mb-2">授業データを取得できませんでした</p>
          <p className="text-sm text-gray-500">{sharedClassesError}</p>
        </div>
      ) : syllabusClasses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
          <Calendar className="mx-auto text-orange-200 mb-3" size={40} />
          <p className="font-bold text-gray-800 mb-2">授業データは未登録です</p>
          <p className="text-sm text-gray-500">授業seedまたはシラバスURLを設定してください。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {syllabusClasses.map((item) => {
            const inMyTimetable = myClassIds.has(item.id);
            const mutating = mutatingClassIds.has(item.id);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-orange-50 p-4 shadow-sm hover:shadow-md transition-shadow">
                <button onClick={() => onSelectClass(item)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-800 leading-snug">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.instructor || "教員未設定"}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">{item.day}{item.period}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">{[item.room, item.location].filter(Boolean).join(" / ") || "教室未設定"}</p>
                </button>
                <button
                  onClick={() => onToggleClass(item.id, inMyTimetable)}
                  disabled={mutating || !authHydrated}
                  className={`mt-3 w-full py-2 rounded-xl text-xs font-bold disabled:opacity-60 ${inMyTimetable ? "bg-gray-100 text-gray-700" : "bg-orange-500 text-white"}`}
                >
                  {mutating ? "更新中..." : inMyTimetable ? "マイ時間割から削除" : isLoggedIn ? "マイ時間割に追加" : "ログインして追加"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
