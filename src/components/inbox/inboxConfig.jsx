// Shared config + helpers for the Unified Inbox CRM.

export const SOURCE_META = {
  support: { label: "Support", badge: "bg-sky-100/80 text-sky-700 border-sky-200/70", dot: "bg-sky-500", ring: "ring-sky-500" },
  events: { label: "Events", badge: "bg-pink-100/80 text-pink-700 border-pink-200/70", dot: "bg-pink-500", ring: "ring-pink-500" },
  influencer: { label: "Influencer", badge: "bg-fuchsia-100/80 text-fuchsia-700 border-fuchsia-200/70", dot: "bg-fuchsia-500", ring: "ring-fuchsia-500" },
};

export const STATUS_META = {
  open: { label: "Open", chip: "bg-emerald-100/80 text-emerald-700" },
  in_progress: { label: "In Progress", chip: "bg-amber-100/80 text-amber-700" },
  waiting: { label: "Waiting", chip: "bg-pink-100/80 text-pink-700" },
  resolved: { label: "Resolved", chip: "bg-violet-100/80 text-violet-700" },
  closed: { label: "Closed", chip: "bg-slate-100/80 text-slate-500" },
};

export const STATUS_ORDER = ["open", "in_progress", "waiting", "resolved", "closed"];

// Mostly-white page backdrops with a subtle tint per selected team tab.
// Palette: f1889b / f7b1bd / fbe0e2 / b67651 / f6eee7
export const VIEW_BACKDROPS = {
  all: "radial-gradient(900px 500px at 10% 0%, #fbe0e2 0%, transparent 45%), linear-gradient(180deg, #ffffff 0%, #fdf6f7 100%)",
  support: "radial-gradient(900px 500px at 12% 0%, #fbe0e2 0%, transparent 42%), linear-gradient(180deg, #ffffff 0%, #fdeef0 100%)",
  events: "radial-gradient(900px 500px at 12% 0%, #f7b1bd55 0%, transparent 42%), linear-gradient(180deg, #ffffff 0%, #fdeaee 100%)",
  influencer: "radial-gradient(900px 500px at 12% 0%, #f6eee7 0%, transparent 42%), linear-gradient(180deg, #ffffff 0%, #faf3ee 100%)",
};

export const TABS = [
  { key: "all", label: "All" },
  { key: "support", label: "Support" },
  { key: "events", label: "Events" },
  { key: "influencer", label: "Influencer" },
];

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