import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ThreadList from "@/components/inbox/ThreadList";
import ThreadPanel, { EmptyThreadState } from "@/components/inbox/ThreadPanel";
import ContactPanel from "@/components/inbox/ContactPanel";
import { ArrowLeft, Users } from "lucide-react";

export default function Inbox() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: threads, isLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: () => base44.entities.Thread.list("-last_activity_at", 200),
    initialData: [],
  });

  // Deep-link support: /inbox?thread=<id> (e.g. from Contacts page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("thread");
    if (tid && threads.length && !selected) {
      const found = threads.find((t) => t.id === tid);
      if (found) setSelected(found);
    }
  }, [threads]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: staffRes } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => base44.functions.invoke("getStaffList", {}),
  });
  const staff = staffRes?.data?.staff || [];

  const updateThread = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Thread.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threads"] }),
  });

  const tabCounts = useMemo(() => {
    const c = { all: 0, support: 0, events: 0, partner: 0 };
    threads.forEach((t) => {
      if (t.status === "closed") return;
      c.all++;
      if (c[t.source_app] !== undefined) c[t.source_app]++;
    });
    return c;
  }, [threads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (activeTab !== "all" && t.source_app !== activeTab) return false;
      if (!q) return true;
      return (
        (t.contact_name || "").toLowerCase().includes(q) ||
        (t.contact_email || "").toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q)
      );
    });
  }, [threads, activeTab, search]);

  const selectedThread = threads.find((t) => t.id === selected?.id) || selected;

  const handleSelect = (t) => {
    setSelected(t);
    setShowContact(false);
    if (!t.is_read) updateThread.mutate({ id: t.id, data: { is_read: true } });
  };

  const handleStatus = (status) => {
    if (!selectedThread) return;
    const entry = { status, changed_by: currentUser?.email || "staff", timestamp: new Date().toISOString() };
    updateThread.mutate({
      id: selectedThread.id,
      data: { status, status_history: [...(selectedThread.status_history || []), entry] },
    });
  };

  const handleAssign = (email) => {
    if (!selectedThread) return;
    updateThread.mutate({ id: selectedThread.id, data: { assignee_email: email } });
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Hub
        </Link>
        <span className="text-sm font-semibold text-slate-700">Unified Inbox</span>
        <Link to="/contacts" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <Users className="w-4 h-4" /> Contacts
        </Link>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[340px_1fr] lg:grid-cols-[340px_1fr_320px] overflow-hidden">
        {/* Left: thread list */}
        <div className={`${selectedThread ? "hidden md:block" : "block"} h-full overflow-hidden`}>
          <ThreadList
            threads={filtered} activeTab={activeTab} setActiveTab={setActiveTab}
            tabCounts={tabCounts} search={search} setSearch={setSearch}
            selectedId={selectedThread?.id} onSelect={handleSelect} loading={isLoading}
          />
        </div>

        {/* Center: thread panel */}
        <div className={`${selectedThread ? "block" : "hidden md:block"} h-full overflow-hidden`}>
          {selectedThread ? (
            <ThreadPanel
              key={selectedThread.id}
              thread={selectedThread} staff={staff} currentUser={currentUser}
              onStatusChange={handleStatus} onAssign={handleAssign}
              onBack={() => setSelected(null)}
              onToggleContact={() => setShowContact((s) => !s)}
            />
          ) : (
            <EmptyThreadState />
          )}
        </div>

        {/* Right: contact panel (desktop persistent, mobile overlay) */}
        {selectedThread && (
          <div className={`${showContact ? "fixed inset-0 z-40 lg:static lg:z-auto" : "hidden lg:block"} h-full overflow-hidden`}>
            <ContactPanel
              thread={selectedThread}
              onSelectThread={(t) => handleSelect(t)}
              onClose={() => setShowContact(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}