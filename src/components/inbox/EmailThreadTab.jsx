import React, { useState } from "react";
import { Mail, FileText } from "lucide-react";
import EmailPreviewModal from "./EmailPreviewModal";
import SubmissionPreviewModal from "./SubmissionPreviewModal";
import { SOURCE_META } from "./inboxConfig";

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

export default function EmailThreadTab({ messages, loading, thread }) {
  const [preview, setPreview] = useState(null);
  const [submissionOpen, setSubmissionOpen] = useState(false);

  const hasSubmission = thread?.form_data && Object.keys(thread.form_data).length > 0;

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const noEmails = !messages || messages.length === 0;

  return (
    <>
      <div className="p-4 space-y-3">
        {/* Submission as the first inbound bubble */}
        {hasSubmission && (
          <div className="flex justify-start">
            <button
              onClick={() => setSubmissionOpen(true)}
              className="group max-w-[75%] text-left rounded-3xl rounded-bl-lg px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/70 text-pink-900 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-pink-400 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="font-medium text-pink-500 truncate">{thread.contact_name || thread.contact_email}</span>
                <span>·</span>
                <span>{SOURCE_META[thread.source_app]?.label || "Form"} submission</span>
              </div>
              {thread.subject && (
                <div className="text-xs font-semibold text-pink-700 mb-0.5 truncate">{thread.subject}</div>
              )}
              <div className="text-sm leading-snug text-pink-900/70">{submissionPreview(thread.form_data)}</div>
              <div className="text-[11px] text-pink-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

        {(messages || []).map((m) => {
          const outbound = m.direction === "outbound";
          return (
            <div key={m.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
              <button
                onClick={() => setPreview(m)}
                className={`group max-w-[75%] text-left rounded-3xl px-4 py-3 shadow-sm transition-shadow hover:shadow-md ${
                  outbound
                    ? "bg-gradient-to-br from-pink-300/90 to-rose-300/90 text-pink-950 rounded-br-lg border border-white/40"
                    : "bg-white/80 backdrop-blur-sm border border-white/70 text-pink-900 rounded-bl-lg"
                }`}
              >
                <div className={`flex items-center gap-1.5 text-[11px] mb-1 ${outbound ? "text-pink-700/70" : "text-pink-400"}`}>
                  <span className={`font-medium truncate ${outbound ? "text-pink-800/80" : "text-pink-500"}`}>
                    {m.from_name || m.from_email}
                  </span>
                  <span>·</span>
                  <span>{m.sent_at ? new Date(m.sent_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                </div>
                {m.subject && (
                  <div className={`text-xs font-semibold mb-0.5 truncate ${outbound ? "text-pink-900" : "text-pink-700"}`}>{m.subject}</div>
                )}
                <div className="text-sm leading-snug whitespace-pre-wrap">{toPreview(m)}</div>
                <div className={`text-[11px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${outbound ? "text-pink-700" : "text-pink-500"}`}>
                  Tap to view full email
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <EmailPreviewModal message={preview} open={!!preview} onClose={() => setPreview(null)} />
      <SubmissionPreviewModal thread={thread} open={submissionOpen} onClose={() => setSubmissionOpen(false)} />
    </>
  );
}