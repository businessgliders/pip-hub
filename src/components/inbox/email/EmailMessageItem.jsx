import React, { useState } from "react";
import { Sparkles, UserPlus } from "lucide-react";
import MessageReadToggle from "../MessageReadToggle";
import EmailInlineBody from "./EmailInlineBody";
import ExpandToggleButton from "./ExpandToggleButton";
import { replyPreviewText } from "@/lib/emailReply";

const FAILED = "bg-red-100/90 dark:bg-red-500/20 border border-red-300 dark:border-red-400/40 text-red-900 dark:text-red-100";

function Pill({ children, cls }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold ${cls} dark:text-white/80 bg-white/40 dark:bg-white/10`}>
      {children}
    </span>
  );
}

// One message bubble: tap anywhere to expand in place; header or chevron pill to collapse.
export default function EmailMessageItem({ message: m, thread, currentUser, palette: ob, isHighlighted, highlightRef, formatDate }) {
  const [expanded, setExpanded] = useState(false);
  const outbound = m.direction === "outbound";
  const failed = outbound && m.send_status === "failed";
  const isAutomated = m.is_welcome || m.is_template;
  const dateLabel = m.sent_at ? formatDate(m.sent_at) : "";
  const toggle = () => setExpanded((v) => !v);
  const collapse = () => setExpanded(false);

  // Escalation / assignment notice — centered internal pill.
  if (m.is_escalation) {
    const escReason = (m.snippet || "").trim();
    const escLabel = (m.subject || "Escalation").replace(/^((?:Escalated|Assigned) to\s+\S+)\s+.*$/i, "$1");
    return (
      <div className="flex justify-center">
        <div
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggle(); }}
          className={`cursor-pointer flex flex-col gap-1 px-3 py-1.5 rounded-2xl text-[12px] font-medium bg-indigo-100/80 dark:bg-indigo-500/20 border border-indigo-300/60 dark:border-indigo-400/30 text-indigo-800 dark:text-indigo-200 transition-all ${expanded ? "w-full max-w-[92%]" : "max-w-[85%]"}`}
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{escLabel}</span>
            <span className="opacity-60 whitespace-nowrap">· {dateLabel}</span>
            <ExpandToggleButton expanded={expanded} onCollapse={collapse} className="ml-auto" />
          </div>
          {!expanded && escReason && <div className="text-[11px] italic opacity-80 pl-6 break-words">{escReason}</div>}
          {expanded && <EmailInlineBody message={m} onCollapse={collapse} dateLabel={dateLabel} />}
        </div>
      </div>
    );
  }

  const bubbleShade = failed ? FAILED : isAutomated ? ob.darkBubble : ob.bubble;
  const preview = replyPreviewText(m);
  const metaCls = outbound ? `${ob.meta} dark:text-white/55` : "text-pink-400 dark:text-white/55";
  const nameCls = outbound ? `${ob.name} dark:text-white/80` : "text-pink-500 dark:text-white/80";

  return (
    <div className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
      <div
        ref={isHighlighted ? highlightRef : undefined}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={(e) => { if (!expanded && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(); } }}
        className={`cursor-pointer text-left rounded-2xl px-3 py-2 shadow-sm transition-all duration-200 backdrop-blur-sm ${
          expanded ? "w-full max-w-[92%]" : "max-w-[70%] hover:shadow-md"
        } ${isHighlighted ? "animate-outline-flash" : ""} ${
          outbound
            ? `${bubbleShade} ${failed ? "" : ob.text} rounded-br-sm`
            : "bg-white/85 dark:bg-white/10 border border-white/70 dark:border-white/15 text-pink-900 dark:text-white rounded-bl-sm"
        }`}
      >
        <div className={`flex items-center gap-1.5 text-[10px] mb-0.5 ${metaCls}`}>
          <span className={`font-medium truncate ${nameCls}`}>
            {!outbound && !expanded ? `From: ${m.from_email || m.from_name}` : (m.from_name || m.from_email)}
          </span>
          {m.is_welcome && <Pill cls={ob.name}><Sparkles className="w-2.5 h-2.5" /> Auto-reply</Pill>}
          {!m.is_welcome && m.is_template && <Pill cls={ob.name}><Sparkles className="w-2.5 h-2.5" /> Template</Pill>}
          {m.__dupeCount > 1 && <Pill cls={ob.name}>sent {m.__dupeCount}×</Pill>}
          {failed && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-semibold bg-red-600 text-white">Failed</span>}
        </div>

        {expanded ? (
          <EmailInlineBody message={m} onCollapse={collapse} dateLabel={dateLabel} />
        ) : (
          <div className={`leading-snug line-clamp-1 ${outbound ? `text-[12px] ${failed ? "" : ob.body} dark:text-white/75 opacity-80` : "text-[13px] text-pink-800/80 dark:text-white/80"}`}>
            {m.is_welcome ? "Welcome / auto-reply email sent." : (preview || m.subject || "(no content)")}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-1 min-h-[18px]">
          {!outbound && (
            <div onClick={(e) => e.stopPropagation()}>
              <MessageReadToggle message={m} thread={thread} currentUser={currentUser} />
            </div>
          )}
          <span className={`text-[10px] whitespace-nowrap ${metaCls}`}>{dateLabel}</span>
          <ExpandToggleButton expanded={expanded} onCollapse={collapse} colored={outbound && !failed} className={metaCls} />
        </div>
      </div>
    </div>
  );
}