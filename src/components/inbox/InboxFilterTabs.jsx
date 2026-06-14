import React from "react";

export default function InboxFilterTabs({ tabs, active, onChange, counts = {} }) {
  if (!tabs || tabs.length === 0) return null;
  return (
    <div className="flex items-center gap-1 px-4 pt-1 pb-2 border-b border-slate-100 bg-white overflow-x-auto">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`ml-1.5 ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}