import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SubmissionDetails from "./SubmissionDetails";
import { ticketLabel } from "./inboxConfig";
import { Clock, Tag } from "lucide-react";

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SubmissionPreviewModal({ thread, open, onClose }) {
  if (!thread) return null;

  // Prefer the original submission date when available, else the thread's creation date.
  const createdIso =
    thread.form_data?.submitted_date ||
    thread.form_data?.created_date ||
    thread.created_date;
  const createdLabel = formatDateTime(createdIso);
  const ticket = ticketLabel(thread);
  const inquiryType = thread.source_app === "support" ? thread.form_data?.inquiry_type : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-white p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-base text-slate-900">{thread.subject || "Form Submission"}</DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            {thread.contact_name || thread.contact_email}
          </p>
          {/* Ticket-related info: ticket number, type, created date/time */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {ticket && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-slate-900/5 text-slate-700">
                {ticket}
              </span>
            )}
            {inquiryType && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-700">
                <Tag className="w-3 h-3" /> {inquiryType}
              </span>
            )}
            {createdLabel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                <Clock className="w-3 h-3" /> {createdLabel}
              </span>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <SubmissionDetails formData={thread.form_data} sourceApp={thread.source_app} />
        </div>
      </DialogContent>
    </Dialog>
  );
}