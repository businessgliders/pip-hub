import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SOURCE_META, VIEW_THEME } from "./inboxConfig";
import { useTheme } from "@/lib/ThemeContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LifeBuoy, Headset, CalendarHeart, Handshake, Moon, Sun, Users, LogOut, ArrowLeft, HelpCircle } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

const LOGO_URL = "https://media.base44.com/images/public/69841af9c747b033a60780f2/8796f5d2d_IMG_0093.png";

const TEAM_TABS = [
  { key: "support", icon: Headset },
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
      title={`${label}${count > 0 ? ` — ${count} open` : ""}`}
      className={`relative flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full text-[15px] font-medium transition-all ${
        active
          ? "bg-white/80 dark:bg-white/15 shadow-sm"
          : "text-pink-900/60 dark:text-white/55 hover:text-pink-700 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {/* Label + count hidden on mobile (icon-only), shown from tablet up */}
      <span className="hidden md:inline">{label}</span>
      {count > 0 && (
        <span
          className="hidden md:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold leading-none"
          style={{ color: accent || "inherit", backgroundColor: accent ? `${accent}24` : "rgba(0,0,0,0.06)" }}
        >
          {count}
        </span>
      )}
      {/* Mobile: tiny count dot so info isn't lost */}
      {count > 0 && (
        <span
          className="md:hidden absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function InboxTopBar({ view, setView, currentUser, openCount = 0, counts = {}, onOpenThread, hideChatWidgets = false, bugMode = false, onTerms, onBugs, bugCount = 0 }) {
  const { dark, toggle } = useTheme();
  const accent = ((bugMode ? VIEW_THEME.bugs : VIEW_THEME[view]) || VIEW_THEME.events).accent;
  const logoTitle = bugMode ? "PiP Bugs" : (LOGO_TITLES[view] || "PiP Inbox");
  // Two-letter initials from the name (e.g. "Sahil Khanna" -> "SK").
  // The shared front-desk mailbox shows "FD" (Front Desk).
  const initials = (() => {
    if ((currentUser?.email || "").toLowerCase() === "info@pilatesinpinkstudio.com") return "FD";
    const name = (currentUser?.full_name || "").trim();
    if (name) {
      const parts = name.split(/\s+/);
      return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
    }
    return (currentUser?.email || "?").slice(0, 2).toUpperCase();
  })();
  return (
    <>
    <header className="safe-top shrink-0 px-2 md:px-4 pt-7 pb-0.5 min-h-[62px] flex items-center gap-1.5 md:gap-4 bg-white/30 dark:bg-black/30 backdrop-blur-xl border-b border-white/40 dark:border-white/10">
      {/* Left cluster: back + logo — fixed width to mirror the right cluster so the tabs stay centered */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0 w-[104px] md:w-[120px] lg:w-56">
        {/* Back to home */}
        <Link
          to="/"
          title="Back to home"
          className="shrink-0 p-1.5 rounded-full text-pink-900/60 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Logo */}
        <Link to="/inbox" reloadDocument className="flex items-center gap-2.5 shrink-0 min-w-0">
          <img src={LOGO_URL} alt="PiP Inbox" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
          <span className="hidden lg:block font-extrabold text-base md:text-lg tracking-tight whitespace-nowrap truncate" style={{ fontStyle: "italic", color: accent }}>
            {logoTitle}
          </span>
        </Link>

        {/* Notifications — placed next to the logo/title (hidden on mobile) */}
        <div id="notification-bell-anchor" className="hidden md:block">
          <NotificationCenter currentUser={currentUser} onOpenThread={onOpenThread} />
        </div>
      </div>

      {/* Tabs: 3 team inboxes — compact on tablet/mobile, centered on desktop */}
      <nav className="flex flex-1 items-center justify-center gap-2 md:gap-3 lg:gap-4">
        {TEAM_TABS.map((t) => (
          <TabButton
            key={t.key}
            active={!bugMode && view === t.key}
            onClick={() => setView(t.key)}
            icon={t.icon}
            label={SOURCE_META[t.key]?.label || t.key}
            count={counts[t.key] || 0}
            accent={(VIEW_THEME[t.key] || VIEW_THEME.events).accent}
          />
        ))}
      </nav>

      {/* Right icons */}
      <div className="flex items-center justify-end gap-0.5 md:gap-1 shrink-0 pr-4 md:pr-0 w-[104px] md:w-[120px] lg:w-56">
        {/* Bugs / Report an issue — all sizes */}
        {onBugs && (
          <button
            onClick={onBugs}
            title="Bugs"
            style={bugMode ? { color: VIEW_THEME.bugs.accent } : undefined}
            className={`relative p-2 rounded-full transition-colors ${
              bugMode
                ? "bg-white/80 dark:bg-white/15 shadow-sm"
                : "text-pink-900/50 dark:text-white/70 hover:bg-white/50 dark:hover:bg-white/10"
            }`}
          >
            <LifeBuoy className="w-5 h-5" />
            {bugCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                {bugCount}
              </span>
            )}
          </button>
        )}
        {onTerms && (
          <button
            onClick={onTerms}
            title="Terms Assistant"
            className="p-2 rounded-full text-pink-900/50 dark:text-white/70 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title={currentUser?.full_name || currentUser?.email || "Account"}
              className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-white text-sm font-semibold shadow-sm ml-1 hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {currentUser && (
              <div className="px-2 py-1.5 mb-1 border-b border-border">
                <p className="text-sm font-medium truncate">{currentUser.full_name || "Account"}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            )}
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={toggle}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {dark ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
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
    </>
  );
}