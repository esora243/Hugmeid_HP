"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, User, GraduationCap, Building2, Dumbbell, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { parseProfileOptionsResponse, type ProfileOptionsDto } from "@/lib/auth/types";
import { useAuth } from "@/components/AuthContext";

type UserProfile = {
  gender: string;
  graduationYear: number | null;
  universityId: string;
  clubIds: string[];
  desiredSpecialtyId: string | null;
};

type Option = { id: string; name: string };

export function RegisterPageClient() {
  const router = useRouter();
  const { isLoggedIn, openLoginModal, refreshMe } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<ProfileOptionsDto | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    gender: "",
    graduationYear: null,
    universityId: "",
    clubIds: [],
    desiredSpecialtyId: null,
  });

  const loadOptions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const handleNext = async () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (step < 5) {
      setStep(step + 1);
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
          consentMarketing: true,
          pushEnabled: true,
        }),
      });
      if (!response.ok) throw new Error("登録に失敗しました");
      await refreshMe();
      toast.success("登録が完了しました！");
      router.push("/profile");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return profile.gender !== "";
      case 2:
        return profile.graduationYear !== null;
      case 3:
        return profile.universityId !== "";
      default:
        return true;
    }
  };

  const setClub = (id: string) => {
    setProfile((prev) => ({ ...prev, clubIds: prev.clubIds.includes(id) ? [] : [id] }));
  };

  const steps: Array<{
    title: string;
    icon: typeof User;
    options: Option[];
    field: "gender" | "graduationYear" | "universityId" | "clubIds" | "desiredSpecialtyId";
    optional?: boolean;
  }> = [
    { title: "性別を選択してください", icon: User, options: options?.genders.map((name) => ({ id: name, name })) ?? [], field: "gender" },
    {
      title: "卒業年度を選択してください",
      icon: GraduationCap,
      options: options?.graduationYears.map((year) => ({ id: String(year), name: `${year}年卒` })) ?? [],
      field: "graduationYear",
    },
    { title: "大学名を選択してください", icon: Building2, options: options?.universities ?? [], field: "universityId" },
    { title: "所属している部活・サークルを教えてください（任意）", icon: Dumbbell, options: options?.clubs ?? [], field: "clubIds", optional: true },
    { title: "希望診療科を選択してください（任意）", icon: Stethoscope, options: options?.specialties ?? [], field: "desiredSpecialtyId", optional: true },
  ];

  const currentStep = steps[step - 1];
  const Icon = currentStep.icon;

  const isSelected = (option: Option) => {
    if (currentStep.field === "gender") return profile.gender === option.id;
    if (currentStep.field === "graduationYear") return profile.graduationYear === Number(option.id);
    if (currentStep.field === "universityId") return profile.universityId === option.id;
    if (currentStep.field === "clubIds") return profile.clubIds.includes(option.id);
    return profile.desiredSpecialtyId === option.id;
  };

  const selectOption = (option: Option) => {
    if (currentStep.field === "gender") setProfile((prev) => ({ ...prev, gender: option.id }));
    if (currentStep.field === "graduationYear") setProfile((prev) => ({ ...prev, graduationYear: Number(option.id) }));
    if (currentStep.field === "universityId") setProfile((prev) => ({ ...prev, universityId: option.id }));
    if (currentStep.field === "clubIds") setClub(option.id);
    if (currentStep.field === "desiredSpecialtyId") setProfile((prev) => ({ ...prev, desiredSpecialtyId: option.id }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <div className="w-full max-w-lg mx-auto p-6 flex-1 flex flex-col animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">STEP {step} / 5</span>
            <span className="text-xs font-semibold text-orange-500">{Math.round((step / 5) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500 ease-out rounded-full" style={{ width: `${(step / 5) * 100}%` }} />
          </div>
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg"><Icon className="text-white" size={32} strokeWidth={2} /></div>
          <h2 className="text-xl font-bold text-gray-800 leading-tight mb-2">{currentStep.title}</h2>
          {currentStep.optional ? <p className="text-xs text-orange-500 mt-2">※ スキップ可能</p> : null}
        </div>

        <div className="flex-1 space-y-3 mb-8">
          {optionsLoading ? (
            <div className="rounded-xl border border-orange-100 bg-white p-5 text-center text-sm font-medium text-gray-500">
              プロフィール選択肢を読み込んでいます
            </div>
          ) : optionsError ? (
            <div className="rounded-xl border border-red-100 bg-white p-5 text-center">
              <p className="mb-3 text-sm font-bold text-gray-800">プロフィール選択肢を読み込めませんでした</p>
              <p className="mb-4 text-xs text-gray-500">{optionsError}</p>
              <button onClick={() => void loadOptions()} className="rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white hover:bg-orange-600">
                再読み込み
              </button>
            </div>
          ) : (currentStep.options as Option[]).map((option) => (
            <button key={option.id} onClick={() => selectOption(option)} className={`w-full p-4 rounded-xl border-2 transition-all text-left font-medium ${isSelected(option) ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/50"}`}>
              <div className="flex items-center justify-between">
                <span>{option.name}</span>
                {isSelected(option) && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-colors">戻る</button>}
          <button onClick={handleNext} disabled={!canProceed() || saving} className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${canProceed() && !saving ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md hover:shadow-lg active:scale-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            {saving ? "保存中..." : step === 5 ? "登録完了" : "次へ"}{step < 5 && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
