import React, { useState } from "react";
import Avatar from "./Avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, Loader2, CheckCircle2 } from "lucide-react";

// Escalate / assignment control shown in the detail panel.
// Pick a staff member from the dropdown, then click the checkmark to confirm
// the escalation — which assigns the thread and notifies that person.
export default function AssigneePanel({ thread, staff = [], onAssign, accent }) {
  const assignee = staff.find((s) => s.email === thread.assignee_email);
  // Staged (not-yet-confirmed) pick from the dropdown.
  const [pending, setPending] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const picked = pending || (assignee ? { email: assignee.email, full_name: assignee.full_name } : null);
  const isNewPick = pending && pending.email !== thread.assignee_email;

  const handleConfirm = async () => {
    if (!isNewPick) return;
    setConfirming(true);
    await Promise.resolve(onAssign(pending.email));
    setConfirming(false);
    setConfirmed(pending);
    setPending(null);
    setTimeout(() => setConfirmed(null), 5000);
  };

  return (
    <div className="px-4 py-4 border-t border-white/50 dark:border-white/15">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide mb-2 opacity-60 dark:text-white/60">
        Escalate
      </h4>
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
            {staff.map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => { setPending({ email: s.email, full_name: s.full_name }); setConfirmed(null); }} className="text-sm gap-2">
                <Avatar name={s.full_name} email={s.email} photoUrl={s.photo_url} size="sm" />
                {s.full_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Confirm checkmark — only active once a NEW person is staged. */}
        <button
          onClick={handleConfirm}
          disabled={!isNewPick || confirming}
          title={isNewPick ? `Confirm escalation to ${pending.full_name}` : "Pick someone to escalate to"}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-2xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: accent || "#f1889b" }}
        >
          {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
      </div>

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