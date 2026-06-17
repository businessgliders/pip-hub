import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-12 shrink-0 font-medium text-slate-400 dark:text-white/40">{label}</span>
      <span className="text-slate-700 dark:text-white/80 break-all">{value}</span>
    </div>
  );
}

export default function EmailPreviewModal({ message, open, onClose }) {
  if (!message) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-zinc-800 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10">
          <DialogTitle className="text-base text-slate-900 dark:text-white">{message.subject || "(no subject)"}</DialogTitle>
          <div className="mt-3 space-y-1.5">
            <Row label="From" value={message.from_name ? `${message.from_name} <${message.from_email}>` : message.from_email} />
            <Row label="To" value={message.to_email} />
            <Row label="Subject" value={message.subject} />
            <Row label="Date" value={message.sent_at ? new Date(message.sent_at).toLocaleString() : ""} />
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white dark:bg-zinc-800">
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-white/85"
            dangerouslySetInnerHTML={{ __html: message.body_html || message.body_text || "" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}