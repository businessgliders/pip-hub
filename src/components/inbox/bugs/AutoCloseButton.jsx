import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Archive, Loader2 } from "lucide-react";

// Moves Resolved bug tickets created before the current month into "Closed",
// with an inline progress bar. Shown beside the filter on the Resolved tab.
export default function AutoCloseButton({ bugs = [] }) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);

  // Resolved bugs whose created_date is before the 1st of the current month.
  const eligible = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return bugs.filter((b) => {
      if ((b.status || "New") !== "Resolved") return false;
      const t = b.created_date ? new Date(b.created_date).getTime() : NaN;
      return !isNaN(t) && t < startOfMonth;
    });
  }, [bugs]);

  const total = eligible.length;

  const run = async () => {
    if (!total || running) return;
    setRunning(true);
    setDone(0);
    for (const b of eligible) {
      await base44.entities.BugReport.update(b.id, { status: "Closed" }).catch(() => {});
      setDone((d) => d + 1);
    }
    // Brief pause so the completed bar is visible before it disappears.
    setTimeout(() => { setRunning(false); setDone(0); }, 800);
  };

  if (total === 0 && !running) return null;

  if (running) {
    const pct = total ? Math.round((done / total) * 100) : 100;
    return (
      <div className="flex items-center gap-2 min-w-[110px]">
        <div className="flex-1 h-2 rounded-full bg-[#6b7280]/20 overflow-hidden">
          <div
            className="h-full bg-[#6b7280] transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-[#4b5563] dark:text-white/70 tabular-nums">
          {done}/{total}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={run}
      title={`Move ${total} Resolved ticket${total === 1 ? "" : "s"} from previous months to Closed`}
      className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#6b7280]/15 text-[#4b5563] dark:bg-[#6b7280]/30 dark:text-white/80 hover:bg-[#6b7280]/25 transition-colors"
    >
      <Archive className="w-4 h-4" />
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#6b7280] text-white text-[9px] font-bold flex items-center justify-center">
        {total}
      </span>
    </button>
  );
}