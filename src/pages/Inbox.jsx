import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import InboxNav from "@/components/inbox/InboxNav";
import ThreadList from "@/components/inbox/ThreadList";
import ThreadPanel, { EmptyThreadState } from "@/components/inbox/ThreadPanel";
import ContactPanel from "@/components/inbox/ContactPanel";
import { SOURCE_META } from "@/components/inbox/inboxConfig";

const VIEW_TITLES = {
  all: "All",
  search: "Search",
  mine: "My Inbox",
  unassigned: "Unassigned",
  open: "Open",
  resolved: "Resolved",
};

export default function Inbox() {
  const qc = useQueryClient();
  const [view, setView] = useState("all");
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

  const myEmail = currentUser?.email;

  const counts = useMemo(() => {
    const c = { all: 0, mine: 0, unassigned: 0, support: 0, events: 0, influencer: 0 };
    threads.forEach((t) => {
      if (t.status === "closed") return;
      c.all++;
      if (t.assignee_email && t.assignee_email === myEmail) c.mine++;
      if (!t.assignee_email) c.unassigned++;
      if (c[t.source_app] !== undefined) c[t.source_app]++;
    });
    return c;
  }, [threads, myEmail]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (view === "mine" && t.assignee_email !== myEmail) return false;
      else if (view === "unassigned" && t.assignee_email) return false;
      else if (view === "open" && t.status !== "open") return false;
      else if (view === "resolved" && t.status !== "resolved") return false;
      else if (SOURCE_META[view] && t.source_app !== view) return false;
      if (!q) return true;
      return (
        (t.contact_name || "").toLowerCase().includes(q) ||
        (t.contact_email || "").toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q)
      );
    });
  }, [threads, view, search, myEmail]);

  const title = VIEW_TITLES[view] || SOURCE_META[view]?.label || "Inbox";
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
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Far left: Heyy-style nav panel */}
      <div className={`${selectedThread ? "hidden lg:block" : "hidden md:block"} w-[230px] shrink-0 h-full`}>
        <InboxNav view={view} setView={setView} counts={counts} currentUser={currentUser} />
      </div>

      <div className={`flex-1 grid grid-cols-1 md:grid-cols-[340px_1fr] overflow-hidden ${selectedThread && showContact ? "lg:grid-cols-[340px_1fr_320px]" : ""}`}>
        {/* Thread list */}
        <div className={`${selectedThread ? "hidden md:block" : "block"} h-full overflow-hidden`}>
          <ThreadList
            threads={filtered} title={title} count={filtered.length}
            search={search} setSearch={setSearch}
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

        {/* Right: contact panel — collapsed by default, toggled via header */}
        {selectedThread && showContact && (
          <div className="fixed inset-0 z-40 lg:static lg:z-auto h-full overflow-hidden">
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