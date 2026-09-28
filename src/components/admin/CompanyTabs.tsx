"use client";

import { useState, type ReactNode } from "react";

export function CompanyTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const activeTab = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5 overflow-x-auto rounded-2xl border border-border bg-white/70 p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors ${
              tab.id === activeTab?.id ? "bg-primary text-white" : "text-muted hover:bg-black/5 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeTab?.content}</div>
    </div>
  );
}
