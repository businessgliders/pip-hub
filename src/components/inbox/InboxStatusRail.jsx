import React from "react";
import { Inbox, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";

const ICONS = {
  open: Inbox,
  in_progress: Loader2,
  waiting: Clock,
  resolved: CheckCircle2,
  closed: XCircle,
};

// Vertical "side panel" rail of status tabs shown on the left of the thread list.
export default function InboxStatusRail({ tabs, active, onChange, counts = {}, accent = "#f1889b" }) {
  if (!tabs || tabs.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-1.5 border-r border-white/40 dark:border-white/10 shrink-0 overflow-y-auto">
      {tabs.map((t) => {
        const isActive = active === t.key;
        const Icon = ICONS[t.key] || Inbox;
        const c = counts[t.key];
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
            <Icon className="w-4 h-4" />
            <span className="text-center">{t.label}</span>
            {c > 0 && (
              <span
                className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] flex items-center justify-center ${
                  isActive ? "bg-white/30 text-white" : "bg-pink-500/15 text-pink-600 dark:bg-white/15 dark:text-white/80"
                }`}
              >
                {c}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}