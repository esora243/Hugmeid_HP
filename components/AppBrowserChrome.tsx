"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ※ UIを消したため、lucide-react のアイコンインポートは不要になりました

type LiffChromeState = {
  isInClient: boolean;
  canShare: boolean;
  canClose: boolean;
};

// メニューバーを非表示にするため、外部ブラウザで開いた時の余白設定も「0px」に修正しています
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
  document.documentElement.style.setProperty("--hugmeid-nav-top", offsets.navTop);
  document.documentElement.style.setProperty("--hugmeid-browser-bottom", offsets.browserBottom);
}

export function AppBrowserChrome() {
  const router = useRouter();
  const [liffState, setLiffState] = useState<LiffChromeState>({ isInClient: false, canShare: false, canClose: false });

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
          setLiffState({ isInClient: state.isInClient, canShare: state.canShare, canClose: state.canClose });
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

  // ★ 変更点: 常に何も表示しない（nullを返す）ことで、上下の黒いメニューバーを完全に削除
  return null;
}
