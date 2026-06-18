import React from "react";
import { ArrowUpDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Traditional sort menu for the Events inbox. Opens a context menu offering
// "Event date" (soonest first) and "Submission date" (newest first).
export default function EventSortMenu({ sortByEventDate, onChange }) {
  const OPTIONS = [
    { key: "event", label: "Event date", hint: "Soonest first", active: sortByEventDate },
    { key: "submission", label: "Submission date", hint: "Newest first", active: !sortByEventDate },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Sort"
          className="p-1.5 rounded-full text-pink-500 dark:text-white/70 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.key}
            onClick={() => onChange(o.key === "event")}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="flex flex-col">
              <span className="text-sm">{o.label}</span>
              <span className="text-[11px] text-muted-foreground">{o.hint}</span>
            </span>
            {o.active && <Check className="w-4 h-4 text-pink-500 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}