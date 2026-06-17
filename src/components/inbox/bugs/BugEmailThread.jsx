import React, { useRef, useEffect } from "react";
import { MessageSquareText, Paperclip } from "lucide-react";

// Strip HTML to a short plain-text preview for reply bubbles.
function toPreview(m) {
  const raw = m.body_text || m.body_html || m.snippet || "";
  const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 280 ? text.slice(0, 280) + "…" : text;
}

function isImg(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url || "");
}

// Renders the bug conversation: the original report as a single SMS-style
// inbound bubble (transcript folded in), then inbound/outbound email replies.
export default function BugEmailThread({ bug, onPreview }) {
  const bottomRef = useRef(null);
  const replies = bug.replies || [];
  const images = bug.image_urls || [];
  const transcript = bug.transcript || [];

  useEffect(() => {
    const id = setTimeout(() => bottomRef.current?.scrollIntoView({ block: "end" }), 50);
    return () => clearTimeout(id);
  }, [bug.id, replies.length]);

  // Fold the report (description + chat transcript) into one combined summary.
  const transcriptText = transcript
    .map((t) => `${t.role === "user" ? "You" : "Assistant"}: ${t.content}`)
    .join("\n");

  return (
    <div className="p-4 space-y-3">
      {/* Original report — single combined SMS-style inbound bubble */}
      <div className="flex justify-start">
        <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-white/85 dark:bg-white/10 backdrop-blur-sm border border-white/70 dark:border-white/15 text-orange-950 dark:text-white shadow-sm">
          <div className="flex items-center gap-1.5 text-[11px] text-orange-500 dark:text-white/55 mb-1">
            <MessageSquareText className="w-3.5 h-3.5" />
            <span className="font-medium truncate">{bug.reported_by_name || "Bug report"}</span>
            {bug.urgency && <><span>·</span><span>{bug.urgency}</span></>}
          </div>
          {bug.description && (
            <p className="text-[13px] leading-snug whitespace-pre-line">{bug.description}</p>
          )}
          {transcriptText && (
            <div className="mt-2 pt-2 border-t border-orange-200/50 dark:border-white/10 text-[12px] leading-snug whitespace-pre-line text-orange-900/70 dark:text-white/65">
              {transcriptText}
            </div>
          )}
          {/* Attachment thumbnails */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {images.map((url, i) =>
                isImg(url) ? (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-orange-200/60 dark:border-white/15" />
                  </a>
                ) : (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-200 text-xs font-medium hover:bg-orange-100 transition-colors">
                    <Paperclip className="w-3 h-3" /> File {i + 1}
                  </a>
                )
              )}
            </div>
          )}
        </div>
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