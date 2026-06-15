import React, { useState } from "react";
import { CopyCheck, Loader2 } from "lucide-react";

// Shown beside the filter when viewing a "Closed" status list.
// Archives every thread in the current list whose last activity is from the
// current month or older.
export default function ArchiveButton({ threads, onArchive }) {
  const [busy, setBusy] = useState(false);

  // Threads from the current month or older (i.e. not in a future month).
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const eligible = threads.filter((t) => {
    const d = new Date(t.last_activity_at || t.created_date || 0);
    return d <= endOfMonth;
  });

  const handleClick = async () => {
    if (!eligible.length || busy) return;
    if (!window.confirm(`Archive ${eligible.length} closed conversation(s) from this month and older?`)) return;
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
      title={`Archive ${eligible.length} (this month & older)`}
      className="p-1.5 rounded-full bg-white/60 dark:bg-white/10 text-pink-700 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/20 transition-colors disabled:opacity-60"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CopyCheck className="w-4 h-4" />}
    </button>
  );
}