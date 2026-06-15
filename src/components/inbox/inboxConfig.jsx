// Shared config + helpers for the Unified Inbox CRM.

export const SOURCE_META = {
  support: { label: "Support", badge: "bg-sky-100/80 text-sky-700 border-sky-200/70 dark:bg-sky-400/20 dark:text-sky-200 dark:border-sky-300/30", dot: "bg-sky-500", ring: "ring-sky-500" },
  events: { label: "Events", badge: "bg-pink-100/80 text-pink-700 border-pink-200/70 dark:bg-pink-400/20 dark:text-pink-200 dark:border-pink-300/30", dot: "bg-pink-500", ring: "ring-pink-500" },
  influencer: { label: "Influencer", badge: "bg-fuchsia-100/80 text-fuchsia-700 border-fuchsia-200/70 dark:bg-fuchsia-400/20 dark:text-fuchsia-200 dark:border-fuchsia-300/30", dot: "bg-fuchsia-500", ring: "ring-fuchsia-500" },
};

export const STATUS_META = {
  open: { label: "Open", chip: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200" },
  in_progress: { label: "Progress", chip: "bg-amber-100/80 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200" },
  waiting: { label: "Waiting", chip: "bg-pink-100/80 text-pink-700 dark:bg-pink-400/20 dark:text-pink-200" },
  resolved: { label: "Resolved", chip: "bg-violet-100/80 text-violet-700 dark:bg-violet-400/25 dark:text-violet-200" },
  closed: { label: "Closed", chip: "bg-slate-100/80 text-slate-500 dark:bg-white/15 dark:text-white/70" },
};

export const STATUS_ORDER = ["open", "in_progress", "waiting", "resolved", "closed"];

// Events inbox uses the original EventLead pipeline stages instead of the generic statuses.
export const EVENTS_STATUS_META = {
  "New": { label: "New", chip: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200" },
  "In Conversations": { label: "In Convo", chip: "bg-amber-100/80 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200" },
  "Waiting for Payment": { label: "Waiting for Payment", chip: "bg-orange-100/80 text-orange-700 dark:bg-orange-400/20 dark:text-orange-200" },
  "Pending": { label: "Pending", chip: "bg-yellow-100/80 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-200" },
  "Confirmed": { label: "Confirmed", chip: "bg-sky-100/80 text-sky-700 dark:bg-sky-400/20 dark:text-sky-200" },
  "Hosted": { label: "Hosted", chip: "bg-violet-100/80 text-violet-700 dark:bg-violet-400/25 dark:text-violet-200" },
  "No Response": { label: "No Response", chip: "bg-rose-100/80 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200" },
  "Cancelled": { label: "Cancelled", chip: "bg-red-100/80 text-red-700 dark:bg-red-400/20 dark:text-red-200" },
  "Closed": { label: "Closed", chip: "bg-slate-100/80 text-slate-500 dark:bg-white/15 dark:text-white/70" },
};

export const EVENTS_STATUS_ORDER = [
  "New", "In Conversations", "Waiting for Payment", "Pending", "Confirmed", "Hosted", "No Response", "Cancelled", "Closed",
];

// Combined lookup so any status value (generic or events) can be rendered.
export const ALL_STATUS_META = { ...STATUS_META, ...EVENTS_STATUS_META };

// Which status set a given source/view uses.
export function statusOrderFor(view) {
  return view === "events" ? EVENTS_STATUS_ORDER : STATUS_ORDER;
}

// Per-tab brand theme. Brown = Support, Pink = Events, Dark Purple = Influencer.
// Darker, saturated backdrops so the frosted glass panels show depth on top.
export const VIEW_THEME = {
  support: {
    accent: "#b67651",
    light:  "radial-gradient(1100px 600px at 12% 0%, #d8a784 0%, transparent 50%), radial-gradient(900px 600px at 100% 100%, #b67651 0%, transparent 55%), linear-gradient(135deg, #e9d3c2 0%, #c79570 55%, #9c5f3d 100%)",
    dark:   "radial-gradient(1100px 600px at 12% 0%, #6b452c 0%, transparent 55%), radial-gradient(900px 600px at 100% 100%, #3a2317 0%, transparent 55%), linear-gradient(135deg, #2a1a12 0%, #1c130d 100%)",
  },
  events: {
    accent: "#f1889b",
    light:  "radial-gradient(1100px 600px at 12% 0%, #ffd2de 0%, transparent 50%), radial-gradient(900px 600px at 100% 100%, #f1889b 0%, transparent 55%), linear-gradient(135deg, #ffe0e9 0%, #f7a7b8 55%, #e8657d 100%)",
    dark:   "radial-gradient(1100px 600px at 12% 0%, #7a2f43 0%, transparent 55%), radial-gradient(900px 600px at 100% 100%, #45111f 0%, transparent 55%), linear-gradient(135deg, #2c1018 0%, #1d0a10 100%)",
  },
  influencer: {
    accent: "#7c3aed",
    light:  "radial-gradient(1100px 600px at 12% 0%, #d7c2f0 0%, transparent 50%), radial-gradient(900px 600px at 100% 100%, #7c3aed 0%, transparent 55%), linear-gradient(135deg, #e3d6f5 0%, #9f74e0 55%, #5b2ca8 100%)",
    dark:   "radial-gradient(1100px 600px at 12% 0%, #3d2168 0%, transparent 55%), radial-gradient(900px 600px at 100% 100%, #1e0f38 0%, transparent 55%), linear-gradient(135deg, #1a1030 0%, #110a20 100%)",
  },
};

export function viewBackdrop(view, isDark) {
  const t = VIEW_THEME[view] || VIEW_THEME.events;
  return isDark ? t.dark : t.light;
}

// Dark text accent per inbox (dark brown / dark pink / dark blue-purple).
// Used in the details panel so copy matches the active inbox brand color.
export const VIEW_TEXT = {
  support: "#5c3a23",
  events: "#8a2d44",
  influencer: "#3d1f6e",
};
export function viewTextColor(view) {
  return VIEW_TEXT[view] || VIEW_TEXT.events;
}

// Per-inbox ticket/request number prefix.
export const SOURCE_PREFIX = {
  support: "SUP",
  events: "EVT",
  influencer: "INF",
};

// Formats a thread's ticket number as e.g. "SUP-1001". Returns "" if no number.
export function ticketLabel(thread) {
  if (!thread || thread.ticket_number == null) return "";
  const prefix = SOURCE_PREFIX[thread.source_app] || "TKT";
  return `${prefix}-${thread.ticket_number}`;
}

export const TABS = [
  { key: "all", label: "All" },
  { key: "support", label: "Support" },
  { key: "events", label: "Events" },
  { key: "influencer", label: "Influencer" },
];

// The studio's own mailbox should display as "Front Desk" everywhere.
const FRONT_DESK_EMAIL = "info@pilatesinpinkstudio.com";
export function displayName(name = "", email = "") {
  const e = String(email).trim().toLowerCase();
  const n = String(name).trim().toLowerCase();
  if (e === FRONT_DESK_EMAIL || n === "pilates in pink studio") return "Front Desk";
  return name || email || "";
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarGradient(seed = "") {
  const palettes = [
    "from-pink-400 to-rose-500",
    "from-rose-400 to-pink-500",
    "from-fuchsia-400 to-pink-500",
    "from-pink-300 to-fuchsia-400",
    "from-rose-300 to-pink-400",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % palettes.length;
  return palettes[Math.abs(h)];
}

export function relativeTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}