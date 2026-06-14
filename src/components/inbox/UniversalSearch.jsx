import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SOURCE_META, STATUS_META, relativeTime } from "./inboxConfig";
import Avatar from "./Avatar";

export default function UniversalSearch({ threads, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return threads
      .filter((t) =>
        (t.contact_name || "").toLowerCase().includes(q) ||
        (t.contact_email || "").toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q) ||
        (t.snippet || "").toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [threads, query]);

  const handlePick = (t) => {
    onSelect(t);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search all inboxes…"
          className="pl-9 pr-8 h-9 bg-slate-50 border-slate-200"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">No matches found.</div>
          ) : (
            results.map((t) => {
              const source = SOURCE_META[t.source_app];
              const status = STATUS_META[t.status];
              return (
                <button
                  key={t.id}
                  onClick={() => handlePick(t)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                >
                  <Avatar name={t.contact_name} email={t.contact_email} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {t.contact_name || t.contact_email}
                      </span>
                      <span className="ml-auto text-[11px] text-slate-400 shrink-0">{relativeTime(t.last_activity_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{t.subject}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {source && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${source.badge}`}>
                          {source.label}
                        </span>
                      )}
                      {status && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.chip}`}>
                          {status.label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}