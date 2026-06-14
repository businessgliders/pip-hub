import React, { useState, useEffect, useRef } from "react";
import ThreadRow from "./ThreadRow";
import { Search, Inbox, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 50;

export default function ThreadList({
  threads, title, count, search, setSearch,
  selectedId, onSelect, loading,
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
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-slate-900">{title}</h1>
          {count > 0 && <span className="text-sm text-slate-400 font-medium">{count}</span>}
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <button className="p-1.5 rounded-md hover:bg-slate-100"><Search className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-md hover:bg-slate-100"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="pl-9 h-9 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
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
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">No conversations here.</p>
          </div>
        ) : (
          <>
            {shown.map((t) => (
              <ThreadRow key={t.id} thread={t} active={t.id === selectedId} onClick={() => onSelect(t)} />
            ))}
            {visible < threads.length && (
              <div className="py-4 text-center text-xs text-slate-400">Loading more…</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}