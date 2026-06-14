import React, { useState } from "react";
import Avatar from "./Avatar";
import StatusTrack from "./StatusTrack";
import StatusChangeDialog from "./StatusChangeDialog";
import { displayName, ticketLabel } from "./inboxConfig";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, UserPlus, PanelRight, CheckCircle2, RotateCcw } from "lucide-react";

export default function ThreadHeader({ thread, staff, currentUser, onStatusChange, onAssign, onBack, onToggleContact, contactOpen }) {
  const assignee = staff.find((s) => s.email === thread.assignee_email);
  const isResolved = thread.status === "resolved" || thread.status === "closed";
  const isEvents = thread.source_app === "events";
  const [pending, setPending] = useState(null); // target status awaiting name/reason

  const requestChange = (status) => {
    if (!status || status === thread.status) return;
    setPending(status);
  };

  const confirmChange = ({ name, reason }) => {
    onStatusChange(pending, { name, reason });
    setPending(null);
  };

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/50 dark:border-white/15">
      <button onClick={onBack} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/60 dark:hover:bg-white/10">
        <ArrowLeft className="w-5 h-5 text-pink-700 dark:text-pink-200" />
      </button>
      <Avatar name={thread.contact_name} email={thread.contact_email} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-pink-900 dark:text-white truncate">{displayName(thread.contact_name, thread.contact_email)}</h2>
          {ticketLabel(thread) && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-pink-900/10 text-pink-800 dark:bg-white/15 dark:text-white/80">
              {ticketLabel(thread)}
            </span>
          )}
        </div>
        <p className="text-xs text-pink-900/50 dark:text-white/60 truncate">{thread.subject}</p>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        {/* Status — visual thread (desktop) / dropdown (mobile), now before assign */}
        <StatusTrack status={thread.status} source={thread.source_app} onSelect={requestChange} />

        {/* Assign — icon only (shows assignee photo/initials when assigned) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title={assignee ? `Assigned to ${assignee.full_name}` : "Assign"}
              className="p-1 rounded-full hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
            >
              {assignee ? (
                <Avatar name={assignee.full_name} email={assignee.email} photoUrl={assignee.photo_url} size="sm" />
              ) : (
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/60 dark:bg-white/10 text-pink-700 dark:text-pink-200">
                  <UserPlus className="w-4 h-4" />
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
            {staff.map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => onAssign(s.email)} className="text-sm gap-2">
                <Avatar name={s.full_name} email={s.email} photoUrl={s.photo_url} size="sm" />
                {s.full_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Resolve / Reopen — icon only (Events use pipeline stages, no resolve toggle) */}
        {!isEvents && (
          <button
            onClick={() => requestChange(isResolved ? "open" : "resolved")}
            title={isResolved ? "Reopen" : "Resolve"}
            className="p-2 rounded-full text-white bg-pink-950/90 hover:bg-pink-950 transition-colors shadow-sm"
          >
            {isResolved ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
        )}

        {/* Toggle details — icon only */}
        <button
          onClick={onToggleContact}
          title={contactOpen ? "Hide details" : "Show details"}
          className={`p-1.5 rounded-full transition-colors ${
            contactOpen ? "bg-white/70 dark:bg-white/15 text-pink-700 dark:text-pink-200" : "hover:bg-white/60 dark:hover:bg-white/10 text-pink-700/70 dark:text-white/60"
          }`}
        >
          <PanelRight className="w-5 h-5" />
        </button>
      </div>

      <StatusChangeDialog
        open={!!pending}
        target={pending}
        fromStatus={thread.status}
        defaultName={currentUser?.full_name || ""}
        onConfirm={confirmChange}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}