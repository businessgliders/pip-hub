import React from "react";
import { ArrowLeft, LifeBuoy, Paperclip } from "lucide-react";

const URGENCY_TONE = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-200",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-500/25 dark:text-orange-200",
  Soon: "bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200",
  Low: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60",
};

// Renders a single transcript line as an inbound/outbound chat bubble,
// matching the email-thread bubble style.
function TranscriptBubble({ entry }) {
  const isUser = entry.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm backdrop-blur-sm text-[13px] leading-snug ${
          isUser
            ? "bg-orange-200/80 dark:bg-orange-400/20 border border-orange-300/60 dark:border-orange-300/25 text-orange-950 dark:text-orange-50 rounded-br-sm"
            : "bg-white/85 dark:bg-white/10 border border-white/70 dark:border-white/15 text-pink-900 dark:text-white rounded-bl-sm"
        }`}
      >
        {entry.content}
      </div>
    </div>
  );
}

export default function BugDetailPanel({ bug, onBack }) {
  const transcript = bug.transcript || [];
  const images = bug.image_urls || [];

  return (
    <div className="relative flex flex-col h-full">
      {/* Header — matches ThreadHeader layout */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/50 dark:border-white/10 shrink-0">
        {onBack && (
          <button onClick={onBack} className="md:hidden p-1.5 -ml-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-orange-700 dark:text-white/80" />
          </button>
        )}
        <div className="w-9 h-9 shrink-0 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-300">
          <LifeBuoy className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-pink-900 dark:text-white truncate">{bug.title || "Bug report"}</span>
            {bug.bug_number != null && (
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                B{Math.round(bug.bug_number)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-pink-500 dark:text-white/55 mt-0.5">
            {bug.urgency && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-bold ${URGENCY_TONE[bug.urgency] || URGENCY_TONE.Low}`}>
                {bug.urgency}
              </span>
            )}
            <span>{bug.status || "New"}</span>
            {bug.platform && <><span>·</span><span className="truncate">{bug.platform}</span></>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto ios-scroll p-4 space-y-3">
        {/* Meta card */}
        <div className="rounded-2xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/15 p-3 text-sm">
          {bug.description && <p className="text-pink-900/85 dark:text-white/85 leading-snug whitespace-pre-line">{bug.description}</p>}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-[12px]">
            {bug.reported_by_name && <Field label="Reported by" value={bug.reported_by_name} />}
            {bug.client_name && <Field label="Client" value={bug.client_name} />}
            {bug.booking_info && <Field label="Booking" value={bug.booking_info} />}
            {bug.ticket_number && <Field label="Ticket" value={`#${bug.ticket_number}`} />}
            {bug.escalated_to && <Field label="Escalated to" value={bug.escalated_to} />}
            {bug.email_status && <Field label="Email" value={bug.email_status} />}
          </div>
        </div>

        {/* Attachments */}
        {images.length > 0 && (
          <div className="rounded-2xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/15 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-pink-500 dark:text-white/60 mb-2">
              <Paperclip className="w-3.5 h-3.5" /> {images.length} attachment{images.length === 1 ? "" : "s"}
            </div>
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-200 text-xs font-medium hover:bg-orange-100 transition-colors">
                  File {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Transcript — email-thread bubble style */}
        {transcript.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-pink-400 dark:text-white/40 px-1">Report transcript</div>
            {transcript.map((entry, i) => <TranscriptBubble key={i} entry={entry} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] uppercase tracking-wide text-pink-400 dark:text-white/40">{label}</span>
      <span className="block truncate text-pink-900/80 dark:text-white/80 font-medium">{value}</span>
    </div>
  );
}