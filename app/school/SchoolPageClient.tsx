"use client";

import dynamic from "next/dynamic";
import type { TimetableClassDto, TimetableDay } from "@/lib/timetable-dto";

type SchoolPageClientProps = {
  initialSharedClasses: TimetableClassDto[];
  initialDays: TimetableDay[];
  initialPeriods: number[];
  initialSharedClassesError: string | null;
};

const SchoolWorkspaceClient = dynamic(
  () => import("@/app/school/SchoolWorkspaceClient").then((module) => module.SchoolWorkspaceClient),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-lg mx-auto pb-8 bg-white min-h-screen animate-fade-in">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">学校</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">共有授業データを閲覧中</p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <div className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold bg-orange-500 text-white shadow-md">時間割</div>
            <div className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-50 text-gray-600">シラバス</div>
            <div className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-50 text-gray-600">勉強系記事</div>
          </div>
        </div>
        <div className="px-3 pt-4">
          <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
            <p className="font-bold text-gray-800">学校ページを読み込んでいます</p>
          </div>
        </div>
      </div>
    ),
  },
);

export function SchoolPageClient(props: SchoolPageClientProps) {
  return <SchoolWorkspaceClient {...props} />;
}
