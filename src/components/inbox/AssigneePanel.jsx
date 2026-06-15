import React from "react";
import Avatar from "./Avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserPlus } from "lucide-react";

// Assignment control shown in the detail panel (below internal notes).
// Displays the current assignee and lets staff reassign the thread.
export default function AssigneePanel({ thread, staff = [], onAssign, accent }) {
  const assignee = staff.find((s) => s.email === thread.assignee_email);

  return (
    <div className="px-4 py-4 border-t border-white/50 dark:border-white/15">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide mb-2 opacity-60 dark:text-white/60">
        Assigned To
      </h4>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 p-2.5 transition-colors">
            {assignee ? (
              <>
                <Avatar name={assignee.full_name} email={assignee.email} photoUrl={assignee.photo_url} size="sm" />
                <span className="text-sm font-medium truncate dark:text-white/85" style={{ color: accent }}>
                  {assignee.full_name}
                </span>
              </>
            ) : (
              <>
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-white/60 dark:bg-white/10 shrink-0">
                  <UserPlus className="w-4 h-4" style={{ color: accent }} />
                </span>
                <span className="text-sm opacity-70 dark:text-white/60" style={{ color: accent }}>Unassigned</span>
              </>
            )}
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
    </div>
  );
}