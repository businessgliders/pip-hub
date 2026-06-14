import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import InboxTopBar from "@/components/inbox/InboxTopBar";
import ThreadList from "@/components/inbox/ThreadList";
import ThreadPanel, { EmptyThreadState } from "@/components/inbox/ThreadPanel";
import ContactPanel from "@/components/inbox/ContactPanel";
import InboxFilterTabs from "@/components/inbox/InboxFilterTabs";
import ResizeHandle from "@/components/inbox/ResizeHandle";
import { SOURCE_META, STATUS_META, STATUS_ORDER, viewBackdrop } from "@/components/inbox/inboxConfig";
import { useTheme } from "@/lib/ThemeContext";

const VIEW_TITLES = {
  all: "Inbox",
};

// Source tabs shown for the "All" view
const SOURCE_TABS = [
  { key: "all", label: "All" },
  { key: "support", label: "Support" },
  { key: "events", label: "Events" },
  { key: "influencer", label: "Influencer" },
];

// Status tabs shown for team inboxes (support/events/influencer) — no "All"
const STATUS_TABS = STATUS_ORDER.map((s) => ({ key: s, label: STATUS_META[s].label }));

export default function Inbox() {
  const qc = useQueryClient();
  const { dark } = useTheme();
  const [view, setView] = useState("support");
  const [subFilter, setSubFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showContact, setShowContact] = useState(true);
  const [listWidth, setListWidth] = useState(560);
  const [currentUser, setCurrentUser] = useState(null);
  const centerRef = useRef(null);

  const handleListResize = (clientX) => {
    const left = centerRef.current?.getBoundingClientRect().left || 0;
    const w = clientX - left;
    setListWidth(Math.max(260, Math.min(560, w)));
  };

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
  const activeTabs = isSourceView ? STATUS_TABS : SOURCE_TABS;

  // Reset the sub-filter whenever the main view changes.
  // Team inboxes have no "All" status tab, so default to the first status.
  useEffect(() => { setSubFilter(SOURCE_META[view] ? STATUS_ORDER[0] : "all"); }, [view]);

  const counts = useMemo(() => {
    const c = { all: 0, support: 0, events: 0, influencer: 0, closed: 0 };
    threads.forEach((t) => {
      if (t.status === "closed") { c.closed++; return; }
      c.all++;
      if (c[t.source_app] !== undefined) c[t.source_app]++;
    });
    return c;
  }, [threads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      // Main view filter
      if (SOURCE_META[view]) {
        // Team inbox: filter by source, then by status sub-tab
        if (t.source_app !== view) return false;
        if (subFilter !== "all" && t.status !== subFilter) return false;
      } else {
        // "All" view: hide closed
        if (t.status === "closed") return false;
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
  }, [threads, view, subFilter, search]);

  // Auto-select the first available conversation when nothing is selected.
  useEffect(() => {
    if (!selected && filtered.length > 0) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get("thread")) {
        handleSelect(filtered[0]);
      }
    }
  }, [filtered, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = VIEW_TITLES[view] || SOURCE_META[view]?.label || "Inbox";

  // Counts for the sub-filter tabs (based on current main view, ignoring sub-tab)
  const tabCounts = useMemo(() => {
    const base = threads.filter((t) => {
      if (SOURCE_META[view]) return t.source_app === view;
      return t.status !== "closed";
    });
    const c = { all: base.length };
    if (isSourceView) {
      STATUS_ORDER.forEach((s) => { c[s] = base.filter((t) => t.status === s).length; });
    } else {
      ["support", "events", "influencer"].forEach((s) => { c[s] = base.filter((t) => t.source_app === s).length; });
    }
    return c;
  }, [threads, view, isSourceView]);
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
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Vibrant pink gradient backdrop */}
      <div
        className="absolute inset-0 -z-10 transition-[background] duration-700"
        style={{ background: viewBackdrop(view, dark) }}
      />

      <InboxTopBar view={view} setView={setView} currentUser={currentUser} />

      {/* 3 floating glass panels */}
      <div ref={centerRef} className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Thread list (resizable) */}
        <div
          className={`${selectedThread ? "hidden md:flex" : "flex"} h-full overflow-hidden flex-col rounded-3xl bg-white/45 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 shadow-2xl shadow-black/20 shrink-0`}
          style={{ width: selectedThread ? listWidth : undefined, flex: selectedThread ? undefined : "1 1 100%" }}
        >
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

        {/* Resize grabber — only when a thread is open */}
        {selectedThread && <ResizeHandle onDrag={handleListResize} />}

        {/* Center: thread panel */}
        <div
          className={`${selectedThread ? "flex flex-col flex-1" : "hidden md:flex md:flex-col md:flex-1"} h-full overflow-hidden min-w-0 rounded-3xl bg-white/45 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 shadow-2xl shadow-black/20`}
        >
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

        {/* Right: contact panel — open by default, toggled via header */}
        {selectedThread && showContact && (
          <div className="fixed inset-0 z-40 p-4 lg:static lg:z-auto lg:p-0 lg:w-[300px] lg:shrink-0 h-full overflow-hidden">
            <div className="h-full rounded-3xl bg-white/45 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 shadow-2xl shadow-black/20 overflow-hidden">
              <ContactPanel
                thread={selectedThread}
                onSelectThread={(t) => handleSelect(t)}
                onClose={() => setShowContact(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}