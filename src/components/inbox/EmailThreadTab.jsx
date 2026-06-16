import React, { useState, useEffect, useRef } from "react";
import { Mail, FileText, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import EmailPreviewModal from "./EmailPreviewModal";
import SubmissionPreviewModal from "./SubmissionPreviewModal";
import { SOURCE_META } from "./inboxConfig";

// Subtle, per-inbox outbound bubble styling (muted, brand-matched).
const OUTBOUND_BUBBLE = {
  support:    { bubble: "bg-amber-50/80 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-300/15", text: "text-amber-950 dark:text-amber-50", meta: "text-amber-700/70", name: "text-amber-800/80", body: "text-amber-900", hint: "text-amber-700/70" },
  events:     { bubble: "bg-rose-50/80 dark:bg-rose-400/10 border border-rose-200/60 dark:border-rose-300/15", text: "text-rose-950 dark:text-rose-50", meta: "text-rose-700/70", name: "text-rose-800/80", body: "text-rose-900", hint: "text-rose-700/70" },
  influencer: { bubble: "bg-violet-50/80 dark:bg-violet-400/10 border border-violet-200/60 dark:border-violet-300/15", text: "text-violet-950 dark:text-violet-50", meta: "text-violet-700/70", name: "text-violet-800/80", body: "text-violet-900", hint: "text-violet-700/70" },
};

// Strip HTML to a short plain-text preview for the bubble
function toPreview(m) {
  const raw = m.body_text || m.body_html || "";
  const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 280 ? text.slice(0, 280) + "…" : text;
}

// Build a short preview of the form submission for the bubble
function submissionPreview(formData) {
  const entries = Object.entries(formData || {}).filter(
    ([k, v]) => k !== "source_app" && v !== null && v !== undefined && v !== ""
  );
  const text = entries
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join(" · ");
  return text.length > 220 ? text.slice(0, 220) + "…" : text;
}

// Identify imported "Ticket assigned to ... " system notices (from the old
// system, captured via Gmail) so we can collapse repeated reassignment emails.
function isAssignmentNotice(m) {
  const text = `${m.snippet || ""} ${m.body_text || m.body_html || ""}`.toLowerCase();
  return /\bassigned to\b/.test(text);
}

export default function EmailThreadTab({ messages, loading, thread }) {
  const [preview, setPreview] = useState(null);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [summary, setSummary] = useState(thread?.submission_summary || "");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const bottomRef = useRef(null);

  const hasSubmission = thread?.form_data && Object.keys(thread.form_data).length > 0;
  const isCancellation = String(thread?.form_data?.inquiry_type || thread?.subject || "").toLowerCase().includes("cancel");

  // Load (or generate) the AI summary of the submission for the bubble preview.
  useEffect(() => {
    if (!thread?.id || !hasSubmission) return;
    if (thread.submission_summary) { setSummary(thread.submission_summary); return; }
    setSummaryLoading(true);
    base44.functions
      .invoke("aiEmailAssist", { mode: "summarize", thread_id: thread.id })
      .then((res) => setSummary(res?.data?.summary || ""))
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, [thread?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show reassignment notices only once: keep the most recent assignment notice
  // and drop the earlier duplicates from the thread view.
  const displayMessages = React.useMemo(() => {
    const list = messages || [];
    const notices = list.filter(isAssignmentNotice);
    if (notices.length <= 1) return list;
    const newest = notices.reduce((a, b) =>
      new Date(a.sent_at || 0) >= new Date(b.sent_at || 0) ? a : b
    );
    return list.filter((m) => !isAssignmentNotice(m) || m.id === newest.id);
  }, [messages]);

  // Scroll to the most recent message whenever the thread or messages change.
  useEffect(() => {
    if (loading) return;
    const id = setTimeout(() => bottomRef.current?.scrollIntoView({ block: "end" }), 50);
    return () => clearTimeout(id);
  }, [thread?.id, displayMessages.length, loading]);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const noEmails = displayMessages.length === 0;

  return (
    <>
      <div className="p-4 space-y-3">
        {/* Submission as the first inbound bubble */}
        {hasSubmission && (
          <div className="flex justify-start">
            <button
              onClick={() => setSubmissionOpen(true)}
              className="group max-w-[70%] text-left rounded-2xl rounded-bl-sm px-3 py-2 bg-white/85 dark:bg-white/10 backdrop-blur-sm border border-white/70 dark:border-white/15 text-pink-900 dark:text-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-pink-400 dark:text-white/55 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="font-medium text-pink-500 dark:text-white/80 truncate">{thread.contact_name || thread.contact_email}</span>
                <span>·</span>
                <span>{SOURCE_META[thread.source_app]?.label || "Form"} submission</span>
              </div>
              {thread.subject && (
                <div className="text-xs font-semibold text-pink-700 dark:text-white/90 mb-0.5 truncate">{thread.subject}</div>
              )}
              <div className="flex items-start gap-1.5 text-sm leading-snug text-pink-900/70 dark:text-white/75">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-pink-400 dark:text-white/50" />
                <span>{summaryLoading ? "Summarizing…" : (summary || submissionPreview(thread.form_data))}</span>
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
              <div className="text-[11px] text-pink-500 dark:text-white/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Tap to view full form
              </div>
            </button>
          </div>
        )}

        {noEmails && !hasSubmission && (
          <div className="flex flex-col items-center justify-center py-16 text-pink-400">
            <Mail className="w-10 h-10 mb-2" />
            <p className="text-sm">No emails yet. Send the first reply below.</p>
          </div>
        )}

        {displayMessages.map((m) => {
          const outbound = m.direction === "outbound";
          // Inbound replies: show a 1-2 line preview of the body instead of the subject.
          const bodyPreview = toPreview(m);
          const ob = OUTBOUND_BUBBLE[thread?.source_app] || OUTBOUND_BUBBLE.events;
          return (
            <div key={m.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
              <button
                onClick={() => setPreview(m)}
                className={`group max-w-[70%] text-left rounded-2xl px-3 py-2 shadow-sm transition-shadow hover:shadow-md backdrop-blur-sm ${
                  outbound
                    ? `${ob.bubble} ${ob.text} rounded-br-sm`
                    : "bg-white/85 dark:bg-white/10 backdrop-blur-sm border border-white/70 dark:border-white/15 text-pink-900 dark:text-white rounded-bl-sm"
                }`}
              >
                <div className={`flex items-center gap-1.5 text-[10px] mb-0.5 ${outbound ? `${ob.meta} dark:text-white/55` : "text-pink-400 dark:text-white/55"}`}>
                  <span className={`font-medium truncate ${outbound ? `${ob.name} dark:text-white/80` : "text-pink-500 dark:text-white/80"}`}>
                    {m.from_name || m.from_email}
                  </span>
                  <span>·</span>
                  <span>{m.sent_at ? new Date(m.sent_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                </div>
                {outbound ? (
                  <div className={`text-[13px] font-semibold leading-snug truncate ${ob.body} dark:text-white/90`}>{m.subject || "(no subject)"}</div>
                ) : (
                  <div className="text-[13px] leading-snug text-pink-800/80 dark:text-white/80 line-clamp-2">{bodyPreview || m.subject || "(no content)"}</div>
                )}
                <div className={`text-[10px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${outbound ? `${ob.hint} dark:text-white/60` : "text-pink-500 dark:text-white/60"}`}>
                  Tap to view full email
                </div>
              </button>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <EmailPreviewModal message={preview} open={!!preview} onClose={() => setPreview(null)} />
      <SubmissionPreviewModal thread={thread} open={submissionOpen} onClose={() => setSubmissionOpen(false)} />
    </>
  );
}