import React from "react";
import { Archive, PartyPopper, BookText, Bug } from "lucide-react";

// Vertical "side panel" rail of status tabs shown on the left of the thread list.
// The count itself acts as the icon/glyph for each status tab.
export default function InboxStatusRail({ tabs, active, onChange, counts = {}, accent = "#f1889b", archivedActive = false, onArchived, onTerms, onBugs, bugsActive = false }) {
  if (!tabs || tabs.length === 0) return null;
  // "Hosted" is pinned to the bottom (above Archived) as an icon-only tab, no count.
  const hostedTab = tabs.find((t) => t.key === "Hosted");
  const mainTabs = tabs.filter((t) => t.key !== "Hosted");
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-1.5 border-r border-white/40 dark:border-white/10 shrink-0 overflow-y-auto">
      {mainTabs.map((t) => {
        const isActive = !archivedActive && active === t.key;
        const c = counts[t.key] || 0;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            title={t.label}
            style={isActive ? { background: accent, color: "#fff" } : undefined}
            className={`relative w-14 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all ${
              isActive
                ? "shadow-md"
                : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
            }`}
          >
            <span className="text-lg font-bold leading-none">{c}</span>
            <span className="text-center">{t.label}</span>
          </button>
        );
      })}

      {/* Hosted — icon only, pinned above the bottom tools (Events inbox) */}
      {hostedTab && (
        <button
          onClick={() => onChange(hostedTab.key)}
          title="Hosted"
          style={!archivedActive && active === hostedTab.key ? { background: accent, color: "#fff" } : undefined}
          className={`mt-auto w-14 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all ${
            !archivedActive && active === hostedTab.key
              ? "shadow-md"
              : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
          }`}
        >
          <PartyPopper className="w-5 h-5" />
          <span>Hosted</span>
        </button>
      )}

      {/* Bottom tools: Terms, Bugs, Archived — pinned together at the bottom */}
      <div className={`${hostedTab ? "" : "mt-auto"} w-full flex flex-col items-center gap-1 pt-1 border-t border-white/40 dark:border-white/10`}>
        {/* Terms — opens the live-chat Terms assistant */}
        {onTerms && (
          <button
            onClick={onTerms}
            title="Terms Assistant"
            className="w-14 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
          >
            <BookText className="w-5 h-5" />
            <span>Terms</span>
          </button>
        )}

        {/* Bugs — opens the reported-bugs conversation panel */}
        {onBugs && (
          <button
            onClick={onBugs}
            title="Bugs"
            style={bugsActive ? { background: accent, color: "#fff" } : undefined}
            className={`w-14 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all ${
              bugsActive ? "shadow-md" : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
            }`}
          >
            <Bug className="w-5 h-5" />
            <span>Bugs</span>
          </button>
        )}

        {/* Archived — icon only, pinned to the bottom */}
        {onArchived && (
          <button
            onClick={onArchived}
            title="Archived"
            style={archivedActive ? { background: accent, color: "#fff" } : undefined}
            className={`w-14 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all ${
              archivedActive
                ? "shadow-md"
                : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
            }`}
          >
            <Archive className="w-5 h-5" />
            <span>Archived</span>
          </button>
        )}
      </div>
    </div>
  );
}