"use client";

import { useEffect, useState } from "react";

type LiffChromeState = {
  isInClient: boolean;
};

// 黒枠UIを削除したため、ブラウザ起動時の余分なオフセット(黒枠分の高さ)を 0px に設定
const chromeOffsets = {
  liff: { navTop: "0px", browserBottom: "0px" },
  browser: { navTop: "0px", browserBottom: "0px" },
} as const;

function hasLiffSignal() {
  if (typeof window === "undefined") return false;
  if (/Line\//i.test(window.navigator.userAgent)) return true;
  const params = new URLSearchParams(window.location.search);
  return params.has("access_token") || params.has("lineAppVersion") || (params.has("code") && params.has("state"));
}

function setBrowserChromeOffsets(isInClient: boolean) {
  const offsets = isInClient ? chromeOffsets.liff : chromeOffsets.browser;
  document.documentElement.style.setProperty("--HugNavi-nav-top", offsets.navTop);
  document.documentElement.style.setProperty("--HugNavi-browser-bottom", offsets.browserBottom);
}

export function AppBrowserChrome() {
  const [liffState, setLiffState] = useState<LiffChromeState>({ isInClient: false });

  useEffect(() => {
    let cancelled = false;

    async function detectLiffChrome() {
      if (!hasLiffSignal()) {
        setBrowserChromeOffsets(false);
        return;
      }
      try {
        const { initLiff } = await import("@/lib/liff/client");
        const state = await initLiff();
        if (!cancelled) {
          setLiffState({ isInClient: state.isInClient });
          setBrowserChromeOffsets(state.isInClient);
        }
      } catch {
        if (!cancelled) setBrowserChromeOffsets(false);
      }
    }

    void detectLiffChrome();
    return () => {
      cancelled = true;
    };
  }, []);

  // ヘッダーおよびフッターの黒枠（疑似ブラウザUI）は描画せず完全に削除します
  return null;
}