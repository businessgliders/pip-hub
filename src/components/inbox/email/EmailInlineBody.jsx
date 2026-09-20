import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { splitEmailHtml } from "@/lib/emailReply";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[11px] leading-snug">
      <span className="w-10 shrink-0 font-medium opacity-60">{label}</span>
      <span className="break-all opacity-90">{value}</span>
    </div>
  );
}

// Full message rendered inline inside an expanded bubble.
export default function EmailInlineBody({ message, onCollapse, dateLabel }) {
  const [showQuoted, setShowQuoted] = useState(false);
  const { replyHtml, quotedHtml, quotedCount } = useMemo(
    () => splitEmailHtml(message.body_html, message.body_text),
    [message.body_html, message.body_text]
  );

  return (
    <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in duration-200">
      <div
        onClick={onCollapse}
        title="Collapse"
        className="cursor-pointer rounded-lg -mx-1 px-1 py-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="text-[13px] font-semibold leading-snug break-words">{message.subject || "(no subject)"}</div>
        <div className="mt-1 space-y-0.5">
          <Row label="From" value={message.from_name ? `${message.from_name} <${message.from_email}>` : message.from_email} />
          <Row label="To" value={message.to_email} />
          <Row label="Date" value={dateLabel} />
        </div>
      </div>

      {message.send_status === "failed" && message.send_error && (
        <div className="mt-2 rounded-lg border border-red-300 bg-red-50 text-red-800 dark:bg-red-500/15 dark:border-red-400/40 dark:text-red-200 px-2.5 py-1.5 text-[11px] break-words">
          <span className="font-semibold">Failed to send:</span> {message.send_error}
        </div>
      )}

      <div className="mt-2 overflow-x-auto" style={{ isolation: "isolate" }}>
        <div
          className="prose prose-sm max-w-none text-[13px] leading-relaxed text-current [&_*]:text-current [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: replyHtml || "<em>(no content)</em>" }}
        />
      </div>

      {quotedCount > 0 && quotedHtml && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowQuoted((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] opacity-70 hover:opacity-100 transition-opacity"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showQuoted ? "rotate-180" : ""}`} />
            {showQuoted ? "Hide quoted history" : `…${quotedCount} earlier message${quotedCount === 1 ? "" : "s"} quoted`}
          </button>
          {showQuoted && (
            <div className="mt-1.5 pl-2 border-l-2 border-current/20 overflow-x-auto animate-in fade-in duration-200" style={{ isolation: "isolate" }}>
              <div
                className="prose prose-sm max-w-none text-[12px] leading-relaxed opacity-75 text-current [&_*]:text-current"
                dangerouslySetInnerHTML={{ __html: quotedHtml }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}