import React from "react";
import Avatar from "./Avatar";
import SourceBadge from "./SourceBadge";
import { relativeTime } from "./inboxConfig";

export default function ThreadRow({ thread, active, onClick }) {
  const unread = !thread.is_read;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left mx-2 my-1 px-3 py-3 flex gap-3 rounded-2xl transition-all ${
        active
          ? "bg-white/80 shadow-sm ring-1 ring-pink-200/70 border-l-[3px] border-pink-500"
          : "hover:bg-white/50 border-l-[3px] border-transparent"
      }`}
      style={{ width: "calc(100% - 1rem)" }}
    >
      <div className="relative">
        <Avatar name={thread.contact_name} email={thread.contact_email} size="md" />
        {unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-pink-500 border-2 border-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${unread ? "font-bold text-pink-900" : "font-medium text-pink-900/80"}`}>
            {thread.contact_name || thread.contact_email}
          </span>
          <span className="text-[11px] text-pink-400 shrink-0">{relativeTime(thread.last_activity_at || thread.created_date)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <SourceBadge source={thread.source_app} />
          <span className={`truncate text-xs ${unread ? "text-pink-700 font-medium" : "text-pink-900/50"}`}>{thread.subject}</span>
        </div>
        <p className="truncate text-xs text-pink-900/40 mt-1">{thread.snippet || "—"}</p>
      </div>
    </button>
  );
}