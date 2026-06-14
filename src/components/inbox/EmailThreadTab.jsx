import React from "react";
import { Mail } from "lucide-react";

export default function EmailThreadTab({ messages, loading }) {
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
    <div className="p-4 space-y-4">
      {messages.map((m) => {
        const outbound = m.direction === "outbound";
        return (
          <div key={m.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${outbound ? "bg-slate-900 text-white" : "bg-white border border-slate-200"}`}>
              <div className={`text-[11px] mb-1 ${outbound ? "text-slate-300" : "text-slate-400"}`}>
                {outbound ? (m.from_name || m.from_email) : m.from_email} · {m.sent_at ? new Date(m.sent_at).toLocaleString() : ""}
              </div>
              <div
                className={`text-sm prose prose-sm max-w-none ${outbound ? "prose-invert" : ""}`}
                dangerouslySetInnerHTML={{ __html: m.body_html || m.body_text || "" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}