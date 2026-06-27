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
                  {/* For escalations/assignments, lead with the reason note (falling
                      back to "Escalated/Assigned to X" when no reason was given). */}
                  <p className="text-xs font-medium dark:text-white/85 break-words" style={{ color: accent }}>
                    {isAssignment ? (h.reason || h.note || "Escalated") : `Moved to ${meta?.label || h.status}`}
                  </p>
                  <p className="text-[11px] opacity-60 dark:text-white/55">
                    {h.name || "Staff"} · {relativeTime(h.timestamp)}
                  </p>
                  {/* Show the "Escalated/Assigned to X" line as a secondary detail
                      when a reason was the primary line. Status-change reason in `note`. */}
                  {isAssignment ? (
                    h.reason && h.note && (
                      <p className="text-[11px] mt-0.5 opacity-60 dark:text-white/55 break-words">{h.note}</p>
                    )
                  ) : (
                    h.note && (
                      <p className="text-[11px] mt-0.5 italic opacity-70 dark:text-white/65 break-words">“{h.note}”</p>
                    )
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