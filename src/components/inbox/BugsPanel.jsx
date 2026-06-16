import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LifeBuoy, Plus, Search, Loader2, AlertTriangle, Clock, CheckCircle2, X } from "lucide-react";

const URGENCY_TONE = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-200",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-500/25 dark:text-orange-200",
  Soon: "bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200",
  Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200",
};

const STATUS_TONE = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-500/25 dark:text-sky-200",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200",
  Closed: "bg-slate-100 text-slate-500 dark:bg-white/15 dark:text-white/70",
};

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function BugRow({ bug, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left mx-2 my-1 px-3 py-3 flex flex-col gap-1 rounded-2xl transition-all ${
        active
          ? "bg-white/80 dark:bg-white/15 shadow-sm ring-1 ring-amber-200/70 dark:ring-white/20 border-l-[3px] border-amber-500"
          : "hover:bg-white/50 dark:hover:bg-white/10 border-l-[3px] border-transparent"
      }`}
      style={{ width: "calc(100% - 1rem)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-amber-900 dark:text-white">
          {bug.title || bug.description?.slice(0, 60) || "Untitled bug"}
        </span>
        <span className="text-[11px] text-amber-500 dark:text-white/50 shrink-0">{fmtDate(bug.created_date)}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {bug.bug_number != null && (
          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            B{bug.bug_number}
          </span>
        )}
        {bug.status && (
          <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${STATUS_TONE[bug.status] || STATUS_TONE.New}`}>
            {bug.status}
          </span>
        )}
        {bug.urgency && (
          <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${URGENCY_TONE[bug.urgency] || ""}`}>
            {bug.urgency}
          </span>
        )}
      </div>
      <p className="truncate text-xs text-amber-900/50 dark:text-white/45">{bug.description || "—"}</p>
    </button>
  );
}

function BugDetail({ bug, onClose }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 py-3 border-b border-white/40 dark:border-white/10 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {bug.bug_number != null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">B{bug.bug_number}</span>
            )}
            {bug.status && <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_TONE[bug.status] || STATUS_TONE.New}`}>{bug.status}</span>}
            {bug.urgency && <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${URGENCY_TONE[bug.urgency] || ""}`}>{bug.urgency}</span>}
          </div>
          <h2 className="mt-2 text-base font-bold text-amber-900 dark:text-white leading-snug">
            {bug.title || "Bug report"}
          </h2>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto ios-scroll p-4 space-y-4 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/50 dark:text-white/45 mb-1">Description</p>
          <p className="whitespace-pre-wrap text-amber-900/90 dark:text-white/85">{bug.description || "—"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Platform" value={bug.platform} />
          <Field label="Reported" value={fmtDate(bug.created_date)} />
          {bug.client_name && <Field label="Client" value={bug.client_name} />}
          {bug.booking_info && <Field label="Booking" value={bug.booking_info} />}
          {bug.reported_by_name && <Field label="Reported by" value={bug.reported_by_name} />}
          {bug.escalated_to && <Field label="Escalated to" value={bug.escalated_to} />}
        </div>
        {Array.isArray(bug.image_urls) && bug.image_urls.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/50 dark:text-white/45 mb-1.5">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {bug.image_urls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover border border-white/50" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/50 dark:text-white/45">{label}</p>
      <p className="text-amber-900/90 dark:text-white/85">{value}</p>
    </div>
  );
}

/**
 * Bugs view rendered inside the inbox center area. Shows reported bugs as a
 * thread-style list with a detail panel, plus a "+" to open the live bug chat.
 */
export default function BugsPanel({ accent = "#b67651", onNewBug }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const { data: bugs = [], isLoading } = useQuery({
    queryKey: ["bug-reports"],
    queryFn: () => base44.entities.BugReport.list("-created_date", 500),
    initialData: [],
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bugs;
    return bugs.filter((b) =>
      [b.title, b.description, b.client_name, b.platform, String(b.bug_number)]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [bugs, search]);

  const selectedBug = bugs.find((b) => b.id === selected?.id) || selected;

  return (
    <div className="flex-1 flex h-full overflow-hidden min-w-0">
      {/* List */}
      <div className={`${selectedBug ? "hidden md:flex" : "flex"} flex-col h-full w-full md:w-[340px] md:shrink-0 border-r border-white/40 dark:border-white/10`}>
        <div className="shrink-0 px-3 py-3 border-b border-white/40 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="flex items-center gap-2 font-bold text-amber-900 dark:text-white">
              <LifeBuoy className="w-5 h-5" style={{ color: accent }} /> Bugs
              <span className="text-sm font-semibold text-amber-900/50 dark:text-white/50">{filtered.length}</span>
            </h2>
            <button
              onClick={onNewBug}
              title="Report a new bug"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-105 active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900/40 dark:text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bugs…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/60 dark:bg-white/10 border border-white/50 dark:border-white/15 outline-none placeholder:text-amber-900/40 dark:placeholder:text-white/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto ios-scroll py-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-amber-900/50 dark:text-white/50">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-6 py-12 text-amber-900/50 dark:text-white/50">
              <LifeBuoy className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No bugs reported</p>
              <p className="text-xs mt-1">Tap + to report a new issue.</p>
            </div>
          ) : (
            filtered.map((b) => (
              <BugRow key={b.id} bug={b} active={selectedBug?.id === b.id} onClick={() => setSelected(b)} />
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      <div className={`${selectedBug ? "flex" : "hidden md:flex"} flex-col flex-1 h-full min-w-0`}>
        {selectedBug ? (
          <BugDetail bug={selectedBug} onClose={() => setSelected(null)} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-amber-900/40 dark:text-white/40">
            <LifeBuoy className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Select a bug to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}