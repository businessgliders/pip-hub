import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Bold, Italic, List, Link as LinkIcon } from "lucide-react";

function isEmpty(html) {
  return !(html || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
}

// Lightweight reply composer for bug escalation threads. Sends via sendBugReply,
// which threads the message into the existing escalation Gmail conversation.
export default function BugComposer({ bug, currentUser, onSent }) {
  const editorRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [empty, setEmpty] = useState(true);
  const [error, setError] = useState(null);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    setEmpty(isEmpty(editorRef.current?.innerHTML));
  };

  const handleLink = () => {
    const url = window.prompt("Enter URL");
    if (url) exec("createLink", url);
  };

  const handleSend = async () => {
    const html = editorRef.current?.innerHTML || "";
    if (isEmpty(html)) return;
    setSending(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("sendBugReply", { bug_report_id: bug.id, body_html: html });
      if (res?.data?.success) {
        if (editorRef.current) editorRef.current.innerHTML = "";
        setEmpty(true);
        onSent?.();
      } else {
        throw new Error(res?.data?.error || "Failed to send");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl p-3 flex-shrink-0 bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-white/70 dark:border-white/15 shadow-sm">
      <p className="text-xs text-orange-700/70 dark:text-white/60 mb-2">
        To: <span className="font-semibold text-orange-900 dark:text-white">{bug.escalated_to || "escalation"}</span>
      </p>

      <div className="flex items-center gap-1 pb-2 mb-2 border-b border-orange-100/60 dark:border-white/10">
        <button onClick={() => exec("bold")} className="p-1.5 rounded hover:bg-orange-50 dark:hover:bg-white/10" title="Bold"><Bold className="w-3.5 h-3.5 text-orange-900/70 dark:text-white/70" /></button>
        <button onClick={() => exec("italic")} className="p-1.5 rounded hover:bg-orange-50 dark:hover:bg-white/10" title="Italic"><Italic className="w-3.5 h-3.5 text-orange-900/70 dark:text-white/70" /></button>
        <button onClick={() => exec("insertUnorderedList")} className="p-1.5 rounded hover:bg-orange-50 dark:hover:bg-white/10" title="Bullet list"><List className="w-3.5 h-3.5 text-orange-900/70 dark:text-white/70" /></button>
        <button onClick={handleLink} className="p-1.5 rounded hover:bg-orange-50 dark:hover:bg-white/10" title="Insert link"><LinkIcon className="w-3.5 h-3.5 text-orange-900/70 dark:text-white/70" /></button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => setEmpty(isEmpty(editorRef.current?.innerHTML))}
        data-placeholder="Reply to this escalation…"
        className="prose prose-sm max-w-none focus:outline-none px-3 py-2 rounded-lg empty:before:content-[attr(data-placeholder)] empty:before:text-orange-300 dark:empty:before:text-white/40 bg-white dark:bg-neutral-900 border border-orange-200/50 dark:border-white/15 text-orange-950 dark:text-white"
        style={{ minHeight: 70, maxHeight: 220, overflowY: "auto", fontSize: "14px" }}
      />

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <div className="flex items-center justify-end mt-3">
        <button
          onClick={handleSend}
          disabled={sending || empty}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? "Sending…" : "Send Reply"}
        </button>
      </div>
    </div>
  );
}