import React from "react";
import { STATUS_META, STATUS_ORDER } from "./inboxConfig";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function StatusPill({ status, onChange, readOnly = false }) {
  const meta = STATUS_META[status] || STATUS_META.open;

  if (readOnly) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${meta.chip}`}>
        {meta.label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.chip} hover:opacity-80 transition-opacity`}>
          {meta.label}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STATUS_ORDER.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange?.(s)} className="text-sm">
            <span className={`w-2 h-2 rounded-full mr-2 ${STATUS_META[s].chip.split(" ")[0]}`} />
            {STATUS_META[s].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}