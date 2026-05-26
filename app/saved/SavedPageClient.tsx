"use client";

import Link from "next/link";
import { Bookmark, Briefcase, Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthContext";
import { useSavedItems } from "@/components/SavedItemsContext";
import { allCampaigns } from "@/lib/data";

export function SavedPageClient() {
  const { isLoggedIn, openLoginModal } = useAuth();
  const { jobBookmarks, savedItems, hydrated, syncing, error, removeSaved } = useSavedItems();

  const resolvedJobItems = jobBookmarks.map((bookmark) => ({
    key: `job-${bookmark.job.id}`,
    href: `/jobs/${bookmark.job.slug}`,
    title: bookmark.job.title,
    subtitle: bookmark.job.companyName ?? "会社名未設定",
    meta: `${bookmark.job.location ?? "勤務地未設定"} / ${bookmark.job.salaryDisplay ?? "給与未設定"}`,
    typeLabel: "求人",
    type: "job" as const,
    id: bookmark.job.id,
  }));
  const resolvedCampaignItems = savedItems
    .filter((entry) => entry.type === "campaign")
    .map((entry) => {
      const campaign = allCampaigns.find((item) => item.id === entry.id);
      if (!campaign) return null;
      return {
        key: `campaign-${entry.id}`,
        href: `/campaign/${entry.id}`,
        title: campaign.title,
        subtitle: campaign.company,
        meta: `${campaign.date} / ${campaign.location}`,
        typeLabel: "キャンペーン",
        type: entry.type,
        id: entry.id,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const resolvedItems = [...resolvedJobItems, ...resolvedCampaignItems];

  const handleRemove = async (type: "job" | "campaign", id: string) => {
    try {
      await removeSaved(type, id);
      toast.success(type === "job" ? "求人の保存を解除しました" : "キャンペーンの保存を解除しました");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "保存解除に失敗しました");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-20 animate-fade-in">
      <div className="sticky top-[110px] z-30 bg-[#FFF9FA]/90 backdrop-blur-md pt-2 pb-3 px-4 border-b border-pink-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bookmark className="text-pink-500" /> 保存済み
        </h2>
      </div>
      <div className="px-4 pt-6 space-y-4">
        {!isLoggedIn ? (
          <div className="bg-white rounded-2xl border border-pink-100 p-4 text-sm text-gray-600">
            <p className="font-bold text-gray-800 mb-1">求人の保存同期にはログインが必要です</p>
            <p className="mb-3">キャンペーン保存はこの端末だけに保存されます。</p>
            <button onClick={openLoginModal} className="bg-pink-500 text-white font-bold py-2 px-5 rounded-full shadow-sm hover:bg-pink-600 transition-colors">
              ログインする
            </button>
          </div>
        ) : null}
        {!hydrated || syncing ? (
          <div className="text-center text-sm text-gray-500">読み込み中...</div>
        ) : error && resolvedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
            <Bookmark className="mx-auto text-pink-200 mb-3" size={40} />
            <p className="font-bold text-gray-800 mb-2">保存済み求人を取得できませんでした</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        ) : resolvedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
            <Bookmark className="mx-auto text-pink-200 mb-3" size={40} />
            <p className="font-bold text-gray-800 mb-2">保存済みアイテムはまだありません</p>
            <p className="text-sm text-gray-500">
              {isLoggedIn ? "求人詳細やキャンペーン詳細から保存すると、ここに一覧表示されます。" : "キャンペーン詳細から保存すると、この端末の保存一覧に表示されます。"}
            </p>
          </div>
        ) : (
          <>
            {error ? (
              <div className="bg-white rounded-2xl border border-pink-100 p-4 text-sm text-gray-600">
                <p className="font-bold text-gray-800 mb-1">保存済み求人を取得できませんでした</p>
                <p>{error}</p>
              </div>
            ) : null}
            {resolvedItems.map((item) => (
              <div key={item.key} className="bg-white rounded-2xl border border-pink-50 p-4 shadow-sm flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                  {item.type === "job" ? <Briefcase size={20} /> : <Megaphone size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-100 text-pink-600">{item.typeLabel}</span>
                  </div>
                  <Link href={item.href} prefetch={false} className="font-bold text-gray-800 hover:text-pink-600 transition-colors block line-clamp-2">
                    {item.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">{item.subtitle}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.meta}</p>
                </div>
                <button
                  onClick={() => void handleRemove(item.type, item.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  aria-label="保存解除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
