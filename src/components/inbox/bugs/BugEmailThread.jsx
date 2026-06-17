import React, { useRef, useEffect } from "react";
import { Paperclip } from "lucide-react";

// Strip HTML to a short plain-text preview for reply bubbles.
function toPreview(m) {
  const raw = m.body_text || m.body_html || m.snippet || "";
  const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 280 ? text.slice(0, 280) + "…" : text;
}

// Renders the bug conversation:
//  - The original report as the first outbound SMS-style bubble (description only).
//    Tapping it opens the full report modal with attachment thumbnails.
//  - Inbound/outbound email replies in the escalation thread.
export default function BugEmailThread({ bug, onPreview, onOpenReport }) {
  const bottomRef = useRef(null);
  const replies = bug.replies || [];
  const attachCount = (bug.image_urls || []).length;

  useEffect(() => {
    const id = setTimeout(() => bottomRef.current?.scrollIntoView({ block: "end" }), 50);
    return () => clearTimeout(id);
  }, [bug.id, replies.length]);

  return (
    <div className="p-4 space-y-3">
      {/* Original report — single SMS-style bubble (description only) */}
      <div className="flex justify-end">
        <button
          onClick={() => onOpenReport?.()}
          className="group max-w-[75%] text-left rounded-2xl rounded-br-sm px-3 py-2 shadow-sm transition-shadow hover:shadow-md backdrop-blur-sm bg-amber-200/80 dark:bg-amber-400/20 border border-amber-300/60 dark:border-amber-300/25 text-amber-950 dark:text-amber-50"
        >
          <div className="flex items-center gap-1.5 text-[10px] mb-0.5 opacity-70">
            <span className="font-medium truncate">{bug.reported_by_name || "Reporter"}</span>
            <span>·</span>
            <span>{bug.created_date ? new Date(bug.created_date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
          </div>
          <div className="text-[13px] leading-snug whitespace-pre-line">{bug.description || "—"}</div>
          {attachCount > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] font-medium opacity-70">
              <Paperclip className="w-3 h-3" /> {attachCount} attachment{attachCount > 1 ? "s" : ""}
            </div>
          )}
        </button>
      </div>

      {/* Email replies */}
      {replies.map((m, i) => {
        const outbound = m.direction === "outbound";
        return (
          <div key={m.gmail_message_id || i} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
            <button
              onClick={() => onPreview?.(m)}
              className={`group max-w-[75%] text-left rounded-2xl px-3 py-2 shadow-sm transition-shadow hover:shadow-md backdrop-blur-sm ${
                outbound
                  ? "bg-amber-200/80 dark:bg-amber-400/20 border border-amber-300/60 dark:border-amber-300/25 text-amber-950 dark:text-amber-50 rounded-br-sm"
                  : "bg-white/85 dark:bg-white/10 border border-white/70 dark:border-white/15 text-orange-950 dark:text-white rounded-bl-sm"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] mb-0.5 opacity-70">
                <span className="font-medium truncate">{m.from_name || m.from_email}</span>
                <span>·</span>
                <span>{m.sent_at ? new Date(m.sent_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
              <div className="text-[13px] leading-snug line-clamp-3">{toPreview(m)}</div>
            </button>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}