import React from "react";
import { ALL_STATUS_META } from "./inboxConfig";
import { relativeTime } from "./inboxConfig";

// Shows the audit trail of status changes (name + reason) for a thread,
// rendered in the detail panel as "Activity".
export default function ActivityLog({ thread, accent }) {
  const history = [...(thread?.status_history || [])].reverse();

  return (
    <div className="px-4 py-4 border-b border-white/50 dark:border-white/15">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide mb-2 opacity-60 dark:text-white/60">
        Activity
      </h4>

      {history.length === 0 ? (
        <p className="text-xs opacity-50 dark:text-white/50">No activity yet.</p>
      ) : (
        <ol className="space-y-3">
          {history.map((h, i) => {
            const meta = ALL_STATUS_META[h.status];
            return (
              <li key={i} className="flex gap-2.5">
                <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium dark:text-white/85" style={{ color: accent }}>
                    Moved to {meta?.label || h.status}
                  </p>
                  <p className="text-[11px] opacity-60 dark:text-white/55">
                    {h.name || "Staff"} · {relativeTime(h.timestamp)}
                  </p>
                  {h.note && (
                    <p className="text-[11px] mt-0.5 italic opacity-70 dark:text-white/65 break-words">
                      “{h.note}”
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}