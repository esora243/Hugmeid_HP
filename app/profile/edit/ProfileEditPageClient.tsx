"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { parseProfileOptionsResponse, type ProfileOptionsDto } from "@/lib/auth/types";
import { useAuth } from "@/components/AuthContext";

type ProfileForm = {
  gender: string;
  graduationYear: number | null;
  universityId: string;
  clubIds: string[];
  desiredSpecialtyId: string | null;
};

export function ProfileEditPageClient() {
  const router = useRouter();
  const { hydrated, isLoggedIn, me, openLoginModal, refreshMe } = useAuth();
  const [options, setOptions] = useState<ProfileOptionsDto | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>({
    gender: "",
    graduationYear: null,
    universityId: "",
    clubIds: [],
    desiredSpecialtyId: null,
  });

  const loadOptions = useCallback(async () => {
    if (!isLoggedIn) return;
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      const response = await fetch("/api/profile/options");
      const data = await response.json() as unknown;
      const item = parseProfileOptionsResponse(data);
      if (!response.ok || !item) throw new Error("プロフィール選択肢を読み込めませんでした");
      setOptions(item);
    } catch (error) {
      setOptions(null);
      setOptionsError(error instanceof Error ? error.message : "プロフィール選択肢を読み込めませんでした");
    } finally {
      setOptionsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!me) return;
    setProfile({
      gender: me.gender ?? "",
      graduationYear: me.graduationYear,
      universityId: me.university?.id ?? "",
      clubIds: me.clubs.map((club) => club.id),
      desiredSpecialtyId: me.desiredSpecialty?.id ?? null,
    });
  }, [me]);

  const handleSave = async () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gender: profile.gender || null,
          universityId: profile.universityId,
          graduationYear: profile.graduationYear,
          clubIds: profile.clubIds,
          desiredSpecialtyId: profile.desiredSpecialtyId,
          consentMarketing: Boolean(me?.consentMarketingAt),
          pushEnabled: me?.pushEnabled ?? false,
        }),
      });
      if (!response.ok) throw new Error("プロフィール更新に失敗しました");
      await refreshMe();
      toast.success("プロフィールを更新しました");
      router.push("/profile");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "プロフィール更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated) {
    return <div className="min-h-screen bg-[#FFF9FA]" />;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FFF9FA] pb-20">
        <div className="w-full max-w-lg mx-auto px-4 py-10">
          <button onClick={() => router.push("/profile")} className="mb-6 text-gray-600 hover:text-orange-500"><ArrowLeft size={24} /></button>
          <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center shadow-sm">
            <h1 className="text-lg font-bold text-gray-800 mb-2">プロフィール編集</h1>
            <p className="text-sm text-gray-500 mb-6">プロフィールを編集するにはログインが必要です。</p>
            <button onClick={openLoginModal} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600">
              LINEでログインする
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="min-h-screen bg-[#FFF9FA] pb-20">
        <div className="w-full max-w-lg mx-auto px-4 py-10">
          <button onClick={() => router.push("/profile")} className="mb-6 text-gray-600 hover:text-orange-500"><ArrowLeft size={24} /></button>
          <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center shadow-sm">
            <h1 className="text-lg font-bold text-gray-800 mb-2">プロフィール編集</h1>
            <p className="text-sm text-gray-500 mb-6">
              {optionsLoading ? "プロフィール選択肢を読み込んでいます。" : optionsError ?? "プロフィール選択肢を読み込めませんでした。"}
            </p>
            {!optionsLoading ? (
              <button onClick={() => void loadOptions()} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600">
                再読み込み
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9FA] pb-20">
      <div className="w-full max-w-lg mx-auto">
        <div className="sticky top-[110px] z-30 bg-white border-b border-orange-100 px-4 py-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => router.push("/profile")} className="text-gray-600 hover:text-orange-500"><ArrowLeft size={24} /></button>
          <h1 className="text-lg font-bold text-gray-800 flex-1">プロフィール編集</h1>
          <button onClick={handleSave} disabled={saving || !profile.universityId || !profile.graduationYear} className="flex items-center gap-1.5 bg-orange-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-orange-600 active:scale-95 transition-all"><Save size={16} /> {saving ? "保存中" : "保存"}</button>
        </div>
        <div className="p-4 space-y-6 animate-fade-in">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-50">
            <label className="text-xs font-bold text-gray-500 mb-3 block">性別</label>
            <div className="grid grid-cols-2 gap-2">
              {options.genders.map((opt) => (
                <button key={opt} onClick={() => setProfile((prev) => ({ ...prev, gender: opt }))} className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${profile.gender === opt ? "bg-orange-500 text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-orange-50 border border-gray-100"}`}>{opt}</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-50">
            <label className="text-xs font-bold text-gray-500 mb-3 block">卒業年度</label>
            <div className="grid grid-cols-2 gap-2">
              {options.graduationYears.map((year) => (
                <button key={year} onClick={() => setProfile((prev) => ({ ...prev, graduationYear: year }))} className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${profile.graduationYear === year ? "bg-orange-500 text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-orange-50 border border-gray-100"}`}>{year}年卒</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-50">
            <label className="text-xs font-bold text-gray-500 mb-3 block">大学名</label>
            <div className="grid grid-cols-1 gap-2">
              {options.universities.map((university) => (
                <button key={university.id} onClick={() => setProfile((prev) => ({ ...prev, universityId: university.id }))} className={`py-2.5 px-3 rounded-lg text-sm font-medium text-left transition-all ${profile.universityId === university.id ? "bg-orange-500 text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-orange-50 border border-gray-100"}`}>{university.name}</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-50">
            <label className="text-xs font-bold text-gray-500 mb-3 block">部活・サークル（任意）</label>
            <div className="grid grid-cols-2 gap-2">
              {options.clubs.map((club) => (
                <button key={club.id} onClick={() => setProfile((prev) => ({ ...prev, clubIds: prev.clubIds.includes(club.id) ? [] : [club.id] }))} className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${profile.clubIds.includes(club.id) ? "bg-orange-500 text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-orange-50 border border-gray-100"}`}>{club.name}</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-50">
            <label className="text-xs font-bold text-gray-500 mb-3 block">希望診療科（任意）</label>
            <div className="grid grid-cols-2 gap-2">
              {options.specialties.map((specialty) => (
                <button key={specialty.id} onClick={() => setProfile((prev) => ({ ...prev, desiredSpecialtyId: specialty.id }))} className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${profile.desiredSpecialtyId === specialty.id ? "bg-orange-500 text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-orange-50 border border-gray-100"}`}>{specialty.name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
