import React from "react";

// Compact card body for a spoke record. Shows the most relevant fields per board.
export default function SpokeCardContent({ record, boardKey }) {
  return (
    <>
      <div className="text-sm font-semibold text-slate-800">
        {record.name || "Unknown"}
      </div>

      {boardKey === "support" && record.subject && (
        <div className="text-xs text-slate-600 line-clamp-2 mt-1">{record.subject}</div>
      )}
      {boardKey === "events" && (
        <div className="text-xs text-slate-600 mt-1">
          {[record.event_type, record.event_date].filter(Boolean).join(" · ")}
          {record.guest_count ? ` · ${record.guest_count} guests` : ""}
        </div>
      )}
      {boardKey === "partner" && (
        <div className="text-xs text-slate-600 mt-1">
          {[record.company, record.partnership_type].filter(Boolean).join(" · ")}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        {record.email && (
          <span className="text-[11px] text-slate-400 truncate">{record.email}</span>
        )}
        {record.source_app && (
          <span className="text-[10px] font-mono text-slate-400">{record.source_app}</span>
        )}
      </div>
    </>
  );
}