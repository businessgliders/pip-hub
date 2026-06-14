import React from "react";

export default function InboxFilterTabs({ tabs, active, onChange, counts = {} }) {
  if (!tabs || tabs.length === 0) return null;
  return (
    <div className="flex items-center gap-1 px-4 pt-1 pb-2 border-b border-white/50 overflow-x-auto">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                : "bg-white/50 text-pink-700/70 hover:bg-white/70"
            }`}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`ml-1.5 ${isActive ? "text-pink-100" : "text-pink-400"}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}