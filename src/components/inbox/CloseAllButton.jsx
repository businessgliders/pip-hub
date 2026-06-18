import React, { useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";

// Shown beside the filter when viewing the Events "Cancelled" list.
// Moves every thread in the current list to "Closed" status, showing a
// progress bar as it works through them one by one.
export default function CloseAllButton({ threads, onCloseAll }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const eligible = threads.filter((t) => t.status === "Cancelled");
  const total = eligible.length;

  const handleClick = async () => {
    if (busy) return;
    if (!total) {
      window.alert("No cancelled tickets to close.");
      return;
    }
    if (!window.confirm(`Move ${total} cancelled ticket(s) to Closed?`)) return;
    setBusy(true);
    setProgress(0);
    try {
      await onCloseAll(eligible, (done) => setProgress(done));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const pct = total ? Math.round((progress / total) * 100) : 0;

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={total ? `Close ${total} cancelled ticket(s)` : "Moves cancelled tickets to Closed"}
      className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/60 dark:bg-white/10 text-pink-700 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/20 transition-colors disabled:opacity-80 overflow-hidden"
    >
      {busy && (
        <span
          className="absolute inset-0 bg-pink-400/30 transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      )}
      <span className="relative inline-flex items-center gap-1.5">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
        {busy ? `Closing ${progress}/${total}` : "Close All"}
      </span>
    </button>
  );
}