import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight } from "lucide-react";
import StatusChangeDialog from "./StatusChangeDialog";
import { ALL_STATUS_META, nextStatusFor } from "./inboxConfig";

// Tiny "Move to {Next Status}" quick-action shown under the latest outbound
// reply. On click it asks the AI for a super-brief summary of that reply, then
// opens the mandatory status-change dialog pre-filled with that summary.
export default function MoveToNextStatusBar({ thread, lastOutbound, currentUser, onStatusChange }) {
  const [pending, setPending] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  // Cache summaries per outbound message id so we don't re-summarize on each click.
  const summaryCache = useRef({});

  const next = nextStatusFor(thread.status, thread.source_app);
  if (!next) return null;

  const meta = ALL_STATUS_META[next];

  const handleClick = async () => {
    setPending(next);
    const cacheKey = lastOutbound?.id;

    // Reuse the cached summary instantly if we've already generated it.
    if (cacheKey && summaryCache.current[cacheKey] !== undefined) {
      setReason(summaryCache.current[cacheKey]);
      setLoading(false);
      return;
    }

    setReason("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("aiEmailAssist", {
        mode: "summarize_message",
        message_id: lastOutbound?.id,
        thread_id: thread.id,
      });
      const summary = res?.data?.summary || "";
      if (cacheKey) summaryCache.current[cacheKey] = summary;
      setReason(summary);
    } catch {
      setReason("");
    } finally {
      setLoading(false);
    }
  };

  const confirm = ({ name, reason }) => {
    onStatusChange(pending, { name, reason });
    setPending(null);
  };

  return (
    <>
      <div className="flex justify-end mt-1">
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/70 dark:bg-white/10 border border-white/70 dark:border-white/15 text-pink-700 dark:text-white/80 hover:bg-white/90 dark:hover:bg-white/15 transition-colors shadow-sm"
        >
          Move to {meta?.label || next}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <StatusChangeDialog
        open={!!pending}
        target={pending}
        fromStatus={thread.status}
        defaultName={currentUser?.full_name || ""}
        defaultReason={reason}
        reasonLoading={loading}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}