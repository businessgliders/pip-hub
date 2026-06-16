import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import InboxTopBar from "@/components/inbox/InboxTopBar";
import ThreadList from "@/components/inbox/ThreadList";
import ThreadPanel, { EmptyThreadState } from "@/components/inbox/ThreadPanel";
import ContactPanel from "@/components/inbox/ContactPanel";
import InboxStatusRail from "@/components/inbox/InboxStatusRail";
import InquiryTypeFilter from "@/components/inbox/InquiryTypeFilter";
import ArchiveButton from "@/components/inbox/ArchiveButton";
import DetailToggleHandle from "@/components/inbox/DetailToggleHandle";
import ResizeHandle from "@/components/inbox/ResizeHandle";
import InboxTutorial, { hasSeenInboxTutorial } from "@/components/inbox/InboxTutorial";
import { SOURCE_META, STATUS_ORDER, EVENTS_STATUS_ORDER, INFLUENCER_STATUS_ORDER, ALL_STATUS_META, VIEW_THEME, viewBackdrop, statusOrderFor } from "@/components/inbox/inboxConfig";
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



export default function Inbox() {
  const qc = useQueryClient();
  const { dark } = useTheme();
  const VALID_VIEWS = ["support", "events", "influencer"];
  const [view, setView] = useState(() => {
    const h = window.location.hash.replace("#", "").toLowerCase();
    return VALID_VIEWS.includes(h) ? h : "support";
  });
  const [subFilter, setSubFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [inquiryType, setInquiryType] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [showContact, setShowContact] = useState(true);
  const [listWidth, setListWidth] = useState(360);
  const [currentUser, setCurrentUser] = useState(null);
  // On mobile/tablet the thread panel is full-screen. Default to showing the
  // conversation LIST on load (panel closed) so users pick a thread first.
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !hasSeenInboxTutorial());
  const centerRef = useRef(null);

  const handleListResize = (clientX) => {
    const left = centerRef.current?.getBoundingClientRect().left || 0;
    const w = clientX - left;
    setListWidth(Math.max(240, Math.min(440, w)));
  };

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Keep the URL hash in sync with the active inbox so each is directly linkable
  // (/inbox#support, /inbox#events, /inbox#influencer).
  useEffect(() => {
    if (window.location.hash.replace("#", "") !== view) {
      window.history.replaceState(null, "", `#${view}`);
    }
  }, [view]);

  // React to hash changes (shared links, back/forward navigation).
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "").toLowerCase();
      if (VALID_VIEWS.includes(h)) setView(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: threads, isLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: () => base44.entities.Thread.list("-last_activity_at", 1000),
    initialData: [],
  });

  // Real-time: refresh the thread list whenever any Thread is created/updated/deleted
  // (new submissions land instantly across all inboxes/statuses — no page refresh).
  useEffect(() => {
    const unsubscribe = base44.entities.Thread.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["threads"] });
    });
    return unsubscribe;
  }, [qc]);

  // Deep-link support: /inbox?thread=<id> (e.g. from Contacts page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("thread");
    if (tid && threads.length && !selected) {
      const found = threads.find((t) => t.id === tid);
      if (found) handleSelect(found);
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
  // Events use the EventLead pipeline stages; Influencer uses open/accepted/declined; others use the generic set.
  const statusOrder = statusOrderFor(view);
  const STATUS_TABS = statusOrder.map((s) => ({ key: s, label: ALL_STATUS_META[s].label }));
  const activeTabs = isSourceView ? STATUS_TABS : SOURCE_TABS;

  // Reset the sub-filter whenever the main view changes.
  // Team inboxes have no "All" status tab, so default to the first status.
  useEffect(() => { setSubFilter(SOURCE_META[view] ? statusOrderFor(view)[0] : "all"); setInquiryType("all"); setSelected(null); setShowArchived(false); }, [view]);

  // Distinct inquiry types within the current Support view (for the icon filter).
  const inquiryTypes = useMemo(() => {
    if (view !== "support") return [];
    const set = new Set();
    threads.forEach((t) => {
      if (t.source_app !== "support") return;
      const it = t.form_data?.inquiry_type;
      if (it) set.add(String(it));
    });
    return Array.from(set).sort();
  }, [threads, view]);

  const counts = useMemo(() => {
    const c = { all: 0, support: 0, events: 0, influencer: 0, closed: 0 };
    threads.forEach((t) => {
      if (t.status === "closed") { c.closed++; return; }
      c.all++;
      if (c[t.source_app] !== undefined) c[t.source_app]++;
    });
    return c;
  }, [threads]);

  // "Open" count per source for the compact header badge.
  // Events use "New" as their open stage; support/influencer use "open".
  const openCounts = useMemo(() => {
    const c = { support: 0, events: 0, influencer: 0 };
    threads.forEach((t) => {
      const openStatus = t.source_app === "events" ? "New" : "open";
      if (t.status === openStatus && c[t.source_app] !== undefined) c[t.source_app]++;
    });
    return c;
  }, [threads]);

  // Open conversations within the current view (for the top-bar badge).
  const openCount = useMemo(() => {
    return threads.filter((t) => {
      if (t.status !== "open") return false;
      if (SOURCE_META[view]) return t.source_app === view;
      return true;
    }).length;
  }, [threads, view]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      // Archived view shows only archived threads (within the current source); all
      // other views hide archived threads.
      if (showArchived) {
        if (!t.archived) return false;
        if (SOURCE_META[view] && t.source_app !== view) return false;
      } else if (t.archived) {
        return false;
      }
      // Main view filter
      if (showArchived) {
        // In archived view, skip status/source sub-filtering — just search.
      } else if (SOURCE_META[view]) {
        // Team inbox: filter by source, then by status sub-tab
        if (t.source_app !== view) return false;
        if (subFilter !== "all" && t.status !== subFilter) return false;
        // Support-only inquiry type filter
        if (view === "support" && inquiryType !== "all" && String(t.form_data?.inquiry_type || "") !== inquiryType) return false;
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
  }, [threads, view, subFilter, search, inquiryType, showArchived]);

  // Auto-select the first available conversation when nothing is selected.
  useEffect(() => {
    if (!selected && filtered.length > 0) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get("thread")) {
        // Auto-select the first thread, but only auto-OPEN the panel on desktop.
        // On mobile/tablet we show the conversation panel (empty state) without
        // forcing the first item open.
        const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
        handleSelect(filtered[0], { open: isDesktop });
      }
    }
  }, [filtered, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseTitle = VIEW_TITLES[view] || SOURCE_META[view]?.label || "Inbox";
  // In a team inbox, show ONLY the selected status label (e.g. "Open", "Closed")
  // instead of the inbox name. Falls back to the inbox name when on "all".
  const title = (isSourceView && subFilter !== "all" && ALL_STATUS_META[subFilter])
    ? ALL_STATUS_META[subFilter].label
    : baseTitle;

  // Counts for the sub-filter tabs (based on current main view, ignoring sub-tab)
  const tabCounts = useMemo(() => {
    const base = threads.filter((t) => {
      if (t.archived) return false;
      if (SOURCE_META[view]) return t.source_app === view;
      return t.status !== "closed";
    });
    const c = { all: base.length };
    if (isSourceView) {
      statusOrder.forEach((s) => { c[s] = base.filter((t) => t.status === s).length; });
    } else {
      ["support", "events", "influencer"].forEach((s) => { c[s] = base.filter((t) => t.source_app === s).length; });
    }
    return c;
  }, [threads, view, isSourceView, statusOrder]);
  const selectedThread = threads.find((t) => t.id === selected?.id) || selected;
  const accent = (VIEW_THEME[view] || VIEW_THEME.events).accent;

  const handleSelect = (t, { open = true, shake = false } = {}) => {
    setSelected(t);
    if (open) setMobilePanelOpen(true);
    if (shake) setShakeKey((k) => k + 1);
    if (!t.is_read) updateThread.mutate({ id: t.id, data: { is_read: true } });
  };

  const handleStatus = (status, meta = {}) => {
    if (!selectedThread) return;
    const entry = {
      status,
      changed_by: currentUser?.email || "staff",
      name: meta.name || currentUser?.full_name || "",
      note: meta.reason || "",
      timestamp: new Date().toISOString(),
    };
    updateThread.mutate({
      id: selectedThread.id,
      data: { status, status_history: [...(selectedThread.status_history || []), entry] },
    });
  };

  const handleAssign = (email) => {
    if (!selectedThread) return;
    updateThread.mutate({ id: selectedThread.id, data: { assignee_email: email } });
    // Notify the assignee (email + in-app notification). Non-blocking.
    if (email && email !== currentUser?.email) {
      base44.functions.invoke("sendAssignmentEmail", { thread_id: selectedThread.id, assigned_to: email }).catch(() => {});
    }
  };

  const handleArchive = async (toArchive) => {
    setSelected(null);
    for (const t of toArchive) {
      await base44.entities.Thread.update(t.id, { archived: true });
      // Optimistically drop the archived thread from the cached list so the
      // Closed count in the rail ticks down in real-time as each one completes.
      qc.setQueryData(["threads"], (prev) =>
        (prev || []).map((x) => (x.id === t.id ? { ...x, archived: true } : x))
      );
    }
    qc.invalidateQueries({ queryKey: ["threads"] });
  };

  // Whether the current Closed list should show the Archive action.
  const isClosedView = isSourceView && !showArchived &&
    (view === "events" ? subFilter === "Closed" : subFilter === "closed");

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      {showTutorial && <InboxTutorial onClose={() => setShowTutorial(false)} />}

      {/* Vibrant pink gradient backdrop */}
      <div
        className="absolute inset-0 -z-10 transition-[background] duration-700"
        style={{ background: viewBackdrop(view, dark) }}
      />

      <InboxTopBar
        view={view} setView={setView} currentUser={currentUser} openCount={openCount} counts={openCounts}
        hideChatWidgets={mobilePanelOpen}
        onOpenThread={(n) => {
          if (n.source_app && VALID_VIEWS.includes(n.source_app)) setView(n.source_app);
          const t = threads.find((th) => th.id === n.thread_id);
          if (t) handleSelect(t, { shake: true });
        }}
      />

      {/* 3 floating glass panels */}
      <div ref={centerRef} className="flex-1 flex gap-0 p-3 md:p-4 overflow-hidden">
        {/* Thread list (resizable) — full-screen on mobile until a thread is opened */}
        <div
          className={`${mobilePanelOpen ? "hidden md:flex" : "flex"} h-full overflow-hidden flex-row rounded-3xl bg-white/45 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 shadow-2xl shadow-black/20 shrink-0`}
          style={{ width: selectedThread ? listWidth : undefined, flex: selectedThread ? undefined : "1 1 100%" }}
        >
          {/* Vertical status rail (side panels) */}
          {activeTabs && (
            <InboxStatusRail
              tabs={activeTabs}
              active={subFilter}
              onChange={(k) => { setShowArchived(false); setSubFilter(k); setSelected(null); }}
              counts={tabCounts} accent={accent}
              archivedActive={showArchived}
              onArchived={isSourceView ? () => { setShowArchived((s) => !s); setSelected(null); } : undefined}
            />
          )}
          <div className="flex-1 overflow-hidden">
            <ThreadList
              threads={filtered}
              grouped={showArchived}
              title={showArchived ? "Archived" : title}
              count={filtered.length}
              search={search} setSearch={setSearch}
              selectedId={selectedThread?.id} onSelect={handleSelect} loading={isLoading}
              filterSlot={
                <>
                  {isClosedView && <ArchiveButton threads={filtered} onArchive={handleArchive} />}
                  {view === "support" && !showArchived && inquiryTypes.length > 0 ? (
                    <InquiryTypeFilter types={inquiryTypes} value={inquiryType} onChange={setInquiryType} />
                  ) : null}
                </>
              }
            />
          </div>
        </div>

        {/* Resize grabber — desktop split view only (component is hidden on mobile) */}
        {selectedThread && <ResizeHandle onDrag={handleListResize} />}

        {/* Center: thread panel — full-screen on mobile only when opened */}
        <div
          className={`${mobilePanelOpen ? "flex flex-col flex-1" : "hidden md:flex md:flex-col md:flex-1"} h-full overflow-hidden min-w-0 rounded-3xl bg-white/45 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 shadow-2xl shadow-black/20`}
        >
          {selectedThread ? (
            <ThreadPanel
              key={selectedThread.id}
              shakeKey={shakeKey}
              thread={selectedThread} staff={staff} currentUser={currentUser}
              onStatusChange={handleStatus} onAssign={handleAssign}
              onSelectThread={(t) => handleSelect(t)}
              onBack={() => setMobilePanelOpen(false)}
            />
          ) : (
            <EmptyThreadState />
          )}
        </div>

        {/* Transparent hover line to collapse/expand the detail panel (desktop) */}
        {selectedThread && (
          <DetailToggleHandle open={showContact} onToggle={() => setShowContact((s) => !s)} />
        )}

        {/* Right: contact panel — desktop-only sidebar (never overlays mobile/tablet) */}
        {selectedThread && showContact && (
          <div className="hidden lg:block lg:w-[300px] lg:shrink-0 h-full overflow-hidden">
            <div className="h-full rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-white/50 dark:border-white/15 shadow-2xl shadow-black/20 overflow-hidden">
              <ContactPanel
                thread={selectedThread}
                staff={staff}
                onAssign={handleAssign}
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