"use client";

import { useState } from "react";
import { ContactPanel } from "./ContactPanel";
import { FaqPanel } from "./FaqPanel";

type ConnectTab = "contact" | "faq";

type ConnectPageClientProps = {
  contactEmail: string;
};

const tabs: Array<{ id: ConnectTab; label: string }> = [
  { id: "contact", label: "💬 お問い合わせ" },
  { id: "faq", label: "❓ FAQ" },
];

export function ConnectPageClient({ contactEmail }: ConnectPageClientProps) {
  const [activeTab, setActiveTab] = useState<ConnectTab>("contact");

  return (
    <div className="w-full max-w-lg mx-auto pb-8 animate-slide-in-right">
      <div className="sticky top-[20px] z-30 bg-white border-b border-orange-100 px-4 py-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">繋がり</h2>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pt-3">
        {activeTab === "contact" ? <ContactPanel contactEmail={contactEmail} /> : <FaqPanel />}
      </div>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active ? "bg-orange-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-orange-50"
      }`}
    >
      {label}
    </button>
  );
}
