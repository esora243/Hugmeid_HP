"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AuthBoundary } from "@/components/AuthBoundary";
import { useAuth } from "@/components/AuthContext";
import { readRequiredApiJson } from "@/lib/api-client";
import { schoolArticles } from "@/lib/data";
import { siteConfig } from "@/lib/site";
import type {
  TimetableClassDto,
  TimetableDay,
  TimetableGridDto,
  UserTimetableResponse,
} from "@/lib/timetable-dto";
import { SchoolArticlesTab } from "./SchoolArticlesTab";
import { SchoolClassDetailView } from "./SchoolClassDetailView";
import { SchoolSyllabusTab } from "./SchoolSyllabusTab";
import { SchoolTimetableTab } from "./SchoolTimetableTab";
import {
  CATEGORIES,
  emptyTimetableGrid,
  type SchoolClassSource,
  type SchoolWorkspaceTab,
  type SchoolWorkspaceView,
} from "./school-workspace-shared";

type MutationSuccess = { ok: true };

type SchoolPageClientProps = {
  initialSharedClasses: TimetableClassDto[];
  initialDays: TimetableDay[];
  initialPeriods: number[];
  initialSharedClassesError: string | null;
};

// ▼ 研修病院タブを削除
const TAB_BUTTONS: Array<{ key: SchoolWorkspaceTab; label: string; icon: string }> = [
  { key: "timetable", label: "時間割", icon: "📅" },
  { key: "syllabus", label: "シラバス", icon: "📄" },
  { key: "articles", label: "勉強系記事", icon: "📚" },
];

function SchoolWorkspaceInner({
  initialSharedClasses,
  initialDays,
  initialPeriods,
  initialSharedClassesError,
}: SchoolPageClientProps) {
  const { hydrated: authHydrated, isLoggedIn, me, openLoginModal } = useAuth();
  const userId = me?.id ?? null;
  const [activeTab, setActiveTab] = useState<SchoolWorkspaceTab>("timetable");
  const [view, setView] = useState<SchoolWorkspaceView>("main");
  const [selectedClass, setSelectedClass] = useState<TimetableClassDto | null>(null);
  const [selectedClassSource, setSelectedClassSource] = useState<SchoolClassSource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [days, setDays] = useState<TimetableDay[]>(initialDays);
  const [periods, setPeriods] = useState(initialPeriods);
  const [myTimetableGrid, setMyTimetableGrid] = useState<TimetableGridDto>(() => emptyTimetableGrid());
  const [myClasses, setMyClasses] = useState<TimetableClassDto[]>([]);
  const [myTimetableUserId, setMyTimetableUserId] = useState<string | null>(null);
  const [sharedClasses] = useState<TimetableClassDto[]>(initialSharedClasses);
  const loadingSharedClasses = false;
  const [loadingMyTimetable, setLoadingMyTimetable] = useState(false);
  const [sharedClassesError] = useState<string | null>(initialSharedClassesError);
  const [myTimetableError, setMyTimetableError] = useState<string | null>(null);
  const [mutatingClassIds, setMutatingClassIds] = useState<Set<string>>(() => new Set());
  const [showPRBanner, setShowPRBanner] = useState(true);
  const myTimetableRequestId = useRef(0);
  const authState = useRef({ authHydrated, isLoggedIn, userId });

  const clearMyTimetable = useCallback(() => {
    setMyClasses([]);
    setMyTimetableGrid(emptyTimetableGrid());
    setMyTimetableUserId(null);
    setMyTimetableError(null);
  }, []);

  useEffect(() => {
    const previousUserId = authState.current.userId;
    authState.current = { authHydrated, isLoggedIn, userId };
    if (!isLoggedIn || previousUserId !== userId) {
      myTimetableRequestId.current += 1;
      clearMyTimetable();
      setLoadingMyTimetable(false);
      if (selectedClassSource === "personal") {
        setSelectedClass(null);
        setSelectedClassSource(null);
        setView("main");
      }
    }
  }, [authHydrated, clearMyTimetable, isLoggedIn, selectedClassSource, userId]);

  const refreshMyTimetable = useCallback(
    async (cancelled?: () => boolean) => {
      const currentAuthAtStart = authState.current;
      if (
        currentAuthAtStart.authHydrated !== authHydrated ||
        currentAuthAtStart.isLoggedIn !== isLoggedIn ||
        currentAuthAtStart.userId !== userId
      ) {
        return;
      }

      if (!authHydrated || !isLoggedIn || !userId) {
        myTimetableRequestId.current += 1;
        clearMyTimetable();
        setLoadingMyTimetable(false);
        return;
      }

      const requestId = myTimetableRequestId.current + 1;
      myTimetableRequestId.current = requestId;
      const requestUserId = userId;
      const isCurrentRequest = () => {
        const currentAuth = authState.current;
        return (
          !cancelled?.() &&
          requestId === myTimetableRequestId.current &&
          currentAuth.authHydrated &&
          currentAuth.isLoggedIn &&
          currentAuth.userId === requestUserId
        );
      };

      setLoadingMyTimetable(true);
      setMyTimetableError(null);
      try {
        const response = await fetch("/api/me/timetable", { cache: "no-store" });
        if (!isCurrentRequest()) return;
        const data = await readRequiredApiJson<UserTimetableResponse>(
          response,
          "マイ時間割の取得に失敗しました",
        );
        if (!isCurrentRequest()) return;
        setDays(data.days);
        setPeriods(data.periods);
        setMyClasses(data.items);
        setMyTimetableGrid(data.grid);
        setMyTimetableUserId(requestUserId);
      } catch (error) {
        if (!isCurrentRequest()) return;
        clearMyTimetable();
        setMyTimetableError(
          error instanceof Error ? error.message : "マイ時間割の取得に失敗しました",
        );
      } finally {
        if (requestId === myTimetableRequestId.current) setLoadingMyTimetable(false);
      }
    },
    [authHydrated, clearMyTimetable, isLoggedIn, userId],
  );

  useEffect(() => {
    let cancelled = false;
    void refreshMyTimetable(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [refreshMyTimetable]);

  const filteredArticles = useMemo(() => {
    return schoolArticles.filter((article) => {
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query || `${article.title} ${article.excerpt || ""}`.toLowerCase().includes(query);
      const matchCategory = selectedCategory === "すべて" || article.category === selectedCategory;
      return matchQuery && matchCategory;
    });
  }, [searchQuery, selectedCategory]);

  const syllabusClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sharedClasses;
    return sharedClasses.filter((item) =>
      [item.title, item.instructor, item.room, item.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [sharedClasses, searchQuery]);

  // ログイン済ならマイ時間割、未ログインなら共有のセルを表示
  const visibleMyClasses = useMemo(
    () => (myTimetableUserId === userId ? myClasses : []),
    [myClasses, myTimetableUserId, userId],
  );
  const visibleMyTimetableGrid = useMemo(
    () => (myTimetableUserId === userId ? myTimetableGrid : emptyTimetableGrid()),
    [myTimetableGrid, myTimetableUserId, userId],
  );

  // 未ログイン時に共有授業を簡易グリッド化（モックの「ログインしなくても枠が見える」体験を踏襲）
  const sharedTimetableGrid = useMemo<TimetableGridDto>(() => {
    const grid = emptyTimetableGrid();
    for (const item of sharedClasses) {
      if (!grid[item.day]) continue;
      if (!grid[item.day][item.period]) grid[item.day][item.period] = item;
    }
    return grid;
  }, [sharedClasses]);

  const displayGrid = isLoggedIn ? visibleMyTimetableGrid : sharedTimetableGrid;
  const myClassIds = useMemo(
    () => new Set(visibleMyClasses.map((item) => item.id)),
    [visibleMyClasses],
  );
  const isSelectedInMyTimetable = selectedClass ? myClassIds.has(selectedClass.id) : false;
  const hasTimetable = isLoggedIn ? visibleMyClasses.length > 0 : sharedClasses.length > 0;

  const selectClass = useCallback((item: TimetableClassDto, source: SchoolClassSource) => {
    setSelectedClass(item);
    setSelectedClassSource(source);
    setView("detail");
  }, []);

  const mutateClass = async (classId: string, action: "add" | "remove") => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (mutatingClassIds.has(classId)) return;

    setMutatingClassIds((current) => new Set(current).add(classId));
    try {
      const response = await fetch(
        action === "add"
          ? "/api/me/timetable"
          : `/api/me/timetable/classes/${encodeURIComponent(classId)}`,
        {
          method: action === "add" ? "POST" : "headers: action === 'add' ? { 'content-type': 'application/json' } : undefined",
          body: action === "add" ? JSON.stringify({ classId }) : undefined,
        },
      );
      await readRequiredApiJson<MutationSuccess>(
        response,
        action === "add" ? "時間割への追加に失敗しました" : "時間割からの削除に失敗しました",
      );
      if (authState.current.userId === userId) await refreshMyTimetable();
      toast.success(action === "add" ? "マイ時間割に追加しました" : "マイ時間割から削除しました");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "時間割の更新に失敗しました");
    } finally {
      setMutatingClassIds((current) => {
        const next = new Set(current);
        next.delete(classId);
        return next;
      });
    }
  };

  if (view === "detail" && selectedClass) {
    return (
      <SchoolClassDetailView
        selectedClass={selectedClass}
        isLoggedIn={isLoggedIn}
        isSelectedInMyTimetable={isSelectedInMyTimetable}
        isMutating={mutatingClassIds.has(selectedClass.id)}
        onBack={() => setView("main")}
        onLogin={openLoginModal}
        onToggleClass={() =>
          void mutateClass(selectedClass.id, isSelectedInMyTimetable ? "remove" : "add")
        }
      />
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto pb-8 bg-white min-h-screen animate-fade-in">
      {/* 見出し + 右上アイコン群 */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">学校</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("syllabus")}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 transition-colors"
              title="授業を追加"
              aria-label="授業を追加"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setActiveTab("syllabus")}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 transition-colors"
              title="シラバスを検索"
              aria-label="シラバスを検索"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => setActiveTab("timetable")}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 transition-colors"
              title="今週の時間割へ"
              aria-label="今週の時間割へ"
            >
              <CalendarDays size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {TAB_BUTTONS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as SchoolWorkspaceTab)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-orange-50"
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PR広告枠（時間割タブのみ） */}
      {activeTab === "timetable" && showPRBanner ? (
        <div className="px-3 pt-3">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 via-gray-800 to-black p-4 text-white">
            <button
              onClick={() => setShowPRBanner(false)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
              aria-label="広告を閉じる"
            >
              <X size={14} />
            </button>
            <span className="inline-block text-[10px] font-bold bg-orange-500 px-2 py-0.5 rounded mb-2">
              PR
            </span>
            <p className="text-[10px] text-gray-300 mb-1">医療法人快見会 伏見病院</p>
            <p className="font-bold text-sm leading-snug">
              2026年度 初期研修説明会 受付中
            </p>
          </div>
        </div>
      ) : null}

      <div className="px-3 pt-4">
        {activeTab === "timetable" ? (
          <SchoolTimetableTab
            authHydrated={authHydrated}
            loadingMyTimetable={loadingMyTimetable}
            isLoggedIn={isLoggedIn}
            myTimetableError={myTimetableError}
            hasTimetable={hasTimetable}
            days={days}
            periods={periods}
            timetableGrid={displayGrid}
            onLogin={openLoginModal}
            onOpenSyllabus={() => setActiveTab("syllabus")}
            onSelectClass={(item) => selectClass(item, isLoggedIn ? "personal" : "shared")}
          />
        ) : null}

        {activeTab === "syllabus" ? (
          <SchoolSyllabusTab
            searchQuery={searchQuery}
            syllabusUrl={siteConfig.syllabusUrl}
            loadingSharedClasses={loadingSharedClasses}
            sharedClassesError={sharedClassesError}
            syllabusClasses={syllabusClasses}
            myClassIds={myClassIds}
            mutatingClassIds={mutatingClassIds}
            authHydrated={authHydrated}
            isLoggedIn={isLoggedIn}
            onSearchQueryChange={setSearchQuery}
            onSelectClass={(item) => selectClass(item, "shared")}
            onToggleClass={(classId, inMyTimetable) =>
              void mutateClass(classId, inMyTimetable ? "remove" : "add")
            }
          />
        ) : null}

        {activeTab === "articles" ? (
          <SchoolArticlesTab
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            categories={CATEGORIES}
            articles={filteredArticles}
            onSearchQueryChange={setSearchQuery}
            onSelectedCategoryChange={setSelectedCategory}
          />
        ) : null}
      </div>
    </div>
  );
}

export function SchoolWorkspaceClient(props: SchoolPageClientProps) {
  return (
    <AuthBoundary>
      <SchoolWorkspaceInner {...props} />
    </AuthBoundary>
  );
}