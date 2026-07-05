import React, { useState } from "react";
import { ArrowLeft, PanelRight, CheckCircle2, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BugEmailThread from "./BugEmailThread";
import BugComposer from "./BugComposer";
import BugStatusDropdown from "./BugStatusDropdown";
import BugReportModal from "./BugReportModal";
import EmailPreviewModal from "../EmailPreviewModal";

const URGENCY_TONE = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-200",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-500/25 dark:text-orange-200",
  Soon: "bg-[#6b7280]/15 text-[#4b5563] dark:bg-[#6b7280]/30 dark:text-white/80",
  Low: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60",
};

export default function BugDetailPanel({ bug, currentUser, onReplied, onBack, onToggleDetails, detailsOpen }) {
  const [preview, setPreview] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const isResolved = bug.status === "Resolved" || bug.status === "Closed";

  const toggleResolved = async () => {
    const next = isResolved ? "New" : "Resolved";
    await base44.entities.BugReport.update(bug.id, { status: next });
    onReplied?.();
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 border-b border-white/50 dark:border-white/10 shrink-0">
        {onBack && (
          <button onClick={onBack} className="lg:hidden p-1 -ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 shrink-0">
            <ArrowLeft className="w-5 h-5 text-[#4b5563] dark:text-white/80" />
          </button>
        )}
        <div className="hidden md:flex w-9 h-9 shrink-0 rounded-full bg-[#6b7280]/15 dark:bg-[#6b7280]/30 items-center justify-center text-[#4b5563] dark:text-white/80 font-bold text-[11px]">
          {bug.bug_number != null ? `B${Math.round(bug.bug_number)}` : "—"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm md:text-base text-pink-900 dark:text-white truncate leading-tight">{bug.title || "Bug report"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-pink-500 dark:text-white/55 mt-0.5 min-w-0">
            {bug.bug_number != null && (
              <span className="md:hidden shrink-0 font-bold text-[#4b5563] dark:text-white/70">B{Math.round(bug.bug_number)}</span>
            )}
            {bug.urgency && (
              <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full font-bold ${URGENCY_TONE[bug.urgency] || URGENCY_TONE.Low}`}>
                {bug.urgency}
              </span>
            )}
            {bug.platform && <span className="truncate">{bug.platform}</span>}
          </div>
        </div>

        {/* Status dropdown + detail-panel toggle — matches the other inbox headers */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <BugStatusDropdown bug={bug} onChanged={onReplied} />
          <button
            onClick={toggleResolved}
            title={isResolved ? "Reopen" : "Mark as resolved"}
            className="flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-full text-white bg-[#4b5563] hover:bg-[#374151] transition-colors shadow-sm text-xs font-semibold whitespace-nowrap"
          >
            {isResolved ? <RotateCcw className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span className="hidden xl:inline">{isResolved ? "Reopen" : "Mark as resolved"}</span>
            <span className="hidden lg:inline xl:hidden">{isResolved ? "Reopen" : "Resolve"}</span>
          </button>
          {onToggleDetails && (
            <button
              onClick={onToggleDetails}
              title={detailsOpen ? "Hide details" : "Show details"}
              className="p-2 rounded-full text-[#4b5563] dark:text-white/80 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 transition-colors shadow-sm"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        <BugEmailThread bug={bug} currentUser={currentUser} onPreview={setPreview} onOpenReport={() => setReportOpen(true)} />
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