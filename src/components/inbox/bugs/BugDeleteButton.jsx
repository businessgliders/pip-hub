import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, Loader2 } from "lucide-react";

const GURPREEN_EMAIL = "gurpreen@pilatesinpinkstudio.com";
const HIDDEN_FOR_EMAIL = "info@pilatesinpinkstudio.com";

// Delete button for bug-report threads. Only Gurpreen Sabharwal may delete a
// bug report. Hidden entirely for the info@pilatesinpinkstudio.com user.
export default function BugDeleteButton({ bug, onDeleted }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const currentEmail = (currentUser?.email || "").toLowerCase();
  if (currentEmail === HIDDEN_FOR_EMAIL) return null;
  if (currentEmail !== GURPREEN_EMAIL) return null;

  const handleDelete = async () => {
    if (busy) return;
    if (!window.confirm("Delete this bug report permanently? This cannot be undone.")) return;
    setBusy(true);
    try {
      await base44.entities.BugReport.delete(bug.id);
      qc.setQueryData(["bug-reports"], (prev) => (prev || []).filter((b) => b.id !== bug.id));
      qc.invalidateQueries({ queryKey: ["bug-reports"] });
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
        Delete bug report
      </button>
    </div>
  );
}