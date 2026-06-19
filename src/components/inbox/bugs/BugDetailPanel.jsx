import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import BugEmailThread from "./BugEmailThread";
import BugComposer from "./BugComposer";
import BugStatusDropdown from "./BugStatusDropdown";
import BugReportModal from "./BugReportModal";
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
            <ArrowLeft className="w-5 h-5 text-[#7d2235] dark:text-white/80" />
          </button>
        )}
        <div className="w-9 h-9 shrink-0 rounded-full bg-[#7d2235]/10 dark:bg-[#7d2235]/30 flex items-center justify-center text-[#7d2235] dark:text-rose-200 font-bold text-[11px]">
          {bug.bug_number != null ? `B${Math.round(bug.bug_number)}` : "—"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-pink-900 dark:text-white truncate">{bug.title || "Bug report"}</span>
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
        <BugEmailThread bug={bug} onPreview={setPreview} onOpenReport={() => setReportOpen(true)} />
      </div>

      {/* Reply composer — sends into the escalation Gmail thread */}
      <div className="p-3 border-t border-white/40 dark:border-white/10 shrink-0">
        <BugComposer bug={bug} currentUser={currentUser} onSent={onReplied} />
      </div>

      <BugReportModal bug={bug} open={reportOpen} onClose={() => setReportOpen(false)} />
      <EmailPreviewModal message={preview} open={!!preview} onClose={() => setPreview(null)} />
    </div>
  );
}