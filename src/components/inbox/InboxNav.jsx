import React from "react";
import { Link } from "react-router-dom";
import { Inbox as InboxIcon, User, Users, ChevronDown, LifeBuoy, CalendarHeart, Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SOURCE_META } from "./inboxConfig";
import UniversalSearch from "./UniversalSearch";

const NavItem = ({ icon: Icon, label, count, active, onClick, dot, collapsed }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors ${
      collapsed ? "justify-center px-0 py-2" : "px-2.5 py-1.5"
    } ${active ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
  >
    {dot ? (
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
    ) : (
      Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />
    )}
    {!collapsed && (
      <>
        <span className="flex-1 text-left truncate">{label}</span>
        {count > 0 && <span className="text-xs text-slate-400 font-medium">{count}</span>}
      </>
    )}
    {collapsed && count > 0 && (
      <span className="absolute translate-x-3 -translate-y-3 min-w-[15px] h-[15px] px-1 rounded-full bg-slate-300 text-slate-700 text-[9px] font-semibold flex items-center justify-center">
        {count}
      </span>
    )}
  </button>
);

const SectionLabel = ({ children }) => (
  <div className="flex items-center justify-between px-2.5 pt-4 pb-1">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</span>
    <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
  </div>
);

export default function InboxNav({ view, setView, counts, currentUser, threads = [], onSearchSelect, collapsed = false, onToggleCollapse }) {
  const teamInboxes = [
    { key: "support", icon: LifeBuoy },
    { key: "events", icon: CalendarHeart },
    { key: "influencer", icon: Sparkles },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full">
      <div className={`pt-4 pb-2 flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-3"}`}>
        {!collapsed && <Link to="/" className="text-base font-bold text-slate-900 hover:text-slate-600">Inbox</Link>}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand" : "Collapse"}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-2.5 pb-2">
          <UniversalSearch threads={threads} onSelect={onSearchSelect} />
        </div>
      )}

      <div className={`flex-1 overflow-y-auto pb-4 ${collapsed ? "px-2" : "px-2"}`}>
        {/* Inbox section */}
        <div className="space-y-0.5 relative">
          <NavItem icon={InboxIcon} label="All" count={counts.all} active={view === "all"} onClick={() => setView("all")} collapsed={collapsed} />
          <NavItem icon={User} label="My Inbox" count={counts.mine} active={view === "mine"} onClick={() => setView("mine")} collapsed={collapsed} />
          <NavItem icon={Users} label="Unassigned" count={counts.unassigned} active={view === "unassigned"} onClick={() => setView("unassigned")} collapsed={collapsed} />
        </div>

        {/* Team inboxes */}
        {collapsed ? <div className="my-3 mx-2 border-t border-slate-100" /> : <SectionLabel>Team Inboxes</SectionLabel>}
        <div className="space-y-0.5 relative">
          {teamInboxes.map((t) => (
            <NavItem
              key={t.key}
              icon={t.icon}
              dot={collapsed ? undefined : SOURCE_META[t.key]?.dot}
              label={SOURCE_META[t.key]?.label || t.key}
              count={counts[t.key]}
              active={view === t.key}
              onClick={() => setView(t.key)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      {currentUser && (
        <div className={`border-t border-slate-100 py-3 flex items-center gap-2.5 ${collapsed ? "justify-center px-2" : "px-3"}`}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {(currentUser.full_name || currentUser.email || "?").slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">{currentUser.full_name || currentUser.email}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}