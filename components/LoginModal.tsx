"use client";

import { useState } from "react";
import { X } from "lucide-react";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => Promise<void>;
  error?: string | null;
};

export function LoginModal({ isOpen, onClose, onLogin, error }: LoginModalProps) {
  const [submitting, setSubmitting] = useState(false);
  if (!isOpen) return null;

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      await onLogin();
    } catch {
      // AuthProvider owns the user-facing error message.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div className="relative pt-6 pb-4 px-6 text-center border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-full mx-auto flex items-center justify-center mb-3">
            <span className="font-bold text-xl">H</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">ログインが必要です</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            保存機能や応募、詳細なコンテンツの閲覧にはログインが必要です。
          </p>
        </div>

        <div className="p-6 bg-pink-50/50">
          <button
            onClick={handleLogin}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05B34C] text-white py-3.5 px-4 rounded-xl font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M22.5 10.4c0-4.4-4.5-8-10.1-8-5.6 0-10.2 3.6-10.2 8 0 4 3.7 7.4 8.7 7.9.3.1.8.3.9.7.1.3-.1 1.2-.2 1.4-.1.3-.4 1.4 1 1s4.5-2.7 6.4-4.8c2.2-2.3 3.5-4.4 3.5-6.2z" />
            </svg>
            {submitting ? "確認中..." : "LINEでログイン・登録"}
          </button>

          {error && (
            <p className="text-xs text-center text-amber-600 mt-3 leading-relaxed">
              {error}
            </p>
          )}

          <p className="text-xs text-center text-gray-400 mt-4">
            登録することで、利用規約とプライバシーポリシーに<br />同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  );
}
