import React from "react";

const HIDDEN = new Set(["source_app"]);

function pretty(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SubmissionDetails({ formData }) {
  const entries = Object.entries(formData || {}).filter(
    ([k, v]) => !HIDDEN.has(k) && v !== null && v !== undefined && v !== ""
  );

  if (entries.length === 0) {
    return <p className="text-sm text-slate-400 p-4">No submission data.</p>;
  }

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200">
        {entries.map(([k, v]) => (
          <div key={k} className="px-4 py-2.5 flex flex-col sm:flex-row sm:gap-4">
            <span className="text-xs font-medium text-slate-500 sm:w-36 shrink-0">{pretty(k)}</span>
            <span className="text-sm text-slate-800 break-words">
              {Array.isArray(v) ? v.join(", ") : String(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}