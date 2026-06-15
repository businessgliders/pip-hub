import React from "react";
import Avatar from "./Avatar";
import { relativeTime, displayName } from "./inboxConfig";

export default function ThreadRow({ thread, active, onClick }) {
  const unread = !thread.is_read;
  // Cancellation tickets get a small "Cancel" label (no row highlight).
  const isCancellation = String(thread.form_data?.inquiry_type || thread.subject || "").toLowerCase().includes("cancel");
  return (
    <button
      onClick={onClick}
      className={`w-full text-left mx-2 my-1 px-3 py-3 flex gap-3 rounded-2xl transition-all ${
        active
          ? "bg-white/80 dark:bg-white/15 shadow-sm ring-1 ring-pink-200/70 dark:ring-white/20 border-l-[3px] border-pink-500"
          : "hover:bg-white/50 dark:hover:bg-white/10 border-l-[3px] border-transparent"
      }`}
      style={{ width: "calc(100% - 1rem)" }}
    >
      <div className="relative">
        <Avatar name={thread.contact_name} email={thread.contact_email} size="md" />
        {unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-pink-500 border-2 border-white dark:border-neutral-800" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${unread ? "font-bold text-pink-900 dark:text-white" : "font-medium text-pink-900/80 dark:text-white/85"}`}>
            {displayName(thread.contact_name, thread.contact_email)}
          </span>
          <span className="text-[11px] text-pink-400 dark:text-white/50 shrink-0">{relativeTime(thread.last_activity_at || thread.created_date)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isCancellation && (
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              Cancel
            </span>
          )}
          {!isCancellation && (
            <span className={`truncate text-xs ${unread ? "text-pink-700 dark:text-white/80 font-medium" : "text-pink-900/50 dark:text-white/55"}`}>{thread.subject}</span>
          )}
        </div>
        <p className="truncate text-xs text-pink-900/40 dark:text-white/45 mt-1">{thread.snippet || "—"}</p>
      </div>
    </button>
  );
}