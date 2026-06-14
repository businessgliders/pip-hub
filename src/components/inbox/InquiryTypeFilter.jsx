import React from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icon-only filter that lets staff filter Support threads by Inquiry Type.
export default function InquiryTypeFilter({ types = [], value, onChange }) {
  const active = value && value !== "all";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Filter by inquiry type"
          className={`relative p-1.5 rounded-full transition-colors ${
            active
              ? "bg-pink-500 text-white shadow-sm"
              : "text-pink-400 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/10"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        <DropdownMenuLabel>Inquiry Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onChange("all")} className="justify-between">
          All types
          {(!value || value === "all") && <Check className="w-3.5 h-3.5" />}
        </DropdownMenuItem>
        {types.map((t) => (
          <DropdownMenuItem key={t} onClick={() => onChange(t)} className="justify-between">
            <span className="capitalize truncate">{t}</span>
            {value === t && <Check className="w-3.5 h-3.5 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}