import React from "react";
import { Link } from "react-router-dom";
import { SOURCE_META } from "./inboxConfig";
import { LifeBuoy, CalendarHeart, Sparkles, Inbox as InboxIcon, HelpCircle, Settings } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69841af9c747b033a60780f2/6deb854f5_logo.png";

const TEAM_TABS = [
  { key: "support", icon: LifeBuoy },
  { key: "events", icon: CalendarHeart },
  { key: "influencer", icon: Sparkles },
];

const PERSONAL = [{ key: "all", label: "All", icon: InboxIcon }];

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? "text-pink-600 bg-white/70 shadow-sm"
          : "text-pink-900/60 hover:text-pink-700 hover:bg-white/40"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export default function InboxTopBar({ view, setView, currentUser }) {
  return (
    <header className="shrink-0 px-4 py-3 flex items-center gap-4 bg-white/40 backdrop-blur-xl border-b border-white/50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 shrink-0">
        <img src={LOGO_URL} alt="Pilates in Pink" className="w-8 h-8 object-contain" />
        <span className="hidden sm:block font-extrabold text-lg tracking-tight text-pink-600" style={{ fontStyle: "italic" }}>
          Pilates in Pink
        </span>
      </Link>

      {/* Tabs: All + 3 team inboxes */}
      <nav className="flex items-center gap-1 ml-2">
        {PERSONAL.map((p) => (
          <TabButton key={p.key} active={view === p.key} onClick={() => setView(p.key)} icon={p.icon} label={p.label} />
        ))}
        {TEAM_TABS.map((t) => (
          <TabButton
            key={t.key}
            active={view === t.key}
            onClick={() => setView(t.key)}
            icon={t.icon}
            label={SOURCE_META[t.key]?.label || t.key}
          />
        ))}
      </nav>

      <div className="flex-1" />

      {/* Right icons */}
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-full text-pink-900/50 hover:bg-white/50 hover:text-pink-600 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full text-pink-900/50 hover:bg-white/50 hover:text-pink-600 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm ml-1">
          {(currentUser?.full_name || currentUser?.email || "?").slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}