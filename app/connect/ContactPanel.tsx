"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

type ContactFormData = {
  name: string;
  email: string;
  category: string;
  message: string;
};

type ContactPanelProps = {
  contactEmail: string;
};

const initialFormData: ContactFormData = { name: "", email: "", category: "", message: "" };

const contactCategories = [
  { value: "contact", label: "掲載・提携相談" },
  { value: "question", label: "サービスについての質問" },
  { value: "bug", label: "不具合報告" },
  { value: "request", label: "機能リクエスト" },
  { value: "other", label: "その他" },
] as const;

const fieldClassName =
  "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm";

function buildMailtoHref(contactEmail: string, formData: ContactFormData) {
  const subject = encodeURIComponent(`Hugmeid お問い合わせ: ${formData.category}`);
  const body = encodeURIComponent(
    [
      `お名前: ${formData.name}`,
      `メールアドレス: ${formData.email}`,
      `お問い合わせ種別: ${formData.category}`,
      "",
      formData.message,
    ].join("\n"),
  );

  return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
}

export function ContactPanel({ contactEmail }: ContactPanelProps) {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);

  const updateField =
    (field: keyof ContactFormData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.location.href = buildMailtoHref(contactEmail, formData);
    toast.info("メールアプリを開きます。送信内容をご確認ください。");
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center shadow-md">
            <MessageCircle className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">お問い合わせ</h3>
            <p className="text-xs text-gray-500">ご質問・掲載依頼・不具合報告</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          送信ボタンからメールアプリを開きます。送信内容を確認してから送信してください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-pink-50 p-6 space-y-5">
        <div>
          <label className="text-xs font-bold text-gray-600 mb-2 block">お名前 *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={updateField("name")}
            placeholder="山田 太郎"
            className={fieldClassName}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 mb-2 block">メールアドレス *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={updateField("email")}
            placeholder="example@email.com"
            className={fieldClassName}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 mb-2 block">お問い合わせ種別 *</label>
          <select required value={formData.category} onChange={updateField("category")} className={fieldClassName}>
            <option value="">選択してください</option>
            {contactCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 mb-2 block">お問い合わせ内容 *</label>
          <textarea
            required
            value={formData.message}
            onChange={updateField("message")}
            placeholder="お問い合わせ内容をご記入ください"
            rows={6}
            className={`${fieldClassName} resize-none`}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Send size={18} /> 送信する
        </button>
      </form>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-gray-700 flex items-start gap-3">
        <Mail className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-bold mb-1">連絡先</p>
          <p>{contactEmail}</p>
        </div>
      </div>
    </div>
  );
}
