import { BookOpen, ChevronLeft, MapPin, UserRound } from "lucide-react";
import type { TimetableClassDto } from "@/lib/timetable-dto";
import { DAY_ACCENTS, formatClassTime } from "./school-workspace-shared";

type SchoolClassDetailViewProps = {
  selectedClass: TimetableClassDto;
  isLoggedIn: boolean;
  isSelectedInMyTimetable: boolean;
  isMutating: boolean;
  onBack: () => void;
  onLogin: () => void;
  onToggleClass: () => void;
};

export function SchoolClassDetailView({
  selectedClass,
  isLoggedIn,
  isSelectedInMyTimetable,
  isMutating,
  onBack,
  onLogin,
  onToggleClass,
}: SchoolClassDetailViewProps) {
  return (
    <div className="w-full max-w-lg mx-auto bg-white min-h-screen pb-20 animate-fade-in">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-800">授業の詳細</h2>
        <div className="w-10 h-10" />
      </div>

      <div className="px-5 pt-5 space-y-4">
        <div className={`rounded-3xl border p-5 ${DAY_ACCENTS[selectedClass.day]}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold bg-white/70 px-3 py-1 rounded-full">{selectedClass.day}曜 {formatClassTime(selectedClass)}</span>
            <span className="text-[10px] font-bold bg-white/70 px-2 py-1 rounded-full">{selectedClass.isOfficial ? "公式" : "ユーザー編集"}</span>
          </div>
          <h1 className="text-xl font-bold leading-snug mb-3">{selectedClass.title}</h1>
          <div className="space-y-2 text-sm">
            {selectedClass.instructor ? <p className="flex items-center gap-2"><UserRound size={15} /> {selectedClass.instructor}</p> : null}
            {selectedClass.room || selectedClass.location ? <p className="flex items-center gap-2"><MapPin size={15} /> {[selectedClass.room, selectedClass.location].filter(Boolean).join(" / ")}</p> : null}
            {selectedClass.universityName ? <p className="text-xs opacity-70">{selectedClass.universityName} / {selectedClass.academicYear ?? "年度未設定"}年度 第{selectedClass.termNumber ?? "-"}ターム</p> : null}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><BookOpen size={18} className="text-pink-400" /> この授業で次に接続するもの</h3>
          <p className="text-sm text-gray-500 leading-relaxed">Zoom URL、課題、個人メモ、タグは次のバックエンドAPI接続で扱います。</p>
          <div className="mt-4">
            {!isLoggedIn ? (
              <button onClick={onLogin} className="w-full py-2.5 rounded-xl bg-pink-500 text-white text-sm font-bold">ログインして時間割に追加</button>
            ) : (
              <button
                onClick={onToggleClass}
                disabled={isMutating}
                className={`w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 ${isSelectedInMyTimetable ? "bg-gray-100 text-gray-700" : "bg-pink-500 text-white"}`}
              >
                {isMutating ? "更新中..." : isSelectedInMyTimetable ? "マイ時間割から削除" : "マイ時間割に追加"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
