import React from "react";
import { UserPlus } from "lucide-react";
import { ALL_STATUS_META } from "./inboxConfig";
import { relativeTime } from "./inboxConfig";

// Shows the audit trail of status changes (name + reason) for a thread,
// rendered in the detail panel as "Activity".
export default function ActivityLog({ thread, accent }) {
  const history = [...(thread?.status_history || [])].reverse();

  return (
    <div className="px-4 py-4 border-t border-white/50 dark:border-white/15">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide mb-2 opacity-60 dark:text-white/60">
        Activity
      </h4>

      {history.length === 0 ? (
        <p className="text-xs opacity-50 dark:text-white/50">No activity yet.</p>
      ) : (
        <ol className="space-y-3">
          {history.map((h, i) => {
            const meta = ALL_STATUS_META[h.status];
            const isAssignment = h.event === "assignment";
            return (
              <li key={i} className="flex gap-2.5">
                {isAssignment ? (
                  <UserPlus className="mt-0.5 w-3 h-3 shrink-0" style={{ color: accent }} />
                ) : (
                  <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
                )}
                <div className="min-w-0">
                  {/* Title = the actual change. For assignments that's the
                      "Escalated/Assigned to X" label; otherwise the status move. */}
                  <p className="text-xs font-medium dark:text-white/85 break-words" style={{ color: accent }}>
                    {isAssignment ? (h.note || "Escalated") : `Moved to ${meta?.label || h.status}`}
                  </p>
                  {/* Optional middle line — any note/reason that accompanied the change. */}
                  {(isAssignment ? h.reason : h.note) && (
                    <p className="text-[11px] mt-0.5 italic opacity-70 dark:text-white/65 break-words">
                      “{isAssignment ? h.reason : h.note}”
                    </p>
                  )}
                  {/* Date always last. */}
                  <p className="text-[11px] mt-0.5 opacity-60 dark:text-white/55">
                    {h.name || "Staff"} · {relativeTime(h.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}