import React, { useState, useEffect, useRef } from "react";
import ThreadRow from "./ThreadRow";
import { Search, Inbox, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 50;

// Groups threads into { label, items } buckets by Year-Month of last activity.
function groupByMonth(threads) {
  const buckets = new Map();
  for (const t of threads) {
    const d = new Date(t.last_activity_at || t.created_date || 0);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
    if (!buckets.has(key)) buckets.set(key, { key, label, items: [] });
    buckets.get(key).items.push(t);
  }
  // Sort buckets newest first.
  return Array.from(buckets.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}

export default function ThreadList({
  threads, title, count, search, setSearch,
  selectedId, onSelect, loading, filterSlot, grouped = false,
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const scrollRef = useRef(null);

  // Reset paging when the underlying list changes (view switch / search)
  useEffect(() => {
    setVisible(PAGE_SIZE);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [title, search, threads]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      setVisible((v) => (v < threads.length ? v + PAGE_SIZE : v));
    }
  };

  const shown = threads.slice(0, visible);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg font-bold text-pink-900 dark:text-white truncate">{title}</h1>
          {count > 0 && <span className="text-sm text-pink-400 dark:text-white/60 font-medium shrink-0">{count}</span>}
        </div>
        <div className="flex items-center gap-1 text-pink-400 dark:text-white/60 shrink-0">
          {filterSlot}
          <button className="p-1.5 rounded-full hover:bg-white/60 dark:hover:bg-white/10"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="px-4 pb-3">
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

      <div className="flex-1 overflow-y-auto ios-scroll" ref={scrollRef} onScroll={handleScroll}>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-2 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-pink-400 p-8 text-center">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">No conversations here.</p>
          </div>
        ) : (
          <>
            {grouped ? (
              groupByMonth(shown).map((g) => (
                <div key={g.key}>
                  <div className="sticky top-0 z-10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-pink-700/70 dark:text-white/60 bg-white/40 dark:bg-white/5 backdrop-blur-md border-b border-white/40 dark:border-white/10">
                    {g.label}
                  </div>
                  {g.items.map((t) => (
                    <ThreadRow key={t.id} thread={t} active={t.id === selectedId} onClick={() => onSelect(t)} />
                  ))}
                </div>
              ))
            ) : (
              shown.map((t) => (
                <ThreadRow key={t.id} thread={t} active={t.id === selectedId} onClick={() => onSelect(t)} />
              ))
            )}
            {visible < threads.length && (
              <div className="py-4 text-center text-xs text-slate-400">Loading more…</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}