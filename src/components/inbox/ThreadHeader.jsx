import React, { useState } from "react";
import Avatar from "./Avatar";
import StatusTrack from "./StatusTrack";
import StatusChangeDialog from "./StatusChangeDialog";
import ThreadContactActions from "./ThreadContactActions";
import { displayName, ticketLabel } from "./inboxConfig";
import { ArrowLeft, CheckCircle2, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";

export default function ThreadHeader({ thread, currentUser, onStatusChange, onBack }) {
  const isResolved = thread.status === "resolved" || thread.status === "closed";
  const isEvents = thread.source_app === "events";
  const isInfluencer = thread.source_app === "influencer";
  const inquiryType = thread.source_app === "support" ? thread.form_data?.inquiry_type : null;
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
          {inquiryType && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-200">
              {inquiryType}
            </span>
          )}
        </div>
        <p className="text-xs text-pink-900/50 dark:text-white/60 truncate">{thread.subject}</p>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        {/* Status — visual thread (desktop) / dropdown (mobile), now before assign */}
        <StatusTrack status={thread.status} source={thread.source_app} onSelect={requestChange} />

        {/* Quick contact actions: Gmail search + Zoom call (matches spoke detail panel) */}
        <ThreadContactActions thread={thread} view={thread.source_app} />

        {/* Influencer — Approve / Decline buttons (move to Accepted / Declined) */}
        {isInfluencer && (
          <>
            <button
              onClick={() => requestChange("accepted")}
              title="Approve"
              className="flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-full text-white bg-emerald-600/90 hover:bg-emerald-600 transition-colors shadow-sm text-xs font-semibold whitespace-nowrap"
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="hidden lg:inline">Approve</span>
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
            {isResolved ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="hidden lg:inline">{isResolved ? "Reopen" : "Mark as resolved"}</span>
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