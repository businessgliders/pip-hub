import React from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const URGENCIES = ["Critical", "High", "Soon", "Low"];
const STATUSES = ["New", "In Progress", "Resolved", "Closed"];

// Compact icon-based dropdown filter for bugs (by Urgency and Status).
export default function BugFilters({ urgency, status, onUrgency, onStatus }) {
  const active = urgency !== "all" || status !== "all";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Filter bugs"
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
            active
              ? "bg-orange-500 text-white"
              : "text-orange-700/70 dark:text-white/60 hover:bg-orange-100/60 dark:hover:bg-white/10"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">Urgency</DropdownMenuLabel>
        <Option label="All urgencies" selected={urgency === "all"} onClick={() => onUrgency("all")} />
        {URGENCIES.map((u) => (
          <Option key={u} label={u} selected={urgency === u} onClick={() => onUrgency(u)} />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</DropdownMenuLabel>
        <Option label="All statuses" selected={status === "all"} onClick={() => onStatus("all")} />
        {STATUSES.map((s) => (
          <Option key={s} label={s} selected={status === s} onClick={() => onStatus(s)} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Option({ label, selected, onClick }) {
  return (
    <DropdownMenuItem onClick={onClick} className="text-sm flex items-center justify-between">
      <span>{label}</span>
      {selected && <Check className="w-3.5 h-3.5 text-orange-500" />}
    </DropdownMenuItem>
  );
}