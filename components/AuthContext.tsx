"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MeDto } from "@/lib/auth/types";
import { readRequiredApiJson } from "@/lib/api-client";
import { getLiffIdToken, initLiff, loginWithLiff, logoutFromLiff, type LiffState } from "@/lib/liff/client";

type AuthContextType = {
  isLoggedIn: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isLoginModalOpen: boolean;
  login: () => Promise<"authenticated" | "redirecting">;
  logout: () => Promise<void>;
  hydrated: boolean;
  initializing: boolean;
  error: string | null;
  me: MeDto | null;
  isLiffInClient: boolean;
  canShare: boolean;
  canClose: boolean;
  refreshMe: () => Promise<void>;
};

type ApiMeSuccess = { ok: true; item: MeDto };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchMe() {
  const response = await fetch("/api/me", { cache: "no-store" });
  if (response.status === 401) return null;
  const data = await readRequiredApiJson<ApiMeSuccess>(response, "プロフィールの取得に失敗しました");
  return data.item;
}

async function createLineSession(idToken: string) {
  const response = await fetch("/api/auth/line/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await readRequiredApiJson<ApiMeSuccess>(response, "LINEセッションの作成に失敗しました");
  return data.item;
}

function loginErrorMessage(caught: unknown) {
  if (!(caught instanceof Error)) return "LINEログインを開始できませんでした";
  if (caught.message === "Failed to fetch") return "LINEログインの初期化に失敗しました。通信状態を確認して、もう一度お試しください。";
  return caught.message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeDto | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liffState, setLiffState] = useState<LiffState>({
    isConfigured: false,
    isInClient: false,
    isLoggedIn: false,
    canShare: false,
    canClose: false,
  });

  const refreshMe = useCallback(async () => {
    const nextMe = await fetchMe();
    setMe(nextMe);
  }, []);

  const login = useCallback(async () => {
    setError(null);
    try {
      const state = await initLiff();
      setLiffState(state);

      if (state.isConfigured) {
        if (!state.isLoggedIn) {
          setError("LINEログイン画面を開いています。画面が変わらない場合は、LINE内で開き直してください。");
          await loginWithLiff();
          return "redirecting";
        }
        const idToken = await getLiffIdToken();
        if (!idToken) throw new Error("LINE ID token を取得できませんでした");
        setMe(await createLineSession(idToken));
        setIsLoginModalOpen(false);
        return "authenticated";
      }

      throw new Error("LIFF ID が設定されていません。");
    } catch (caught) {
      const message = loginErrorMessage(caught);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/line/session", { method: "DELETE" });
    await logoutFromLiff().catch(() => undefined);
    setMe(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitializing(true);
      setError(null);
      try {
        const state = await initLiff();
        if (cancelled) return;
        setLiffState(state);

        if (state.isConfigured && state.isLoggedIn) {
          const currentMe = await fetchMe();
          if (currentMe) {
            setMe(currentMe);
          } else {
            const idToken = await getLiffIdToken();
            if (idToken) setMe(await createLineSession(idToken));
          }
        } else {
          setMe(await fetchMe());
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "認証状態の確認に失敗しました");
      } finally {
        if (!cancelled) {
          setHydrated(true);
          setInitializing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      isLoggedIn: Boolean(me),
      openLoginModal: () => setIsLoginModalOpen(true),
      closeLoginModal: () => setIsLoginModalOpen(false),
      isLoginModalOpen,
      login,
      logout,
      hydrated,
      initializing,
      error,
      me,
      isLiffInClient: liffState.isInClient,
      canShare: liffState.canShare,
      canClose: liffState.canClose,
      refreshMe,
    }),
    [error, hydrated, initializing, isLoginModalOpen, liffState.canClose, liffState.canShare, liffState.isInClient, login, logout, me, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
