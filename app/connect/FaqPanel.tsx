"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { allFaqs, faqCategories } from "@/lib/data";
import type { FAQ } from "@/lib/types";

const faqFilterCategories =
  faqCategories.length > 1 ? faqCategories : ["すべて", ...Array.from(new Set(allFaqs.map((faq) => faq.category)))];

function getFilteredFaqs(category: string) {
  return category === "すべて" ? allFaqs : allFaqs.filter((faq) => faq.category === category);
}

export function FaqPanel() {
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [faqCategory, setFaqCategory] = useState("すべて");
  const filteredFaqs = getFilteredFaqs(faqCategory);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 mb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
            <HelpCircle className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">よくある質問</h3>
            <p className="text-xs text-gray-500">FAQ</p>
          </div>
        </div>
        <p className="text-xs text-gray-600">運用FAQを登録するとここに表示されます。</p>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-4 hide-scrollbar">
        {faqFilterCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFaqCategory(category)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              faqCategory === category
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6 text-center text-sm text-gray-500">
            FAQはまだ登録されていません。
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <FaqItem
              key={faq.id}
              faq={faq}
              open={openFaqId === faq.id}
              onToggle={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FaqItem({ faq, open, onToggle }: { faq: FAQ; open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-50 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-start justify-between text-left hover:bg-orange-50/50 transition-colors"
      >
        <div className="flex-1 pr-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
              {faq.category}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-orange-500 font-bold text-sm mt-0.5">Q.</span>
            <span className="text-sm font-bold text-gray-800 leading-snug">{faq.question}</span>
          </div>
        </div>
        <ChevronDown size={20} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50">
          <div className="flex items-start gap-2 bg-orange-50/50 p-3 rounded-lg">
            <span className="shrink-0 text-blue-500 font-bold text-sm mt-0.5">A.</span>
            <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
