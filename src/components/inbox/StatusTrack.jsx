import React from "react";
import { ALL_STATUS_META, statusOrderFor } from "./inboxConfig";
import StatusPill from "./StatusPill";

// Desktop: a horizontal "thread" of all available statuses for easy one-tap moves.
// Mobile/Tablet: falls back to the compact StatusPill dropdown.
export default function StatusTrack({ status, source, onSelect }) {
  const baseOrder = statusOrderFor(source);
  // Ensure the thread's actual current status is always shown, even if it's a
  // legacy value outside this inbox's standard set (e.g. an old "open" on an event).
  const order = status && !baseOrder.includes(status) && ALL_STATUS_META[status]
    ? [status, ...baseOrder]
    : baseOrder;

  return (
    <>
      {/* Mobile / tablet — simple dropdown */}
      <div className="lg:hidden">
        <StatusPill status={status} source={source} onChange={onSelect} />
      </div>

      {/* Desktop — visual status thread */}
      <div className="hidden lg:flex items-center gap-1 max-w-full overflow-x-auto">
        {order.map((s) => {
          const meta = ALL_STATUS_META[s];
          const active = s === status;
          const dot = meta.chip.split(" ")[0];
          return (
            <button
              key={s}
              onClick={() => !active && onSelect?.(s)}
              disabled={active}
              title={meta.label}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? `${meta.chip} ring-2 ring-pink-400/40 cursor-default`
                  : "text-pink-900/55 dark:text-white/55 hover:bg-white/60 dark:hover:bg-white/10"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${dot} ${active ? "" : "opacity-50 group-hover:opacity-100"}`} />
              {meta.label}
            </button>
          );
        })}
      </div>
    </>
  );
}