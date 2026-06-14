import React from "react";
import ThreadRow from "./ThreadRow";
import { TABS } from "./inboxConfig";
import { Search, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ThreadList({
  threads, activeTab, setActiveTab, tabCounts, search, setSearch,
  selectedId, onSelect, loading,
}) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-4 pt-4 pb-2 border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-900 mb-3">Inbox</h1>
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

      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === t.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {t.label}
            {tabCounts[t.key] > 0 && (
              <span className={`ml-1.5 ${activeTab === t.key ? "text-slate-300" : "text-slate-400"}`}>{tabCounts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
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
          threads.map((t) => (
            <ThreadRow key={t.id} thread={t} active={t.id === selectedId} onClick={() => onSelect(t)} />
          ))
        )}
      </div>
    </div>
  );
}