import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SOURCE_META, VIEW_THEME } from "./inboxConfig";
import { useTheme } from "@/lib/ThemeContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LifeBuoy, CalendarHeart, Handshake, HelpCircle, Settings, Moon, Sun, Users, LogOut } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69841af9c747b033a60780f2/6deb854f5_logo.png";

const TEAM_TABS = [
  { key: "support", icon: LifeBuoy },
  { key: "events", icon: CalendarHeart },
  { key: "influencer", icon: Handshake },
];

const LOGO_TITLES = {
  support: "PiP Support",
  events: "PiP Events",
  influencer: "PiP Partner",
};

function TabButton({ active, onClick, icon: Icon, label, count, accent }) {
  return (
    <button
      onClick={onClick}
      style={active ? { color: accent } : undefined}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? "bg-white/80 dark:bg-white/15 shadow-sm"
          : "text-pink-900/60 dark:text-white/55 hover:text-pink-700 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count > 0 && (
        <span
          className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold leading-none rounded-full bg-current/10"
          style={{ color: accent || "inherit" }}
          title={`${count} open`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function InboxTopBar({ view, setView, currentUser, openCount = 0, counts = {} }) {
  const { dark, toggle } = useTheme();
  const accent = (VIEW_THEME[view] || VIEW_THEME.events).accent;
  return (
    <header className="shrink-0 px-4 py-3 flex items-center gap-4 bg-white/30 dark:bg-black/30 backdrop-blur-xl border-b border-white/40 dark:border-white/10">
      {/* Logo */}
      <Link to="/inbox" reloadDocument className="flex items-center gap-2.5 shrink-0 w-32">
        <img src={LOGO_URL} alt="PiP Inbox" className="w-8 h-8 object-contain" />
        <span className="hidden lg:block font-extrabold text-lg tracking-tight truncate" style={{ fontStyle: "italic", color: accent }}>
          {LOGO_TITLES[view] || "PiP Inbox"}
        </span>
      </Link>

      {/* Tabs: 3 team inboxes */}
      <nav className="flex items-center gap-1 ml-2">
        {TEAM_TABS.map((t) => (
          <TabButton
            key={t.key}
            active={view === t.key}
            onClick={() => setView(t.key)}
            icon={t.icon}
            label={SOURCE_META[t.key]?.label || t.key}
            count={counts[t.key] || 0}
            accent={(VIEW_THEME[t.key] || VIEW_THEME.events).accent}
          />
        ))}
      </nav>

      <div className="flex-1" />

      {/* Right icons */}
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-full text-pink-900/50 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          onClick={toggle}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-full text-pink-900/50 dark:text-white/70 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className="p-2 rounded-full text-pink-900/50 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title={currentUser?.full_name || currentUser?.email || "Account"}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm ml-1 hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
            >
              {(currentUser?.full_name || currentUser?.email || "?").slice(0, 1).toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {currentUser && (
              <div className="px-2 py-1.5 mb-1 border-b border-border">
                <p className="text-sm font-medium truncate">{currentUser.full_name || "Account"}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            )}
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => base44.auth.logout(window.location.href)}>
              <Users className="w-4 h-4" /> Switch User
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600" onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}