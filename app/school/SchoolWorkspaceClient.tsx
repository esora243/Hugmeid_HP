"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AuthBoundary } from "@/components/AuthBoundary";
import { useAuth } from "@/components/AuthContext";
import { readRequiredApiJson } from "@/lib/api-client";
import { schoolArticles } from "@/lib/data";
import { siteConfig } from "@/lib/site";
import type { TimetableClassDto, TimetableDay, TimetableGridDto, UserTimetableResponse } from "@/lib/timetable-dto";
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

  const refreshMyTimetable = useCallback(async (cancelled?: () => boolean) => {
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
      const data = await readRequiredApiJson<UserTimetableResponse>(response, "マイ時間割の取得に失敗しました");
      if (!isCurrentRequest()) return;
      setDays(data.days);
      setPeriods(data.periods);
      setMyClasses(data.items);
      setMyTimetableGrid(data.grid);
      setMyTimetableUserId(requestUserId);
    } catch (error) {
      if (!isCurrentRequest()) return;
      clearMyTimetable();
      setMyTimetableError(error instanceof Error ? error.message : "マイ時間割の取得に失敗しました");
    } finally {
      if (requestId === myTimetableRequestId.current) setLoadingMyTimetable(false);
    }
  }, [authHydrated, clearMyTimetable, isLoggedIn, userId]);

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
      const matchQuery = !query || `${article.title} ${article.excerpt || ""}`.toLowerCase().includes(query);
      const matchCategory = selectedCategory === "すべて" || article.category === selectedCategory;
      return matchQuery && matchCategory;
    });
  }, [searchQuery, selectedCategory]);

  const syllabusClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sharedClasses;
    return sharedClasses.filter((item) => [item.title, item.instructor, item.room, item.location].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [sharedClasses, searchQuery]);

  const visibleMyClasses = useMemo(() => (myTimetableUserId === userId ? myClasses : []), [myClasses, myTimetableUserId, userId]);
  const visibleMyTimetableGrid = useMemo(
    () => (myTimetableUserId === userId ? myTimetableGrid : emptyTimetableGrid()),
    [myTimetableGrid, myTimetableUserId, userId],
  );
  const myClassIds = useMemo(() => new Set(visibleMyClasses.map((item) => item.id)), [visibleMyClasses]);
  const isSelectedInMyTimetable = selectedClass ? myClassIds.has(selectedClass.id) : false;
  const hasTimetable = visibleMyClasses.length > 0;

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
      const response = await fetch(action === "add" ? "/api/me/timetable" : `/api/me/timetable/classes/${encodeURIComponent(classId)}`, {
        method: action === "add" ? "POST" : "DELETE",
        headers: action === "add" ? { "content-type": "application/json" } : undefined,
        body: action === "add" ? JSON.stringify({ classId }) : undefined,
      });
      await readRequiredApiJson<MutationSuccess>(response, action === "add" ? "時間割への追加に失敗しました" : "時間割からの削除に失敗しました");
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
        onToggleClass={() => void mutateClass(selectedClass.id, isSelectedInMyTimetable ? "remove" : "add")}
      />
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto pb-8 bg-white min-h-screen animate-fade-in">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">学校</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{isLoggedIn ? "マイ時間割同期中" : "共有授業データを閲覧中"}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("syllabus")} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50" title="授業を探す"><Plus size={16} /></button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab("timetable")} className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "timetable" ? "bg-pink-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-pink-50"}`}>時間割</button>
          <button onClick={() => setActiveTab("syllabus")} className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "syllabus" ? "bg-pink-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-pink-50"}`}>シラバス</button>
          <button onClick={() => setActiveTab("articles")} className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "articles" ? "bg-pink-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-pink-50"}`}>勉強系記事</button>
        </div>
      </div>

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
            timetableGrid={visibleMyTimetableGrid}
            onLogin={openLoginModal}
            onOpenSyllabus={() => setActiveTab("syllabus")}
            onSelectClass={(item) => selectClass(item, "personal")}
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
            onToggleClass={(classId, inMyTimetable) => void mutateClass(classId, inMyTimetable ? "remove" : "add")}
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
