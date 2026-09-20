import React, { useState } from "react";
import { Sparkles, Tag, Clock } from "lucide-react";
import SubmissionDetails from "@/components/inbox/SubmissionDetails";
import { ticketLabel } from "@/components/inbox/inboxConfig";
import ExpandToggleButton from "./ExpandToggleButton";

// The first bubble in a thread: the original form submission.
// Collapsed it shows the AI summary; tapping expands the full form inline.
export default function SubmissionMessageItem({
  thread,
  summary,
  summaryLoading,
  previewText,
  sourceLabel,
  dateLabel,
  isCancellation,
}) {
  const [expanded, setExpanded] = useState(false);
  const ticket = ticketLabel(thread);
  const inquiryType = thread.source_app === "support" ? thread.form_data?.inquiry_type : null;

  return (
    <div className="flex justify-start">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } }}
        className={`group text-left rounded-2xl rounded-bl-sm px-3 py-2 bg-white/85 dark:bg-white/10 backdrop-blur-sm border border-white/70 dark:border-white/15 text-pink-900 dark:text-white shadow-sm transition-shadow hover:shadow-md cursor-pointer ${
          expanded ? "w-full max-w-full" : "max-w-[70%]"
        }`}
      >
        <div className="flex items-center gap-1.5 text-[11px] text-pink-400 dark:text-white/55 mb-1">
          <span className="font-medium text-pink-500 dark:text-white/80 truncate">{thread.contact_name || thread.contact_email}</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold text-pink-500 dark:text-white/80 bg-white/40 dark:bg-white/10">
            <Sparkles className="w-2.5 h-2.5" /> {sourceLabel} submission
          </span>
        </div>
        {thread.subject && (
          <div className={`text-xs font-semibold text-pink-700 dark:text-white/90 mb-0.5 ${expanded ? "" : "truncate"}`}>{thread.subject}</div>
        )}
        <div className="flex items-start gap-1.5 text-sm leading-snug text-pink-900/70 dark:text-white/75">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-pink-400 dark:text-white/50" />
          <span>{summaryLoading ? "Summarizing…" : (summary || previewText)}</span>
        </div>

        {isCancellation && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {thread.form_data?.discount_offered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                🎁 Offer: {String(thread.form_data.discount_offered)}
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
              thread.form_data?.discount_accepted
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200"
            }`}>
              {thread.form_data?.discount_accepted ? "Stayed (accepted offer)" : "Continued with cancellation"}
            </span>
          </div>
        )}

        {expanded && (
          <div className="mt-2 pt-2 border-t border-pink-100 dark:border-white/15 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {ticket && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-black/5 dark:bg-white/10 text-pink-700 dark:text-white/80">
                  {ticket}
                </span>
              )}
              {inquiryType && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-700 dark:text-sky-200">
                  <Tag className="w-3 h-3" /> {inquiryType}
                </span>
              )}
              {dateLabel && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/5 dark:bg-white/10 text-pink-600 dark:text-white/70">
                  <Clock className="w-3 h-3" /> {dateLabel}
                </span>
              )}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <SubmissionDetails formData={thread.form_data} sourceApp={thread.source_app} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <span className={`text-[11px] text-pink-500 dark:text-white/60 transition-opacity ${expanded ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
            Tap to view full form
          </span>
          <div className="flex items-center gap-1.5">
            {dateLabel && !expanded && (
              <span className="text-[10px] text-pink-400 dark:text-white/55 whitespace-nowrap">{dateLabel}</span>
            )}
            <ExpandToggleButton expanded={expanded} onCollapse={() => setExpanded(false)} className="text-pink-500 dark:text-white/70" />
          </div>
        </div>
      </div>
    </div>
  );
}