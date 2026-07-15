import React, { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BugRow from "./BugRow";
import BugFilters from "./BugFilters";
import AutoCloseButton from "./AutoCloseButton";

// Group bugs into "Month Year" buckets based on created_date, newest first.
function groupByMonth(bugs) {
  const buckets = {};
  bugs.forEach((b) => {
    const d = b.created_date ? new Date(b.created_date) : null;
    const key = d && !isNaN(d.getTime())
      ? d.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : "Undated";
    (buckets[key] = buckets[key] || []).push(b);
  });
  // Order buckets newest-first using the first item's date in each.
  return Object.entries(buckets).sort((a, b) => {
    const da = new Date(a[1][0]?.created_date || 0).getTime();
    const dbb = new Date(b[1][0]?.created_date || 0).getTime();
    return dbb - da;
  });
}

export default function BugList({ bugs, statusFilter = "New", selectedBug, onSelect, onReportBug, highlightId }) {
  const [urgency, setUrgency] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bugs.filter((b) => {
      const st = b.status || "New";
      // Status is driven by the rail selection.
      if (st !== statusFilter) return false;
      if (urgency !== "all" && b.urgency !== urgency) return false;
      if (q) {
        const hay = `${b.title || ""} ${b.description || ""} ${b.client_name || ""} ${b.bug_number != null ? "b" + Math.round(b.bug_number) : ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bugs, urgency, statusFilter, search]);

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-pink-900 dark:text-white flex items-center gap-2">
          {statusFilter === "In Progress" ? "Progress" : statusFilter}
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#6b7280]/15 text-[#4b5563] dark:bg-[#6b7280]/30 dark:text-white/80">
            {filtered.length}
          </span>
        </h2>
        <div className="flex items-center gap-1.5">
          {statusFilter === "Resolved" && <AutoCloseButton bugs={bugs} />}
          <BugFilters urgency={urgency} onUrgency={setUrgency} />
          <button
            onClick={onReportBug}
            title="Report a bug"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6b7280] text-white hover:bg-[#4b5563] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400 dark:text-white/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="pl-9 h-9 bg-white/60 dark:bg-white/10 border-white/70 dark:border-white/15 rounded-full text-pink-900 dark:text-white placeholder:text-pink-300 dark:placeholder:text-white/40 focus-visible:ring-pink-300"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto ios-scroll pb-2">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-pink-400 dark:text-white/50 py-8">No bug reports.</p>
        ) : (
          groups.map(([label, items]) => (
            <div key={label}>
              <div className="sticky top-0 z-10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-pink-400 dark:text-white/45 bg-white/60 dark:bg-white/5 backdrop-blur-sm">
                {label}
              </div>
              {items.map((b) => (
                <BugRow key={b.id} bug={b} active={selectedBug?.id === b.id} highlight={b.id === highlightId} onClick={() => onSelect(b)} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}