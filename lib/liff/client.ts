"use client";

import type { Liff } from "@line/liff";

let liffPromise: Promise<Liff> | null = null;
let sdkInitPromise: Promise<Liff> | null = null;
let initPromise: Promise<LiffState> | null = null;

export type LiffState = {
  isConfigured: boolean;
  isInClient: boolean;
  isLoggedIn: boolean;
  canShare: boolean;
  canClose: boolean;
};

async function loadLiff() {
  if (!liffPromise) {
    liffPromise = import("@line/liff").then((module) => module.default);
  }
  return liffPromise;
}

async function initializeLiffSdk() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) throw new Error("LIFF ID が設定されていません。");

  if (!sdkInitPromise) {
    sdkInitPromise = loadLiff().then(async (liff) => {
      await liff.init({ liffId });
      return liff;
    });
  }
  return sdkInitPromise;
}

function getCurrentUrlParams() {
  if (typeof window === "undefined") return new URLSearchParams();

  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace(/^#/, "");
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : hash;
  if (hashQuery.includes("=")) {
    new URLSearchParams(hashQuery).forEach((value, key) => params.append(key, value));
  }
  return params;
}

function shouldInitializeLiffImmediately() {
  if (typeof window === "undefined") return false;
  if (/Line\//i.test(window.navigator.userAgent)) return true;

  const params = getCurrentUrlParams();
  for (const key of params.keys()) {
    if (key.startsWith("liff.")) return true;
  }
  return params.has("access_token") || params.has("lineAppVersion") || (params.has("code") && params.has("state"));
}

export async function initLiff(): Promise<LiffState> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      return { isConfigured: false, isInClient: false, isLoggedIn: false, canShare: false, canClose: false };
    }

    if (!shouldInitializeLiffImmediately()) {
      return { isConfigured: true, isInClient: false, isLoggedIn: false, canShare: false, canClose: false };
    }

    const liff = await initializeLiffSdk();
    const isInClient = liff.isInClient();
    return {
      isConfigured: true,
      isInClient,
      isLoggedIn: liff.isLoggedIn(),
      canShare: typeof liff.shareTargetPicker === "function" && liff.isApiAvailable("shareTargetPicker"),
      canClose: isInClient,
    };
  })();

  return initPromise;
}

export async function loginWithLiff() {
  const liff = await initializeLiffSdk();
  liff.login({ redirectUri: window.location.href });
}

export async function logoutFromLiff() {
  const liff = await initializeLiffSdk();
  if (liff.isLoggedIn()) {
    liff.logout();
  }
}

export async function getLiffIdToken() {
  const liff = await initializeLiffSdk();
  return liff.getIDToken();
}

export async function shareCurrentPage() {
  const liff = await initializeLiffSdk();
  if (!liff.isApiAvailable("shareTargetPicker")) return false;
  await liff.shareTargetPicker([
    {
      type: "text",
      text: `${document.title}\n${window.location.href}`,
    },
  ]);
  return true;
}

export async function closeLiffWindow() {
  const liff = await initializeLiffSdk();
  if (liff.isInClient()) {
    liff.closeWindow();
    return true;
  }
  return false;
}
