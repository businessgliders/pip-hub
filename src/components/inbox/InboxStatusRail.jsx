import React from "react";
import { Archive, PartyPopper, FileText, Bug, UserRound, Layers } from "lucide-react";

// Vertical "side panel" rail of status tabs shown on the left of the thread list.
// The count itself acts as the icon/glyph for each status tab.
export default function InboxStatusRail({ tabs, active, onChange, counts = {}, unread = {}, accent = "#f1889b", archivedActive = false, onArchived, onForms, formsActive = false, onReportBug, bugActive = false, bugCount = 0 }) {
  if (!tabs || tabs.length === 0) return null;
  // "Hosted" is pinned to the bottom (above Archived) as an icon-only tab, no count.
  const hostedTab = tabs.find((t) => t.key === "Hosted");
  const mainTabs = tabs.filter((t) => t.key !== "Hosted");
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-1.5 border-r border-white/40 dark:border-white/10 shrink-0 overflow-y-auto">
      {mainTabs.map((t) => {
        const isActive = !archivedActive && active === t.key;
        const c = counts[t.key] || 0;
        // On mobile, hide empty status tabs (count 0) unless it's the bug tab
        // or the currently active tab. Always shown from tablet up.
        const hideOnMobile = c === 0 && t.key !== "bug" && t.key !== "me" && t.key !== "all" && !isActive;
        // Block selecting an empty status tab — show a "No items" tooltip instead
        // of letting it load then jitter to the next non-empty status.
        const isStatusTab = t.key !== "bug" && t.key !== "me" && t.key !== "all";
        const isEmpty = isStatusTab && c === 0 && !isActive;
        // Visually de-emphasize the "Closed" tab (Support/Influencer "closed",
        // Events "Closed") across all three inboxes.
        const isClosedTab = t.key === "closed" || t.key === "Closed";
        return (
          <button
            key={t.key}
            onClick={() => { if (!isEmpty) onChange(t.key); }}
            disabled={isEmpty}
            title={isEmpty ? "No items" : t.label}
            style={isActive ? { background: accent, color: "#fff" } : undefined}
            className={`relative w-14 ${hideOnMobile ? "hidden md:flex" : "flex"} ${isClosedTab && !isActive ? "opacity-50" : ""} flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all ${
              isActive
                ? "shadow-md"
                : isEmpty
                  ? "text-pink-900/30 dark:text-white/30 cursor-not-allowed"
                  : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
            }`}
          >
            {t.key === "bug" ? (
              <span className="relative">
                <Bug className="w-5 h-5" />
                {c > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {c}
                  </span>
                )}
              </span>
            ) : (t.key === "me" || t.key === "all") ? (
              <span className="relative inline-flex items-center justify-center">
                {t.key === "me" ? <UserRound className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                {c > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                    style={{ background: accent }}
                  >
                    {c}
                  </span>
                )}
              </span>
            ) : (
              <span className="relative inline-block leading-none">
                <span className="text-lg font-bold leading-none">{c}</span>
                {unread[t.key] && !isActive && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white/80 dark:ring-zinc-900/80" />
                )}
              </span>
            )}
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

      {/* Archived — icon only, sits above the separator (above the bottom tools) */}
      {onArchived && (
        <button
          onClick={onArchived}
          title="Archived"
          style={archivedActive ? { background: accent, color: "#fff" } : undefined}
          className={`${hostedTab ? "" : "mt-auto"} w-14 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all ${
            archivedActive
              ? "shadow-md"
              : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
          }`}
        >
          <Archive className="w-5 h-5" />
          <span>Archived</span>
        </button>
      )}

      {/* Bottom tools: Terms, Bugs — pinned together at the bottom */}
      <div className={`${hostedTab || onArchived ? "" : "mt-auto"} w-full flex flex-col items-center gap-1 pt-1 border-t border-white/40 dark:border-white/10`}>
        {/* Forms — opens the spoke submission form for the current inbox */}
        {onForms && (
          <button
            onClick={onForms}
            title="Forms"
            style={formsActive ? { background: accent, color: "#fff" } : undefined}
            className={`w-14 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all ${
              formsActive ? "shadow-md" : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Forms</span>
          </button>
        )}

        {/* Report Bug — opens the Bugs thread list AND the live-chat Bug Reporter together */}
        {onReportBug && (
          <button
            onClick={onReportBug}
            title="Report Bug"
            style={bugActive ? { background: accent, color: "#fff" } : undefined}
            className={`w-14 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-medium leading-none transition-all ${
              bugActive
                ? "shadow-md"
                : "text-pink-900/55 dark:text-white/55 hover:bg-white/50 dark:hover:bg-white/10"
            }`}
          >
            <span className="relative">
              <Bug className="w-5 h-5" />
              {bugCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {bugCount}
                </span>
              )}
            </span>
            <span className="text-center leading-tight">Bugs</span>
          </button>
        )}
      </div>
    </div>
  );
}