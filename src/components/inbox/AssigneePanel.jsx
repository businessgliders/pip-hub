import React, { useState } from "react";
import Avatar from "./Avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, Loader2, CheckCircle2 } from "lucide-react";
import { assignVerb, isEscalationTarget } from "./inboxConfig";

// Escalate / assignment control shown in the detail panel.
// Pick a staff member from the dropdown — a popup then asks for a reason and
// confirms, which assigns the thread and notifies that person.
export default function AssigneePanel({ thread, staff = [], onAssign, accent }) {
  const assignee = staff.find((s) => s.email === thread.assignee_email);
  // Staged (not-yet-confirmed) pick — drives the reason popup.
  const [pending, setPending] = useState(null);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  // Format as "First L." (first name + last-name initial).
  const shortName = (full = "") => {
    const parts = String(full).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  // "Escalated to" for the three execs; "Assigned to" for front desk.
  const assignedVerb = assignee ? assignVerb(assignee.email) : "Assigned";

  const startPick = (s) => { setPending({ email: s.email, full_name: s.full_name }); setReason(""); setConfirmed(null); };
  const cancelPick = () => { setPending(null); setReason(""); };

  const handleConfirm = async () => {
    if (!pending || !reason.trim()) return;
    setConfirming(true);
    await Promise.resolve(onAssign(pending.email, reason.trim()));
    setConfirming(false);
    setConfirmed(pending);
    setPending(null);
    setReason("");
    setTimeout(() => setConfirmed(null), 5000);
  };

  const pendingVerb = pending ? assignVerb(pending.email) : "Escalate";

  return (
    <div className="px-4 py-4 border-t border-white/50 dark:border-white/15">
      {/* Section header: title + current assigned/escalated pill beside it */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide opacity-60 dark:text-white/60">
          Escalate
        </h4>
        {assignee && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/60 dark:bg-white/10 border border-white/60 dark:border-white/15 min-w-0">
            <span className="text-[9px] font-semibold uppercase tracking-wide opacity-60 dark:text-white/60 shrink-0">
              {isEscalationTarget(assignee.email) ? "Escalated to" : "Assigned to"}
            </span>
            <Avatar name={assignee.full_name} email={assignee.email} photoUrl={assignee.photo_url} size="sm" />
            <span className="text-xs font-medium truncate dark:text-white/85" style={{ color: accent }}>{shortName(assignee.full_name)}</span>
          </div>
        )}
      </div>

      {/* Escalate container — tinted background so the field is easy to see */}
      <div className="rounded-2xl bg-white/55 dark:bg-white/[0.07] border border-white/60 dark:border-white/15 p-2.5 shadow-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full min-w-0 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 transition-colors">
              <span className="text-sm font-medium truncate dark:text-white/85" style={{ color: accent }}>
                {assignee ? assignee.full_name : "Escalate to…"}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0 opacity-60" style={{ color: accent }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto w-56">
            {staff.filter((s) => s.email !== thread.assignee_email).map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => startPick(s)} className="text-sm gap-2">
                <Avatar name={s.full_name} email={s.email} photoUrl={s.photo_url} size="sm" />
                {s.full_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Confirmation notice that the escalated/assigned person was notified. */}
      {confirmed && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {confirmed.full_name} has been notified.
        </div>
      )}

      {/* Reason popup — required before confirming the escalation/assignment. */}
      <Dialog open={!!pending} onOpenChange={(o) => { if (!o) cancelPick(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingVerb} to {pending ? shortName(pending.full_name) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide opacity-60">
              Reason for {pendingVerb.toLowerCase()}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder={`Why is this going to ${pending ? shortName(pending.full_name) : "them"}?`}
              className="w-full text-sm rounded-xl bg-muted/50 border border-border px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={cancelPick} disabled={confirming}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              disabled={!reason.trim() || confirming}
              className="gap-2 text-white"
              style={{ background: accent || "#f1889b" }}
            >
              {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}