import React, { useState } from "react";
import { Mail } from "lucide-react";
import EmailPreviewModal from "./EmailPreviewModal";

// Strip HTML to a short plain-text preview for the bubble
function toPreview(m) {
  const raw = m.body_text || m.body_html || "";
  const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 280 ? text.slice(0, 280) + "…" : text;
}

export default function EmailThreadTab({ messages, loading }) {
  const [preview, setPreview] = useState(null);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Mail className="w-10 h-10 mb-2" />
        <p className="text-sm">No emails yet. Send the first reply below.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-3">
        {messages.map((m) => {
          const outbound = m.direction === "outbound";
          return (
            <div key={m.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
              <button
                onClick={() => setPreview(m)}
                className={`group max-w-[75%] text-left rounded-2xl px-4 py-2.5 transition-shadow hover:shadow-md ${
                  outbound
                    ? "bg-rose-100 text-slate-900 rounded-br-md"
                    : "bg-white border border-slate-200 text-slate-900 rounded-bl-md"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <span className="font-medium text-slate-500 truncate">
                    {outbound ? (m.from_name || m.from_email) : (m.from_name || m.from_email)}
                  </span>
                  <span>·</span>
                  <span>{m.sent_at ? new Date(m.sent_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                </div>
                {m.subject && (
                  <div className="text-xs font-semibold text-slate-700 mb-0.5 truncate">{m.subject}</div>
                )}
                <div className="text-sm leading-snug whitespace-pre-wrap">{toPreview(m)}</div>
                <div className="text-[11px] text-rose-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to view full email
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <EmailPreviewModal message={preview} open={!!preview} onClose={() => setPreview(null)} />
    </>
  );
}