import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Avatar from "@/components/inbox/Avatar";
import SourceBadge from "@/components/inbox/SourceBadge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Inbox as InboxIcon } from "lucide-react";
import { relativeTime } from "@/components/inbox/inboxConfig";

export default function Contacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-last_activity_at", 500),
    initialData: [],
  });

  const { data: threads } = useQuery({
    queryKey: ["threads"],
    queryFn: () => base44.entities.Thread.list("-last_activity_at", 500),
    initialData: [],
  });

  const threadsByEmail = useMemo(() => {
    const map = {};
    threads.forEach((t) => {
      (map[t.contact_email] ||= []).push(t);
    });
    return map;
  }, [threads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)
    );
  }, [contacts, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
        <Link to="/inbox" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Inbox
        </Link>
        <span className="text-sm font-semibold text-slate-700">Contacts</span>
        <span className="w-12" />
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts by name or email…"
            className="pl-9 h-10 bg-white"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No contacts found.</div>
          ) : (
            filtered.map((c) => {
              const ct = threadsByEmail[c.email] || [];
              const counts = ct.reduce((acc, t) => {
                acc[t.source_app] = (acc[t.source_app] || 0) + 1;
                return acc;
              }, {});
              const first = ct[0];
              return (
                <button
                  key={c.id}
                  onClick={() => first && navigate(`/inbox?thread=${first.id}`)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left transition-colors"
                >
                  <Avatar name={c.name} email={c.email} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.email}</p>
                    {(c.labels || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.labels.map((l) => (
                          <span key={l} className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{l}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {["support", "events", "partner"].map((s) =>
                      counts[s] ? (
                        <span key={s} className="flex items-center gap-1">
                          <SourceBadge source={s} />
                          <span className="text-xs text-slate-400">{counts[s]}</span>
                        </span>
                      ) : null
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 w-12 text-right">
                    {relativeTime(c.last_activity_at)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}