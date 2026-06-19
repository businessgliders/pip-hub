import React from "react";
import { Reply, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Compact icon-only filter: All / Replied / Not replied (based on the reply arrow).
const OPTIONS = [
  { key: "all", label: "All" },
  { key: "replied", label: "Replied" },
  { key: "not_replied", label: "Not replied" },
];

export default function ReplyFilter({ value = "all", onChange }) {
  const active = value && value !== "all";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Filter by reply status"
          className={`relative p-1.5 rounded-full transition-colors ${
            active
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-pink-400 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/10"
          }`}
        >
          <Reply className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Reply status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((o) => (
          <DropdownMenuItem key={o.key} onClick={() => onChange(o.key)} className="justify-between">
            {o.label}
            {value === o.key && <Check className="w-3.5 h-3.5 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}