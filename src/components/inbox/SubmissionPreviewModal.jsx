import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SubmissionDetails from "./SubmissionDetails";

export default function SubmissionPreviewModal({ thread, open, onClose }) {
  if (!thread) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-white p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-base text-slate-900">{thread.subject || "Form Submission"}</DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            {thread.contact_name || thread.contact_email}
          </p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <SubmissionDetails formData={thread.form_data} />
        </div>
      </DialogContent>
    </Dialog>
  );
}