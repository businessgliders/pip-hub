import React from "react";
import { ALL_STATUS_META, STATUS_META, statusOrderFor } from "./inboxConfig";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function StatusPill({ status, onChange, readOnly = false, source }) {
  const meta = ALL_STATUS_META[status] || STATUS_META.open;
  const order = statusOrderFor(source);
  // The first status that isn't the current one — auto-highlighted when the menu opens.
  const firstAvailable = order.find((s) => s !== status);

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
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        {order.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => onChange?.(s)}
            className="text-sm"
            autoFocus={s === firstAvailable}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${ALL_STATUS_META[s].chip.split(" ")[0]}`} />
            {ALL_STATUS_META[s].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}