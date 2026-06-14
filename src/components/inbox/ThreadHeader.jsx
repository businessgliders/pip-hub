import React from "react";
import Avatar from "./Avatar";
import SourceBadge from "./SourceBadge";
import StatusPill from "./StatusPill";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, UserPlus, PanelRight } from "lucide-react";

export default function ThreadHeader({ thread, staff, onStatusChange, onAssign, onBack, onToggleContact, contactOpen }) {
  const assignee = staff.find((s) => s.email === thread.assignee_email);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
      <button onClick={onBack} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-100">
        <ArrowLeft className="w-5 h-5 text-slate-600" />
      </button>
      <Avatar name={thread.contact_name} email={thread.contact_email} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-900 truncate">{thread.contact_name || thread.contact_email}</h2>
          <SourceBadge source={thread.source_app} />
        </div>
        <p className="text-xs text-slate-500 truncate">{thread.subject}</p>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
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
          onClick={onToggleContact}
          title={contactOpen ? "Hide details" : "Show details"}
          className={`p-1.5 rounded-lg transition-colors ${
            contactOpen ? "bg-slate-200 text-slate-700" : "hover:bg-slate-100 text-slate-600"
          }`}
        >
          <PanelRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}