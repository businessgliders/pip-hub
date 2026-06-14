import React from "react";
import Avatar from "./Avatar";
import SourceBadge from "./SourceBadge";
import StatusPill from "./StatusPill";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, UserPlus, PanelRight, CheckCircle2 } from "lucide-react";

export default function ThreadHeader({ thread, staff, onStatusChange, onAssign, onBack, onToggleContact, contactOpen }) {
  const assignee = staff.find((s) => s.email === thread.assignee_email);
  const isResolved = thread.status === "resolved" || thread.status === "closed";

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/50">
      <button onClick={onBack} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/60">
        <ArrowLeft className="w-5 h-5 text-pink-700" />
      </button>
      <Avatar name={thread.contact_name} email={thread.contact_email} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-pink-900 truncate">{thread.contact_name || thread.contact_email}</h2>
          <SourceBadge source={thread.source_app} />
        </div>
        <p className="text-xs text-pink-900/50 truncate">{thread.subject}</p>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/60 text-pink-700 hover:bg-white/80 transition-colors">
              <UserPlus className="w-3.5 h-3.5" />
              {assignee ? assignee.full_name : "Assign"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
            <DropdownMenuItem onClick={() => onAssign("")} className="text-sm text-slate-500">Unassigned</DropdownMenuItem>
            {staff.map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => onAssign(s.email)} className="text-sm">
                {s.full_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <StatusPill status={thread.status} onChange={onStatusChange} />

        <button
          onClick={() => onStatusChange(isResolved ? "open" : "resolved")}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-pink-950/90 text-white hover:bg-pink-950 transition-colors shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isResolved ? "Reopen" : "Resolve"}
        </button>

        <button
          onClick={onToggleContact}
          title={contactOpen ? "Hide details" : "Show details"}
          className={`p-1.5 rounded-full transition-colors ${
            contactOpen ? "bg-white/70 text-pink-700" : "hover:bg-white/60 text-pink-700/70"
          }`}
        >
          <PanelRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}