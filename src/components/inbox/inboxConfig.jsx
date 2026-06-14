// Shared config + helpers for the Unified Inbox CRM.

export const SOURCE_META = {
  support: { label: "Support", badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500", ring: "ring-blue-500" },
  events: { label: "Events", badge: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500", ring: "ring-rose-500" },
  partner: { label: "Partner", badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500", ring: "ring-purple-500" },
};

export const STATUS_META = {
  open: { label: "Open", chip: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "In Progress", chip: "bg-amber-100 text-amber-700" },
  waiting: { label: "Waiting", chip: "bg-slate-200 text-slate-700" },
  resolved: { label: "Resolved", chip: "bg-indigo-100 text-indigo-700" },
  closed: { label: "Closed", chip: "bg-slate-100 text-slate-500" },
};

export const STATUS_ORDER = ["open", "in_progress", "waiting", "resolved", "closed"];

export const TABS = [
  { key: "all", label: "All" },
  { key: "support", label: "Support" },
  { key: "events", label: "Events" },
  { key: "partner", label: "Partner" },
];

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarGradient(seed = "") {
  const palettes = [
    "from-blue-400 to-indigo-500",
    "from-rose-400 to-pink-500",
    "from-purple-400 to-fuchsia-500",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
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