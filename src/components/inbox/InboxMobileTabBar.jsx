import React from "react";
import { Link } from "react-router-dom";
import { Home, LifeBuoy, CalendarHeart, Handshake } from "lucide-react";
import { SOURCE_META, VIEW_THEME } from "./inboxConfig";

const TEAM_TABS = [
  { key: "support", icon: LifeBuoy },
  { key: "events", icon: CalendarHeart },
  { key: "influencer", icon: Handshake },
];

/**
 * iOS-style bottom tab bar for the inbox on mobile/tablet.
 * Mirrors the AppHub bottom bar: Home (back to /) + the 3 team inboxes.
 * Hidden by the parent when a conversation or detail panel is open.
 */
export default function InboxMobileTabBar({ view, setView }) {
  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-zinc-900/85 backdrop-blur-xl border-t border-gray-200/60 dark:border-white/10"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0px)" }}
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-2">
        {/* Home → back to hub */}
        <Link
          to="/"
          className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-gray-500 dark:text-white/55"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Team inboxes */}
        {TEAM_TABS.map((t) => {
          const active = view === t.key;
          const accent = (VIEW_THEME[t.key] || VIEW_THEME.events).accent;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              style={active ? { color: accent } : undefined}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl ${
                active ? "" : "text-gray-500 dark:text-white/55"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{SOURCE_META[t.key]?.label || t.key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}