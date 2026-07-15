import React, { useMemo, useState } from "react";
import { Archive } from "lucide-react";

// Icon-only button (shown beside the filter on a "resolved-stage" list) that
// moves every eligible thread — matching `fromStatus` and created before the
// start of the current month — into `toStatus`, with an inline progress bar.
// `accent` is a hex color for the badge/bar so it matches the active inbox.
export default function CloseOldButton({ threads = [], fromStatus, toStatus, accent = "#f1889b", onCloseOld }) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);

  const eligible = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return threads.filter((t) => {
      if (t.status !== fromStatus) return false;
      const raw = t.last_activity_at || t.created_date;
      const time = raw ? new Date(raw).getTime() : NaN;
      return !isNaN(time) && time < startOfMonth;
    });
  }, [threads, fromStatus]);

  const total = eligible.length;

  const run = async () => {
    if (!total || running) return;
    setRunning(true);
    setDone(0);
    await onCloseOld(eligible, (d) => setDone(d));
    setTimeout(() => { setRunning(false); setDone(0); }, 800);
  };

  if (total === 0 && !running) return null;

  if (running) {
    const pct = total ? Math.round((done / total) * 100) : 100;
    return (
      <div className="flex items-center gap-2 min-w-[110px]">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${accent}33` }}>
          <div className="h-full transition-all duration-200" style={{ width: `${pct}%`, backgroundColor: accent }} />
        </div>
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: accent }}>
          {done}/{total}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={run}
      title={`Move ${total} ${fromStatus} ticket${total === 1 ? "" : "s"} from previous months to ${toStatus}`}
      className="relative flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:brightness-95"
      style={{ backgroundColor: `${accent}26`, color: accent }}
    >
      <Archive className="w-4 h-4" />
      <span
        className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
        style={{ backgroundColor: accent }}
      >
        {total}
      </span>
    </button>
  );
}