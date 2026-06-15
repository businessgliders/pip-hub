import React from "react";
import { Archive } from "lucide-react";

// Vertical "side panel" rail of status tabs shown on the left of the thread list.
// The count itself acts as the icon/glyph for each status tab.
export default function InboxStatusRail({ tabs, active, onChange, counts = {}, accent = "#f1889b", archivedActive = false, onArchived }) {
  if (!tabs || tabs.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-1.5 border-r border-white/40 dark:border-white/10 shrink-0 overflow-y-auto">
      {tabs.map((t) => {
        const isActive = !archivedActive && active === t.key;
        const c = counts[t.key] || 0;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            title={t.label}
            style={isActive ? { background: accent, color: "#fff" } : undefined}
            className={`relative w-14 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all ${
              isActive
                ? "shadow-md"
                : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
            }`}
          >
            <span className="text-lg font-bold leading-none">{c}</span>
            <span className="text-center">{t.label}</span>
          </button>
        );
      })}

      {/* Archived — icon only, pinned to the bottom */}
      {onArchived && (
        <button
          onClick={onArchived}
          title="Archived"
          style={archivedActive ? { background: accent, color: "#fff" } : undefined}
          className={`mt-auto w-14 flex items-center justify-center py-2.5 rounded-2xl transition-all ${
            archivedActive
              ? "shadow-md"
              : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
          }`}
        >
          <Archive className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}