import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import InboxNav from "@/components/inbox/InboxNav";
import ThreadList from "@/components/inbox/ThreadList";
import ThreadPanel, { EmptyThreadState } from "@/components/inbox/ThreadPanel";
import ContactPanel from "@/components/inbox/ContactPanel";
import InboxFilterTabs from "@/components/inbox/InboxFilterTabs";
import { SOURCE_META, STATUS_META, STATUS_ORDER } from "@/components/inbox/inboxConfig";

const VIEW_TITLES = {
  all: "All",
  mine: "My Inbox",
  unassigned: "Unassigned",
};

// Source tabs shown for All / My Inbox / Unassigned views
const SOURCE_TABS = [
  { key: "all", label: "All" },
  { key: "support", label: "Support" },
  { key: "events", label: "Events" },
  { key: "influencer", label: "Influencer" },
];

// Status tabs shown for team inboxes (support/events/influencer)
const STATUS_TABS = [
  { key: "all", label: "All" },
  ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_META[s].label })),
];

export default function Inbox() {
  const qc = useQueryClient();
  const [view, setView] = useState("all");
  const [subFilter, setSubFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showContact, setShowContact] = useState(true);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: threads, isLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: () => base44.entities.Thread.list("-last_activity_at", 1000),
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

  // Which sub-filter tabs to show in the conversation view.
  const isSourceView = !!SOURCE_META[view]; // team inbox
  const isPersonalView = ["all", "mine", "unassigned"].includes(view);
  const activeTabs = isSourceView ? STATUS_TABS : isPersonalView ? SOURCE_TABS : null;

  // Reset the sub-filter whenever the main view changes.
  useEffect(() => { setSubFilter("all"); }, [view]);

  const counts = useMemo(() => {
    const c = { all: 0, mine: 0, unassigned: 0, support: 0, events: 0, influencer: 0, closed: 0 };
    threads.forEach((t) => {
      if (t.status === "closed") { c.closed++; return; }
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
      // Main view filter
      if (SOURCE_META[view]) {
        // Team inbox: filter by source, then by status sub-tab
        if (t.source_app !== view) return false;
        if (subFilter !== "all" && t.status !== subFilter) return false;
      } else {
        // Personal views (all / mine / unassigned): hide closed
        if (t.status === "closed") return false;
        if (view === "mine" && t.assignee_email !== myEmail) return false;
        if (view === "unassigned" && t.assignee_email) return false;
        // Source sub-tab filter
        if (subFilter !== "all" && t.source_app !== subFilter) return false;
      }
      if (!q) return true;
      return (
        (t.contact_name || "").toLowerCase().includes(q) ||
        (t.contact_email || "").toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q)
      );
    });
  }, [threads, view, subFilter, search, myEmail]);

  const title = VIEW_TITLES[view] || SOURCE_META[view]?.label || "Inbox";

  // Counts for the sub-filter tabs (based on current main view, ignoring sub-tab)
  const tabCounts = useMemo(() => {
    const base = threads.filter((t) => {
      if (SOURCE_META[view]) return t.source_app === view;
      if (t.status === "closed") return false;
      if (view === "mine") return t.assignee_email === myEmail;
      if (view === "unassigned") return !t.assignee_email;
      return true;
    });
    const c = { all: base.length };
    if (isSourceView) {
      STATUS_ORDER.forEach((s) => { c[s] = base.filter((t) => t.status === s).length; });
    } else {
      ["support", "events", "influencer"].forEach((s) => { c[s] = base.filter((t) => t.source_app === s).length; });
    }
    return c;
  }, [threads, view, myEmail, isSourceView]);
  const selectedThread = threads.find((t) => t.id === selected?.id) || selected;

  const handleSelect = (t) => {
    setSelected(t);
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
      <div className={`${selectedThread ? "hidden lg:block" : "hidden md:block"} ${navCollapsed ? "w-[60px]" : "w-[230px]"} shrink-0 h-full transition-[width] duration-200`}>
        <InboxNav
          view={view} setView={setView} counts={counts} currentUser={currentUser}
          threads={threads} onSearchSelect={handleSelect}
          collapsed={navCollapsed} onToggleCollapse={() => setNavCollapsed((c) => !c)}
        />
      </div>

      <div className={`flex-1 grid grid-cols-1 md:grid-cols-[340px_1fr] overflow-hidden ${selectedThread && showContact ? "lg:grid-cols-[320px_minmax(0,1fr)_280px]" : ""}`}>
        {/* Thread list */}
        <div className={`${selectedThread ? "hidden md:block" : "block"} h-full overflow-hidden flex flex-col border-r border-slate-200`}>
          {activeTabs && (
            <InboxFilterTabs tabs={activeTabs} active={subFilter} onChange={setSubFilter} counts={tabCounts} />
          )}
          <div className="flex-1 overflow-hidden">
            <ThreadList
              threads={filtered} title={title} count={filtered.length}
              search={search} setSearch={setSearch}
              selectedId={selectedThread?.id} onSelect={handleSelect} loading={isLoading}
            />
          </div>
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
              contactOpen={showContact}
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