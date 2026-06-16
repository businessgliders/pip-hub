import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SOURCE_META, VIEW_THEME } from "./inboxConfig";
import { useTheme } from "@/lib/ThemeContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LifeBuoy, CalendarHeart, Handshake, Moon, Sun, Users, LogOut } from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import BugReportChat from "./BugReportChat";
import TermsAssistantChat from "./TermsAssistantChat";

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
      className={`relative flex flex-1 lg:flex-initial items-center justify-center gap-1 md:gap-1.5 px-1.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
        active
          ? "bg-white/80 dark:bg-white/15 shadow-sm"
          : "text-pink-900/60 dark:text-white/55 hover:text-pink-700 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10"
      }`}
    >
      <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
      {label}
      {count > 0 && (
        <span
          className="inline-flex items-center justify-center text-xs md:text-sm font-bold leading-none"
          style={{ color: accent || "inherit" }}
          title={`${count} open`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function InboxTopBar({ view, setView, currentUser, openCount = 0, counts = {}, onOpenThread, hideChatWidgets = false }) {
  const { dark, toggle } = useTheme();
  const accent = (VIEW_THEME[view] || VIEW_THEME.events).accent;
  return (
    <>
    <header className="shrink-0 px-2 md:px-4 py-2 md:py-3 flex items-center gap-1.5 md:gap-4 bg-white/30 dark:bg-black/30 backdrop-blur-xl border-b border-white/40 dark:border-white/10">
      {/* Logo */}
      <Link to="/inbox" reloadDocument className="flex items-center gap-2.5 shrink-0 lg:w-56">
        <img src={LOGO_URL} alt="PiP Inbox" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
        <span className="hidden lg:block font-extrabold text-lg tracking-tight whitespace-nowrap" style={{ fontStyle: "italic", color: accent }}>
          {LOGO_TITLES[view] || "PiP Inbox"}
        </span>
      </Link>

      {/* Tabs: 3 team inboxes — fill width on mobile, centered on desktop */}
      <nav className="flex flex-1 items-center justify-center gap-1 lg:gap-2">
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

      {/* Right icons */}
      <div className="flex items-center justify-end gap-1 lg:w-56">
        <NotificationCenter currentUser={currentUser} onOpenThread={onOpenThread} />
        <button
          onClick={toggle}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-full text-pink-900/50 dark:text-white/70 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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

    {!hideChatWidgets && (
      <>
        <TermsAssistantChat accent={accent} />
        <BugReportChat currentUser={currentUser} accent={accent} />
      </>
    )}
    </>
  );
}