import React, { useState } from "react";
import { CopyCheck, Loader2 } from "lucide-react";

// Shown beside the filter when viewing a "Closed" status list.
// Archives every thread in the current list whose last activity is from the
// previous month or earlier (the current month is excluded).
export default function ArchiveButton({ threads, onArchive }) {
  const [busy, setBusy] = useState(false);

  // Threads whose last activity is before the start of the current month.
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const eligible = threads.filter((t) => {
    const d = new Date(t.last_activity_at || t.created_date || 0);
    return d < startOfMonth;
  });

  const handleClick = async () => {
    if (!eligible.length || busy) return;
    if (!window.confirm(`Archive ${eligible.length} closed conversation(s) from last month and earlier?`)) return;
    setBusy(true);
    try {
      await onArchive(eligible);
    } finally {
      setBusy(false);
    }
  };

  if (!eligible.length) return null;

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={`Archive ${eligible.length} (last month & earlier)`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/60 dark:bg-white/10 text-pink-700 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/20 transition-colors disabled:opacity-60"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CopyCheck className="w-3.5 h-3.5" />}
      Archive All
    </button>
  );
}