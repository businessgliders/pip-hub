import React, { useState } from "react";
import Avatar from "./Avatar";
import StatusTrack from "./StatusTrack";
import StatusChangeDialog from "./StatusChangeDialog";
import { displayName, ticketLabel } from "./inboxConfig";
import { ArrowLeft, CheckCircle2, RotateCcw, ThumbsUp, ThumbsDown, PanelRight } from "lucide-react";

export default function ThreadHeader({ thread, currentUser, onStatusChange, onBack, onShowDetails }) {
  const isResolved = thread.status === "resolved" || thread.status === "closed";
  const isEvents = thread.source_app === "events";
  const isInfluencer = thread.source_app === "influencer";
  const inquiryType = thread.source_app === "support"
    ? thread.form_data?.inquiry_type
    : (thread.source_app === "events" ? (thread.form_data?.event_type || thread.form_data?.inquiry_type) : null);
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
    <div className="flex flex-wrap md:flex-nowrap items-center gap-y-2 gap-x-3 px-3 md:px-5 py-2.5 md:py-3.5 border-b border-white/50 dark:border-white/15">
      <button onClick={onBack} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/60 dark:hover:bg-white/10">
        <ArrowLeft className="w-5 h-5 text-pink-700 dark:text-pink-200" />
      </button>
      {/* Client avatar — hidden on mobile to save width */}
      <div className="hidden md:block">
        <Avatar name={thread.contact_name} email={thread.contact_email} size="md" />
      </div>
      <div className="flex-1 min-w-0 order-1 md:order-none">
        <h2 className="font-bold text-pink-900 dark:text-white truncate">{displayName(thread.contact_name, thread.contact_email)}</h2>
        <div className="flex items-center gap-1.5 mt-0.5">
          {ticketLabel(thread) && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-pink-900/10 text-pink-800 dark:bg-white/15 dark:text-white/80">
              {ticketLabel(thread)}
            </span>
          )}
          {inquiryType && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-200">
              {inquiryType}
            </span>
          )}
        </div>
      </div>

      <div className="flex w-full md:w-auto order-2 md:order-none flex-wrap md:flex-nowrap items-center justify-end gap-1.5 md:gap-2 min-w-0">
        {/* Status — visual thread (desktop) / dropdown (mobile), now before assign */}
        <StatusTrack status={thread.status} source={thread.source_app} onSelect={requestChange} />

        {/* Influencer — Approve / Decline buttons (move to Accepted / Declined) */}
        {isInfluencer && (
          <>
            <button
              onClick={() => requestChange("accepted")}
              title="Accept"
              className="flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-full text-white bg-emerald-600/90 hover:bg-emerald-600 transition-colors shadow-sm text-xs font-semibold whitespace-nowrap"
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="hidden lg:inline">Accept</span>
            </button>
            <button
              onClick={() => requestChange("declined")}
              title="Decline"
              className="flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-full text-white bg-rose-600/90 hover:bg-rose-600 transition-colors shadow-sm text-xs font-semibold whitespace-nowrap"
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="hidden lg:inline">Decline</span>
            </button>
          </>
        )}

        {/* Resolve / Reopen — text button on desktop, icon on mobile (Events & Influencer use their own pipelines) */}
        {!isEvents && !isInfluencer && (
          <button
            onClick={() => requestChange(isResolved ? "open" : "resolved")}
            title={isResolved ? "Reopen" : "Mark as resolved"}
            className="flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-full text-white bg-pink-950/90 hover:bg-pink-950 transition-colors shadow-sm text-xs font-semibold whitespace-nowrap"
          >
            {isResolved ? <RotateCcw className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {/* Full label on wide screens, shortened on tighter desktop widths, icon-only on tablet/mobile */}
            <span className="hidden xl:inline">{isResolved ? "Reopen" : "Mark as resolved"}</span>
            <span className="hidden lg:inline xl:hidden">{isResolved ? "Reopen" : "Resolve"}</span>
          </button>
        )}

        {/* Details — icon-only, mobile/tablet only, last button (desktop has the side panel) */}
        {onShowDetails && (
          <button
            onClick={onShowDetails}
            title="Show details"
            className="lg:hidden p-2 rounded-full text-pink-800 dark:text-white/80 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 transition-colors shadow-sm"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}
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