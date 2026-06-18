import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, Loader2 } from "lucide-react";

const GURPREEN_EMAIL = "gurpreen@pilatesinpinkstudio.com";
const HIDDEN_FOR_EMAIL = "info@pilatesinpinkstudio.com";

// Shown in the detail panel ONLY when the ticket is escalated/assigned to
// Gurpreen Sabharwal. Lets that owner delete the thread.
// Hidden entirely for the info@pilatesinpinkstudio.com user.
export default function ThreadDeleteButton({ thread, onDeleted }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const currentEmail = (currentUser?.email || "").toLowerCase();
  // Gurpreen can delete any ticket. Otherwise only show when the ticket is
  // assigned/escalated to Gurpreen.
  const isGurpreen = currentEmail === GURPREEN_EMAIL;
  const assignedToGurpreen =
    (thread.assignee_email || "").toLowerCase() === GURPREEN_EMAIL;
  const isHiddenUser = currentEmail === HIDDEN_FOR_EMAIL;

  if (isHiddenUser) return null;
  if (!isGurpreen && !assignedToGurpreen) return null;

  const handleDelete = async () => {
    if (busy) return;
    if (!window.confirm("Delete this ticket permanently? This cannot be undone.")) return;
    setBusy(true);
    try {
      await base44.entities.Thread.delete(thread.id);
      qc.setQueryData(["threads"], (prev) => (prev || []).filter((t) => t.id !== thread.id));
      qc.invalidateQueries({ queryKey: ["threads"] });
      onDeleted?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-4 border-t border-white/50 dark:border-white/15">
      <button
        onClick={handleDelete}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl text-sm font-semibold text-red-600 dark:text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        Delete ticket
      </button>
    </div>
  );
}