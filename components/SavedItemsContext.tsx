"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthContext";
import { readRequiredApiJson } from "@/lib/api-client";
import type { BookmarkDto } from "@/lib/job-dto";
import { jobBookmarksToSavedEntries, readCampaignSavedEntries, readLegacyJobSavedEntries } from "@/lib/saved-items";
import type { SavedEntry, SavedItemType } from "@/lib/types";

const STORAGE_KEY = "hugmeid_saved_items";

type SavedItemsContextType = {
  savedItems: SavedEntry[];
  jobBookmarks: BookmarkDto[];
  hydrated: boolean;
  syncing: boolean;
  error: string | null;
  isSaved: (type: SavedItemType, id: string | number) => boolean;
  toggleSaved: (type: SavedItemType, id: string | number) => Promise<boolean>;
  removeSaved: (type: SavedItemType, id: string | number) => Promise<void>;
  refreshJobBookmarks: (throwOnError?: boolean) => Promise<void>;
};

type BookmarksSuccess = { ok: true; items: BookmarkDto[] };
type MutationSuccess = { ok: true };

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);

export function SavedItemsProvider({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated, isLoggedIn, me } = useAuth();
  const userId = me?.id ?? null;
  const [campaignSavedItems, setCampaignSavedItems] = useState<SavedEntry[]>([]);
  const [legacyJobSavedItems, setLegacyJobSavedItems] = useState<SavedEntry[]>([]);
  const [jobBookmarks, setJobBookmarks] = useState<BookmarkDto[]>([]);
  const [jobBookmarksUserId, setJobBookmarksUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bookmarkRequestId = useRef(0);
  const jobMutationIds = useRef(new Set<string>());
  const authState = useRef({ authHydrated, isLoggedIn, userId });

  useEffect(() => {
    const previousUserId = authState.current.userId;
    authState.current = { authHydrated, isLoggedIn, userId };
    if (!isLoggedIn || previousUserId !== userId) {
      bookmarkRequestId.current += 1;
      setJobBookmarks([]);
      setJobBookmarksUserId(null);
      setError(null);
      setSyncing(false);
    }
  }, [authHydrated, isLoggedIn, userId]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        setCampaignSavedItems(readCampaignSavedEntries(parsed));
        setLegacyJobSavedItems(readLegacyJobSavedEntries(parsed));
      }
    } catch {
      setCampaignSavedItems([]);
      setLegacyJobSavedItems([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...legacyJobSavedItems, ...campaignSavedItems]));
  }, [campaignSavedItems, hydrated, legacyJobSavedItems]);

  const refreshJobBookmarks = useCallback(async (throwOnError = false) => {
    const currentAuthAtStart = authState.current;
    if (
      currentAuthAtStart.authHydrated !== authHydrated ||
      currentAuthAtStart.isLoggedIn !== isLoggedIn ||
      currentAuthAtStart.userId !== userId
    ) {
      if (throwOnError) throw new Error("ログイン状態を確認できませんでした");
      return;
    }

    if (!authHydrated || !isLoggedIn || !userId) {
      bookmarkRequestId.current += 1;
      setJobBookmarks([]);
      setJobBookmarksUserId(null);
      setError(null);
      return;
    }
    const requestId = bookmarkRequestId.current + 1;
    bookmarkRequestId.current = requestId;
    const requestUserId = userId;
    const assertCurrentRequest = () => {
      const currentAuth = authState.current;
      if (
        requestId !== bookmarkRequestId.current ||
        !currentAuth.authHydrated ||
        !currentAuth.isLoggedIn ||
        currentAuth.userId !== requestUserId
      ) {
        if (throwOnError) throw new Error("ログイン状態を確認できませんでした");
        return false;
      }
      return true;
    };

    setSyncing(true);
    setError(null);
    try {
      const response = await fetch("/api/me/bookmarks", { cache: "no-store" });
      if (!assertCurrentRequest()) return;
      if (response.status === 401) {
        setJobBookmarks([]);
        setJobBookmarksUserId(null);
        if (throwOnError) throw new Error("ログイン状態を確認できませんでした");
        return;
      }
      const data = await readRequiredApiJson<BookmarksSuccess>(response, "保存済み求人の取得に失敗しました");
      if (!assertCurrentRequest()) return;
      setJobBookmarks(data.items);
      setJobBookmarksUserId(requestUserId);
    } catch (caught) {
      const nextError = caught instanceof Error ? caught : new Error("保存済み求人の取得に失敗しました");
      if (!assertCurrentRequest()) return;
      setError(nextError.message);
      if (throwOnError) throw nextError;
    } finally {
      if (requestId === bookmarkRequestId.current) setSyncing(false);
    }
  }, [authHydrated, isLoggedIn, userId]);

  useEffect(() => {
    void refreshJobBookmarks();
  }, [refreshJobBookmarks]);

  const visibleJobBookmarks = useMemo(
    () => (jobBookmarksUserId === userId ? jobBookmarks : []),
    [jobBookmarks, jobBookmarksUserId, userId],
  );

  const savedItems = useMemo(
    () => [...jobBookmarksToSavedEntries(visibleJobBookmarks), ...campaignSavedItems],
    [campaignSavedItems, visibleJobBookmarks],
  );

  const isSaved = useCallback(
    (type: SavedItemType, id: string | number) => {
      const normalizedId = String(id);
      if (type === "job") return visibleJobBookmarks.some((bookmark) => bookmark.job.id === normalizedId);
      return campaignSavedItems.some((item) => item.id === normalizedId);
    },
    [campaignSavedItems, visibleJobBookmarks],
  );

  const mutateJobBookmark = useCallback(async (jobId: string, method: "POST" | "DELETE", failureMessage: string) => {
    if (syncing) throw new Error("保存状態を同期中です。少し待ってから再試行してください");
    if (jobMutationIds.current.has(jobId)) throw new Error("保存操作を処理中です。少し待ってから再試行してください");
    jobMutationIds.current.add(jobId);
    try {
      const response = await fetch(`/api/me/bookmarks/jobs/${encodeURIComponent(jobId)}`, { method });
      await readRequiredApiJson<MutationSuccess>(response, failureMessage);
      await refreshJobBookmarks(true);
      setLegacyJobSavedItems((current) => current.filter((item) => item.id !== jobId));
    } finally {
      jobMutationIds.current.delete(jobId);
    }
  }, [refreshJobBookmarks, syncing]);

  const toggleSaved = useCallback(async (type: SavedItemType, id: string | number) => {
    const normalizedId = String(id);
    if (type === "job") {
      const nextSaved = !visibleJobBookmarks.some((bookmark) => bookmark.job.id === normalizedId);
      await mutateJobBookmark(normalizedId, nextSaved ? "POST" : "DELETE", "求人保存の更新に失敗しました");
      return nextSaved;
    }

    let nextSaved = false;
    setCampaignSavedItems((current) => {
      const exists = current.some((item) => item.type === type && item.id === normalizedId);
      nextSaved = !exists;

      if (exists) {
        return current.filter((item) => !(item.type === type && item.id === normalizedId));
      }

      return [{ type, id: normalizedId, savedAt: new Date().toISOString() }, ...current];
    });

    return nextSaved;
  }, [mutateJobBookmark, visibleJobBookmarks]);

  const removeSaved = useCallback(async (type: SavedItemType, id: string | number) => {
    const normalizedId = String(id);
    if (type === "job") {
      await mutateJobBookmark(normalizedId, "DELETE", "求人保存の解除に失敗しました");
      return;
    }
    setCampaignSavedItems((current) => current.filter((item) => !(item.type === type && item.id === normalizedId)));
  }, [mutateJobBookmark]);

  const value = useMemo(
    () => ({ savedItems, jobBookmarks: visibleJobBookmarks, hydrated, syncing, error, isSaved, toggleSaved, removeSaved, refreshJobBookmarks }),
    [savedItems, visibleJobBookmarks, hydrated, syncing, error, isSaved, toggleSaved, removeSaved, refreshJobBookmarks],
  );

  return <SavedItemsContext.Provider value={value}>{children}</SavedItemsContext.Provider>;
}

export function useSavedItems() {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error("useSavedItems must be used within a SavedItemsProvider");
  }
  return context;
}
