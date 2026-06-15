import React from "react";
import Avatar from "./Avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserPlus } from "lucide-react";

// Assignment control shown in the detail panel (below internal notes).
// "Assign to" icon opens a dropdown; the current assignee avatar shows beside it.
export default function AssigneePanel({ thread, staff = [], onAssign, accent }) {
  const assignee = staff.find((s) => s.email === thread.assignee_email);

  return (
    <div className="px-4 py-4 border-t border-white/50 dark:border-white/15">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide mb-2 opacity-60 dark:text-white/60">
        Assign to
      </h4>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title="Assign to"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" style={{ color: accent }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
            {staff.map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => onAssign(s.email)} className="text-sm gap-2">
                <Avatar name={s.full_name} email={s.email} photoUrl={s.photo_url} size="sm" />
                {s.full_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {assignee && (
          <span title={`Assigned to ${assignee.full_name}`} className="flex items-center gap-2 min-w-0">
            <Avatar name={assignee.full_name} email={assignee.email} photoUrl={assignee.photo_url} size="sm" />
            <span className="text-sm font-medium truncate dark:text-white/85" style={{ color: accent }}>
              {assignee.full_name}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}