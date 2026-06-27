import React, { useState } from "react";
import Avatar from "./Avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, Loader2, CheckCircle2, X } from "lucide-react";

// Escalate / assignment control shown in the detail panel.
// Pick a staff member from the dropdown, then click the checkmark to confirm
// the escalation — which assigns the thread and notifies that person.
export default function AssigneePanel({ thread, staff = [], onAssign, accent }) {
  const assignee = staff.find((s) => s.email === thread.assignee_email);
  // Staged (not-yet-confirmed) pick from the dropdown.
  const [pending, setPending] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  // Reason-for-escalation prompt, shown once a new person is staged.
  const [reason, setReason] = useState("");

  const picked = pending || (assignee ? { email: assignee.email, full_name: assignee.full_name } : null);
  const isNewPick = pending && pending.email !== thread.assignee_email;

  // Format as "First L." (first name + last-name initial).
  const shortName = (full = "") => {
    const parts = String(full).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  const handleConfirm = async () => {
    if (!isNewPick) return;
    setConfirming(true);
    await Promise.resolve(onAssign(pending.email, reason.trim()));
    setConfirming(false);
    setConfirmed(pending);
    setPending(null);
    setReason("");
    setTimeout(() => setConfirmed(null), 5000);
  };

  const cancelPick = () => { setPending(null); setReason(""); };

  return (
    <div className="px-4 py-4 border-t border-white/50 dark:border-white/15">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide mb-2 opacity-60 dark:text-white/60">
        Escalate
      </h4>

      {/* Currently assigned-to pill */}
      {assignee && (
        <div className="mb-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/60 dark:bg-white/10 border border-white/60 dark:border-white/15">
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60 dark:text-white/60">Assigned to</span>
          <Avatar name={assignee.full_name} email={assignee.email} photoUrl={assignee.photo_url} size="sm" />
          <span className="text-xs font-medium dark:text-white/85" style={{ color: accent }}>{shortName(assignee.full_name)}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors">
              <span className="text-sm font-medium truncate dark:text-white/85" style={{ color: accent }}>
                {picked ? picked.full_name : "Escalate to…"}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0 opacity-60" style={{ color: accent }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto w-56">
            {staff.filter((s) => s.email !== thread.assignee_email).map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => { setPending({ email: s.email, full_name: s.full_name }); setConfirmed(null); }} className="text-sm gap-2">
                <Avatar name={s.full_name} email={s.email} photoUrl={s.photo_url} size="sm" />
                {s.full_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Confirm checkmark — only active once a NEW person is staged AND a reason is entered. */}
        <button
          onClick={handleConfirm}
          disabled={!isNewPick || confirming || !reason.trim()}
          title={!isNewPick ? "Pick someone to escalate to" : !reason.trim() ? "Add a reason to escalate" : `Confirm escalation to ${pending.full_name}`}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-2xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: accent || "#f1889b" }}
        >
          {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
      </div>

      {/* Reason prompt — required once a new person is staged. */}
      {isNewPick && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide opacity-60 dark:text-white/60">
              Reason for escalation
            </label>
            <button onClick={cancelPick} title="Cancel" className="p-0.5 rounded-full hover:bg-white/40 dark:hover:bg-white/10">
              <X className="w-3.5 h-3.5 opacity-50" />
            </button>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            autoFocus
            placeholder={`Why is this going to ${shortName(pending.full_name)}?`}
            className="w-full text-sm rounded-xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/15 px-3 py-2 resize-none focus:outline-none focus:ring-1 dark:text-white placeholder:opacity-50"
            style={{ "--tw-ring-color": accent }}
          />
        </div>
      )}

      {/* Confirmation notice that the escalated person was notified. */}
      {confirmed && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {confirmed.full_name} has been notified.
        </div>
      )}
    </div>
  );
}