import React from "react";
import Avatar from "./Avatar";
import SourceBadge from "./SourceBadge";
import { relativeTime } from "./inboxConfig";

export default function ThreadRow({ thread, active, onClick }) {
  const unread = !thread.is_read;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex gap-3 border-b border-slate-100 transition-colors ${
        active ? "bg-slate-100" : "hover:bg-slate-50"
      }`}
    >
      <div className="relative">
        <Avatar name={thread.contact_name} email={thread.contact_email} size="md" />
        {unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${unread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
            {thread.contact_name || thread.contact_email}
          </span>
          <span className="text-[11px] text-slate-400 shrink-0">{relativeTime(thread.last_activity_at || thread.created_date)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <SourceBadge source={thread.source_app} />
          <span className={`truncate text-xs ${unread ? "text-slate-700 font-medium" : "text-slate-500"}`}>{thread.subject}</span>
        </div>
        <p className="truncate text-xs text-slate-400 mt-1">{thread.snippet || "—"}</p>
      </div>
    </button>
  );
}