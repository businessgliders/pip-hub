import React, { useState } from "react";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import BugEmailThread from "./BugEmailThread";
import BugComposer from "./BugComposer";
import BugReportModal from "./BugReportModal";
import BugStatusDropdown from "./BugStatusDropdown";
import EmailPreviewModal from "../EmailPreviewModal";

const URGENCY_TONE = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-200",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-500/25 dark:text-orange-200",
  Soon: "bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200",
  Low: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60",
};

export default function BugDetailPanel({ bug, currentUser, onReplied, onBack }) {
  const [preview, setPreview] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/50 dark:border-white/10 shrink-0">
        {onBack && (
          <button onClick={onBack} className="md:hidden p-1.5 -ml-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-orange-700 dark:text-white/80" />
          </button>
        )}
        <div className="w-9 h-9 shrink-0 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-300">
          <LifeBuoy className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-pink-900 dark:text-white truncate">{bug.title || "Bug report"}</span>
            {bug.bug_number != null && (
              <span className="shrink-0 text-[11px] font-bold text-orange-500 dark:text-orange-300">
                B{Math.round(bug.bug_number)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-pink-500 dark:text-white/55 mt-0.5">
            {bug.urgency && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-bold ${URGENCY_TONE[bug.urgency] || URGENCY_TONE.Low}`}>
                {bug.urgency}
              </span>
            )}
            <BugStatusDropdown bug={bug} onChanged={onReplied} />
            {bug.platform && <><span>·</span><span className="truncate">{bug.platform}</span></>}
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        {(bug.reported_by_name || bug.client_name || bug.booking_info || bug.ticket_number) && (
          <div className="px-4 pt-3">
            <div className="rounded-2xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/15 p-3">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                {bug.reported_by_name && <Field label="Reported by" value={bug.reported_by_name} />}
                {bug.client_name && <Field label="Client" value={bug.client_name} />}
                {bug.booking_info && <Field label="Booking" value={bug.booking_info} />}
                {bug.ticket_number && <Field label="Ticket" value={`#${bug.ticket_number}`} />}
              </div>
            </div>
          </div>
        )}
        <BugEmailThread bug={bug} onPreview={setPreview} onOpenReport={() => setReportOpen(true)} />
      </div>

      {/* Reply composer — sends into the escalation Gmail thread */}
      <div className="p-3 border-t border-white/40 dark:border-white/10 shrink-0">
        <BugComposer bug={bug} currentUser={currentUser} onSent={onReplied} />
      </div>

      <EmailPreviewModal message={preview} open={!!preview} onClose={() => setPreview(null)} />
      <BugReportModal bug={bug} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] uppercase tracking-wide text-pink-400 dark:text-white/40">{label}</span>
      <span className="block truncate text-pink-900/80 dark:text-white/80 font-medium">{value}</span>
    </div>
  );
}