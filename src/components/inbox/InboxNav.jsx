import React from "react";
import { Link } from "react-router-dom";
import { Search, Inbox as InboxIcon, User, Users, ChevronDown, LifeBuoy, CalendarHeart, Sparkles, Eye } from "lucide-react";
import { SOURCE_META } from "./inboxConfig";

const NavItem = ({ icon: Icon, label, count, active, onClick, dot }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
      active ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:bg-slate-50"
    }`}
  >
    {dot ? (
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
    ) : (
      Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />
    )}
    <span className="flex-1 text-left truncate">{label}</span>
    {count > 0 && <span className="text-xs text-slate-400 font-medium">{count}</span>}
  </button>
);

const SectionLabel = ({ children }) => (
  <div className="flex items-center justify-between px-2.5 pt-4 pb-1">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</span>
    <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
  </div>
);

export default function InboxNav({ view, setView, counts, currentUser }) {
  const teamInboxes = [
    { key: "support", icon: LifeBuoy },
    { key: "events", icon: CalendarHeart },
    { key: "influencer", icon: Sparkles },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full">
      <div className="px-3 pt-4 pb-2 flex items-center gap-2">
        <Link to="/" className="text-base font-bold text-slate-900 hover:text-slate-600">Inbox</Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {/* Inbox section */}
        <div className="space-y-0.5">
          <NavItem icon={Search} label="Search" active={view === "search"} onClick={() => setView("search")} />
          <NavItem icon={InboxIcon} label="All" count={counts.all} active={view === "all"} onClick={() => setView("all")} />
          <NavItem icon={User} label="My Inbox" count={counts.mine} active={view === "mine"} onClick={() => setView("mine")} />
          <NavItem icon={Users} label="Unassigned" count={counts.unassigned} active={view === "unassigned"} onClick={() => setView("unassigned")} />
        </div>

        {/* Team inboxes */}
        <SectionLabel>Team Inboxes</SectionLabel>
        <div className="space-y-0.5">
          {teamInboxes.map((t) => (
            <NavItem
              key={t.key}
              dot={SOURCE_META[t.key]?.dot}
              label={SOURCE_META[t.key]?.label || t.key}
              count={counts[t.key]}
              active={view === t.key}
              onClick={() => setView(t.key)}
            />
          ))}
        </div>

        {/* Views */}
        <SectionLabel>Views</SectionLabel>
        <div className="space-y-0.5">
          <NavItem icon={Eye} label="Open" active={view === "open"} onClick={() => setView("open")} />
          <NavItem icon={Eye} label="Resolved" active={view === "resolved"} onClick={() => setView("resolved")} />
        </div>
      </div>

      {currentUser && (
        <div className="border-t border-slate-100 px-3 py-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
            {(currentUser.full_name || currentUser.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{currentUser.full_name || currentUser.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}