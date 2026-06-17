import React, { useState } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUSES = ["New", "In Progress", "Resolved", "Closed"];

const STATUS_TONE = {
  New: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200",
  "In Progress": "bg-sky-100 text-sky-700 dark:bg-sky-500/25 dark:text-sky-200",
  Resolved: "bg-violet-100 text-violet-700 dark:bg-violet-500/25 dark:text-violet-200",
  Closed: "bg-slate-100 text-slate-500 dark:bg-white/15 dark:text-white/70",
};

// Inline status pill + dropdown for changing a bug report's status.
export default function BugStatusDropdown({ bug, onChanged }) {
  const [saving, setSaving] = useState(false);
  const current = bug.status || "New";

  const change = async (status) => {
    if (status === current) return;
    setSaving(true);
    try {
      await base44.entities.BugReport.update(bug.id, { status });
      onChanged?.(status);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-bold text-[11px] transition-opacity hover:opacity-80 ${STATUS_TONE[current] || STATUS_TONE.New}`}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {current}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {STATUSES.map((s) => (
          <DropdownMenuItem key={s} onClick={() => change(s)} className="text-sm flex items-center justify-between">
            <span>{s}</span>
            {s === current && <Check className="w-3.5 h-3.5 text-orange-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}