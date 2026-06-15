import React from "react";
import { ALL_STATUS_META, STATUS_META, SOURCE_META, ticketLabel, relativeTimeLong, isClosedStatus, closedAt } from "./inboxConfig";

// A single thread row in the detail panel's "All Threads" list.
// Redesigned so the inbox (source) and status are shown distinctly — the inbox
// is a small dot + label, and the status is a colored chip. Also shows the
// ticket number, the date created (relative), and the closed date when closed.
export default function ThreadHistoryItem({ thread, active, accent, onSelect }) {
  const src = SOURCE_META[thread.source_app] || SOURCE_META.support;
  const statusMeta = ALL_STATUS_META[thread.status] || STATUS_META.open;
  const ticket = ticketLabel(thread);
  const closed = closedAt(thread);

  return (
    <button
      onClick={() => onSelect(thread)}
      className={`w-full text-left rounded-2xl border p-3 transition-colors ${
        active
          ? "border-pink-200 bg-white/70 dark:border-white/25 dark:bg-white/15"
          : "border-white/60 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      }`}
    >
      {/* Top row: inbox (dot + label) on the left, ticket# on the right */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-70 dark:text-white/70" style={{ color: accent }}>
          <span className={`w-2 h-2 rounded-full ${src.dot}`} />
          {src.label}
        </span>
        {ticket && (
          <span className="text-[11px] font-semibold opacity-50 dark:text-white/50">{ticket}</span>
        )}
      </div>

      {/* Subject */}
      <p className="text-xs font-medium truncate dark:text-white/85" style={{ color: accent }}>
        {thread.subject}
      </p>

      {/* Bottom row: status chip + dates */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusMeta.chip}`}>
          {statusMeta.label}
        </span>
        <span className="text-[11px] opacity-55 dark:text-white/55 text-right leading-tight">
          <span>Created {relativeTimeLong(thread.created_date)}</span>
          {isClosedStatus(thread.status) && closed && (
            <span className="block">Closed {relativeTimeLong(closed)}</span>
          )}
        </span>
      </div>
    </button>
  );
}