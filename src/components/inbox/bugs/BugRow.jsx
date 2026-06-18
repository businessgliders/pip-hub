import React from "react";
import { LifeBuoy } from "lucide-react";
import { relativeTime } from "../inboxConfig";

const URGENCY_TONE = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-200",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-500/25 dark:text-orange-200",
  Soon: "bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200",
  Low: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60",
};

export default function BugRow({ bug, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left mx-2 my-1 px-3 py-3 flex gap-3 rounded-2xl transition-all ${
        active
          ? "bg-white/80 dark:bg-white/15 shadow-sm ring-1 ring-orange-200/70 dark:ring-white/20 border-l-[3px] border-orange-500"
          : "hover:bg-white/50 dark:hover:bg-white/10 border-l-[3px] border-transparent"
      }`}
      style={{ width: "calc(100% - 1rem)" }}
    >
      <div className="w-10 h-10 shrink-0 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-300">
        <LifeBuoy className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-pink-900 dark:text-white">
            {bug.title || "Bug report"}
          </span>
          <span className="text-[11px] text-pink-400 dark:text-white/50 shrink-0">
            {relativeTime(bug.created_date)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {bug.bug_number != null && (
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
              B{Math.round(bug.bug_number)}
            </span>
          )}
          {bug.urgency && (
            <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${URGENCY_TONE[bug.urgency] || URGENCY_TONE.Low}`}>
              {bug.urgency}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-pink-900/45 dark:text-white/45 mt-1">
          {bug.client_name ? `${bug.client_name} · ` : ""}{bug.description || "—"}
        </p>
      </div>
    </button>
  );
}