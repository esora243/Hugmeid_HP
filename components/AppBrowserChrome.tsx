"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RefreshCw, Share2, X } from "lucide-react";

type LiffChromeState = {
  isInClient: boolean;
  canShare: boolean;
  canClose: boolean;
};

const chromeOffsets = {
  liff: { navTop: "0px", browserBottom: "0px" },
  browser: { navTop: "52px", browserBottom: "64px" },
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

  if (liffState.isInClient) return null;

  return (
    <>
      <div className="sticky top-0 z-50 bg-black text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-8 h-8" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-wide">Hugmeid</h2>
          <button
            type="button"
            onClick={async () => {
              if (liffState.canClose) {
                const { closeLiffWindow } = await import("@/lib/liff/client");
                await closeLiffWindow();
              }
            }}
            disabled={!liffState.canClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors disabled:opacity-40"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black text-white">
        <div className="flex items-center justify-around px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center w-12 h-10 hover:bg-white/10 rounded transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => window.history.forward()}
            className="flex items-center justify-center w-12 h-10 hover:bg-white/10 rounded transition-colors"
            aria-label="進む"
          >
            <ArrowRight size={22} />
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="flex items-center justify-center w-12 h-10 hover:bg-white/10 rounded transition-colors"
            aria-label="更新"
          >
            <RefreshCw size={22} />
          </button>
          <button
            type="button"
            onClick={async () => {
              if (liffState.canShare) {
                const { shareCurrentPage } = await import("@/lib/liff/client");
                if (await shareCurrentPage()) return;
              }
              if (navigator.share) {
                await navigator.share({ title: document.title, url: window.location.href }).catch(() => undefined);
              } else {
                await navigator.clipboard.writeText(window.location.href).catch(() => undefined);
              }
            }}
            className="flex items-center justify-center w-12 h-10 hover:bg-white/10 rounded transition-colors"
            aria-label="共有"
          >
            <Share2 size={22} />
          </button>
        </div>
      </div>
    </>
  );
}
