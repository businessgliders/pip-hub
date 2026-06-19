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
import CloseAllButton from "@/components/inbox/CloseAllButton";
import EventSortMenu from "@/components/inbox/EventSortMenu";
import DetailToggleHandle from "@/components/inbox/DetailToggleHandle";
import ResizeHandle from "@/components/inbox/ResizeHandle";
import InboxTutorial, { hasSeenInboxTutorial } from "@/components/inbox/InboxTutorial";
import InboxMobileTabBar from "@/components/inbox/InboxMobileTabBar";
import TermsAssistantChat from "@/components/inbox/TermsAssistantChat";
import BugReportChat from "@/components/inbox/BugReportChat";
import BugList from "@/components/inbox/bugs/BugList";
import BugDetailPanel from "@/components/inbox/bugs/BugDetailPanel";
import BugSidePanel from "@/components/inbox/bugs/BugSidePanel";
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
  // Events inbox: sort by event date (soonest first). Default ON for every
  // status except "New" (which defaults to submission date, newest first).
  const [sortByEventDate, setSortByEventDate] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [shaking, setShaking] = useState(false);
  const shakeTimer = useRef(null);
  const readTimer = useRef(null);
  const [showContact, setShowContact] = useState(true);
  const [listWidth, setListWidth] = useState(360);
  const [currentUser, setCurrentUser] = useState(null);
  // On mobile/tablet the thread panel is full-screen. Default to showing the
  // conversation LIST on load (panel closed) so users pick a thread first.
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  // Only show the tour once we've confirmed (from the user account) it hasn't
  // been seen — prevents a flash on reload before the user flag loads.
  const [showTutorial, setShowTutorial] = useState(false);
  // Terms + Bug-report chat widgets are triggered from the status rail.
  const [termsOpen, setTermsOpen] = useState(false);
  const [bugChatOpen, setBugChatOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState(null);
  // Active bug-status filter for the rail when the Bugs view is open.
  const [bugStatus, setBugStatus] = useState("New");
  const centerRef = useRef(null);

  // Bugs view is active when the Support inbox "bug" sub-filter is selected.
  const bugMode = !showArchived && view === "support" && subFilter === "bug";

  // Clear the selected bug whenever we leave the Bugs view.
  useEffect(() => { if (!bugMode) setSelectedBug(null); }, [bugMode]);

  const handleListResize = (clientX) => {
    const left = centerRef.current?.getBoundingClientRect().left || 0;
    const w = clientX - left;
    setListWidth(Math.max(240, Math.min(440, w)));
  };

  useEffect(() => {
    base44.auth.me().then((u) => {
      setCurrentUser(u);
      // Show the tour only after confirming it hasn't been seen on the account
      // OR locally — checked here so it never flashes on reload before the
      // account flag loads.
      if (!u?.inbox_tutorial_seen && !hasSeenInboxTutorial()) setShowTutorial(true);
    }).catch(() => {});
  }, []);

  // bugs.* domain (or ?bugchat=1) lands on the Support → Bugs panel with the
  // report-bug live chat already open (as if the + button was pressed).
  // Deferred to the next tick so it runs AFTER the view-change reset effect,
  // which would otherwise clobber the "bug" sub-filter back to the first status.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("bugchat") === "1") {
      setView("support");
      setShowArchived(false);
      setSelected(null);
      setBugChatOpen(true);
      const t = setTimeout(() => setSubFilter("bug"), 0);
      return () => clearTimeout(t);
    }
  }, []);

  // Lock the document scroll while the Inbox is mounted so the whole app feels
  // like a native screen (only inner panels scroll). Restored on unmount.
  useEffect(() => {
    document.documentElement.classList.add("app-locked");
    return () => {
      document.documentElement.classList.remove("app-locked");
      clearTimeout(readTimer.current);
    };
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

  const { data: bugs } = useQuery({
    queryKey: ["bug-reports"],
    queryFn: () => base44.entities.BugReport.list("-bug_number", 500),
    initialData: [],
  });

  useEffect(() => {
    const unsubscribe = base44.entities.BugReport.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["bug-reports"] });
    });
    return unsubscribe;
  }, [qc]);

  // Auto-select & open the first bug of the active status (like Support inbox).
  useEffect(() => {
    if (!bugMode) return;
    const inStatus = bugs.filter((b) => (b.status || "New") === bugStatus);
    if (!inStatus.length) { setSelectedBug(null); return; }
    if (!selectedBug || (selectedBug.status || "New") !== bugStatus) {
      const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
      setSelectedBug(inStatus[0]);
      if (isDesktop) setMobilePanelOpen(true);
    }
  }, [bugMode, bugStatus, bugs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep-link support: /inbox?thread=<id> (e.g. from Contacts page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("thread");
    if (tid && threads.length && !selected) {
      const found = threads.find((t) => t.id === tid);
      // ?assigned=1 (from the assignment email) animates the thread row on open.
      if (found) handleSelect(found, { shake: params.get("assigned") === "1" });
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

  // Events: default sort by event date for every status EXCEPT "New", which
  // defaults to submission date (newest first).
  useEffect(() => {
    if (view === "events") setSortByEventDate(subFilter !== "New");
  }, [view, subFilter]);

  // Distinct inquiry/event types within the current view (for the icon filter).
  // Support filters on inquiry_type; Events filters on event_type.
  const inquiryTypes = useMemo(() => {
    if (view !== "support" && view !== "events") return [];
    const field = view === "events" ? "event_type" : "inquiry_type";
    const set = new Set();
    threads.forEach((t) => {
      if (t.source_app !== view) return;
      const it = t.form_data?.[field] || (view === "events" ? t.form_data?.inquiry_type : null);
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
        // Inquiry/event type filter (Support → inquiry_type, Events → event_type)
        if (view === "support" && inquiryType !== "all" && String(t.form_data?.inquiry_type || "") !== inquiryType) return false;
        if (view === "events" && inquiryType !== "all" && String(t.form_data?.event_type || t.form_data?.inquiry_type || "") !== inquiryType) return false;
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

  // Events inbox: sort by event date (soonest first) when active, otherwise by
  // submission date (newest first). Other views keep the default activity order.
  const sortedFiltered = useMemo(() => {
    if (view !== "events" || showArchived) return filtered;
    if (sortByEventDate) {
      // Soonest upcoming event date first; threads without a date sink to bottom.
      const eventTime = (t) => {
        const raw = t?.form_data?.event_date || t?.form_data?.event_date_iso || t?.form_data?.date;
        const d = raw ? new Date(raw) : null;
        return d && !isNaN(d.getTime()) ? d.getTime() : Infinity;
      };
      return [...filtered].sort((a, b) => eventTime(a) - eventTime(b));
    }
    // Submission date — newest at the top.
    const submitTime = (t) => new Date(t.created_date || t.last_activity_at || 0).getTime();
    return [...filtered].sort((a, b) => submitTime(b) - submitTime(a));
  }, [filtered, view, sortByEventDate, showArchived]);

  // Auto-select the first available conversation when nothing is selected OR
  // when the current selection has dropped out of the filtered list (e.g. after
  // switching to a status that previously had 0 items in this tab).
  useEffect(() => {
    const stillVisible = selected && sortedFiltered.some((t) => t.id === selected.id);
    if (!stillVisible && sortedFiltered.length > 0) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get("thread")) {
        // Auto-select the first thread, but only auto-OPEN the panel on desktop.
        // On mobile/tablet we show the conversation panel (empty state) without
        // forcing the first item open.
        const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
        handleSelect(sortedFiltered[0], { open: isDesktop });
      }
    } else if (selected && sortedFiltered.length === 0) {
      // Empty status: clear the stale selection so the panel shows empty state.
      setSelected(null);
    }
  }, [sortedFiltered, selected]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // When a team inbox status tab has 0 tickets, auto-advance to the next status
  // in the pipeline that actually has tickets (and its 1st ticket auto-selects).
  useEffect(() => {
    if (!isSourceView || showArchived || isLoading) return;
    if (subFilter === "all") return;
    if ((tabCounts[subFilter] || 0) > 0) return;
    const idx = statusOrder.indexOf(subFilter);
    if (idx === -1) return;
    const nextWithItems = statusOrder.slice(idx + 1).find((s) => (tabCounts[s] || 0) > 0);
    if (nextWithItems) {
      setSubFilter(nextWithItems);
      setSelected(null);
    }
  }, [tabCounts, subFilter, isSourceView, showArchived, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bug-ticket status tabs for the rail (shown when the Bugs view is open).
  const BUG_STATUS_ORDER = ["New", "In Progress", "Resolved", "Closed"];
  const BUG_STATUS_LABELS = { "In Progress": "Progress" };
  const bugStatusTabs = BUG_STATUS_ORDER.map((s) => ({ key: s, label: BUG_STATUS_LABELS[s] || s }));
  const bugStatusCounts = useMemo(() => {
    const c = {};
    BUG_STATUS_ORDER.forEach((s) => { c[s] = bugs.filter((b) => (b.status || "New") === s).length; });
    return c;
  }, [bugs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Which status tabs currently have an unread (new) thread — drives the
  // notification dot superscript on the status rail counts.
  const unreadTabs = useMemo(() => {
    const base = threads.filter((t) => {
      if (t.archived) return false;
      if (SOURCE_META[view]) return t.source_app === view;
      return t.status !== "closed";
    });
    const u = {};
    if (isSourceView) {
      statusOrder.forEach((s) => { u[s] = base.some((t) => t.status === s && !t.is_read); });
    } else {
      ["support", "events", "influencer"].forEach((s) => { u[s] = base.some((t) => t.source_app === s && !t.is_read); });
    }
    return u;
  }, [threads, view, isSourceView, statusOrder]);

  const selectedThread = threads.find((t) => t.id === selected?.id) || selected;
  // Keep the open bug in sync with the live query data (so new replies appear).
  const liveBug = bugs.find((b) => b.id === selectedBug?.id) || selectedBug;
  // Bugs view gets its own dark-brown theme; otherwise use the active inbox theme.
  const accent = ((bugMode ? VIEW_THEME.bugs : VIEW_THEME[view]) || VIEW_THEME.events).accent;

  const handleSelect = (t, { open = true, shake = false } = {}) => {
    setSelected(t);
    if (open) setMobilePanelOpen(true);
    if (shake) {
      setShaking(true);
      clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShaking(false), 550);
    }
    // Mark read only after the thread stays open for 5s. Cancel if the user
    // switches away (or marks it unread) before the timer fires.
    clearTimeout(readTimer.current);
    if (!t.is_read) {
      readTimer.current = setTimeout(() => {
        updateThread.mutate({ id: t.id, data: { is_read: true } });
      }, 5000);
    }
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

  const handleAssign = async (email) => {
    if (!selectedThread) return;
    const assignee = staff.find((s) => s.email === email);
    const assigneeName = assignee?.full_name || email;
    const byName = currentUser?.full_name || currentUser?.email || "Staff";
    const nowIso = new Date().toISOString();

    // Log the escalation in the thread's Activity (status_history) — keep the
    // current status, mark the entry as an assignment event.
    const entry = {
      status: selectedThread.status,
      event: "assignment",
      changed_by: currentUser?.email || "staff",
      name: byName,
      note: `Escalated to ${assigneeName}`,
      timestamp: nowIso,
    };
    const newHistory = [...(selectedThread.status_history || []), entry];
    // Optimistically update the cache so the dropdown, "Assigned to" badge and
    // Activity log all reflect the new assignee instantly (no reload needed).
    qc.setQueryData(["threads"], (prev) =>
      (prev || []).map((x) =>
        x.id === selectedThread.id ? { ...x, assignee_email: email, status_history: newHistory } : x
      )
    );
    updateThread.mutate({
      id: selectedThread.id,
      data: { assignee_email: email, status_history: newHistory },
    });

    // Drop an internal "Escalation" email into the thread panel for visibility.
    base44.entities.EmailMessage.create({
      ticket_id: selectedThread.id,
      direction: "outbound",
      is_escalation: true,
      subject: `Escalated to ${assigneeName}`,
      body_html: `<p><strong>${byName}</strong> escalated this conversation to <strong>${assigneeName}</strong>.</p>`,
      from_name: byName,
      sent_by: currentUser?.email || "staff",
      sent_at: nowIso,
      send_status: "sent",
    }).catch(() => {});

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

  // Events "Cancelled" list shows a "Close All" action (moves to Closed).
  const isCancelledView = view === "events" && !showArchived && subFilter === "Cancelled";

  const handleCloseAll = async (toClose, onProgress) => {
    let done = 0;
    for (const t of toClose) {
      const entry = {
        status: "Closed",
        changed_by: currentUser?.email || "staff",
        name: currentUser?.full_name || "",
        note: "Bulk closed from Cancelled",
        timestamp: new Date().toISOString(),
      };
      await base44.entities.Thread.update(t.id, {
        status: "Closed",
        status_history: [...(t.status_history || []), entry],
      });
      qc.setQueryData(["threads"], (prev) =>
        (prev || []).map((x) => (x.id === t.id ? { ...x, status: "Closed" } : x))
      );
      done++;
      onProgress?.(done);
    }
    setSelected(null);
    qc.invalidateQueries({ queryKey: ["threads"] });
  };

  // External "new submission" form URL — only shown on the Open/New status tab.
  const NEW_SUBMISSION_URLS = {
    support: "https://support.pilatesinpinkstudio.com/",
    events: "https://events.pilatesinpinkstudio.com/",
    influencer: "https://partner.pilatesinpinkstudio.com/Influencer",
  };
  const isOpenView = isSourceView && !showArchived &&
    (view === "events" ? subFilter === "New" : subFilter === "open");
  const newUrl = isOpenView ? NEW_SUBMISSION_URLS[view] : undefined;

  return (
    <div className="app-screen flex flex-col overflow-hidden relative">
      {showTutorial && <InboxTutorial onClose={() => setShowTutorial(false)} />}

      {/* Vibrant pink gradient backdrop */}
      <div
        className="absolute inset-0 -z-10 transition-[background] duration-700"
        style={{ background: bugMode ? viewBackdrop("bugs", dark) : viewBackdrop(view, dark) }}
      />

      <InboxTopBar
        view={view} setView={setView} currentUser={currentUser} openCount={openCount} counts={openCounts}
        hideChatWidgets={mobilePanelOpen} bugMode={bugMode}
        onOpenThread={(n) => {
          if (n.source_app && VALID_VIEWS.includes(n.source_app)) setView(n.source_app);
          const t = threads.find((th) => th.id === n.thread_id);
          if (t) handleSelect(t, { shake: true });
        }}
      />

      {/* 3 floating glass panels */}
      <div ref={centerRef} className={`flex-1 flex gap-0 p-3 md:p-4 overflow-hidden ${mobilePanelOpen ? "" : "pb-20 lg:pb-4"}`}>
        {/* Thread list (resizable) — full-screen on mobile until a thread is opened */}
        <div
          className={`${mobilePanelOpen ? "hidden md:flex" : "flex"} h-full overflow-hidden flex-row rounded-3xl bg-white/45 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 shadow-2xl shadow-black/20 shrink-0`}
          style={{ width: bugMode && selectedBug ? 440 : (selectedThread || (bugMode && selectedBug)) ? listWidth : undefined, flex: (selectedThread || (bugMode && selectedBug)) ? undefined : "1 1 100%" }}
        >
          {/* Vertical status rail (side panels) */}
          {bugMode ? (
            <InboxStatusRail
              tabs={bugStatusTabs}
              active={bugStatus}
              onChange={(k) => { setBugStatus(k); setSelectedBug(null); }}
              counts={bugStatusCounts} accent={accent}
              onTerms={() => setTermsOpen(true)}
              onReportBug={() => {
                setShowArchived(false);
                setView("support");
                setSubFilter("bug");
                setSelected(null);
              }}
              bugActive={bugMode}
              bugCount={bugs.length}
            />
          ) : activeTabs && (
            <InboxStatusRail
              tabs={activeTabs}
              active={subFilter}
              onChange={(k) => { setShowArchived(false); setSubFilter(k); setSelected(null); }}
              counts={tabCounts} unread={unreadTabs} accent={accent}
              archivedActive={showArchived}
              onArchived={isSourceView ? () => { setShowArchived((s) => !s); setSelected(null); } : undefined}
              onTerms={() => setTermsOpen(true)}
              onReportBug={() => {
                // Open the Bugs thread list (Support → bug status). The live chat
                // only opens via the + button inside the Bugs list.
                setShowArchived(false);
                setView("support");
                setSubFilter("bug");
                setSelected(null);
                // First bug of the active status is auto-selected by effect.
              }}
              bugActive={bugMode}
              bugCount={bugs.length}
            />
          )}
          <div className="flex-1 overflow-hidden">
            {bugMode ? (
              <BugList
                bugs={bugs}
                statusFilter={bugStatus}
                selectedBug={selectedBug}
                onSelect={(b) => { setSelectedBug(b); setMobilePanelOpen(true); }}
                onReportBug={() => setBugChatOpen(true)}
              />
            ) : (
            <ThreadList
              threads={sortedFiltered}
              grouped={showArchived}
              title={showArchived ? "Archived" : title}
              count={sortedFiltered.length}
              search={search} setSearch={setSearch}
              selectedId={selectedThread?.id} onSelect={handleSelect} loading={isLoading}
              newUrl={newUrl}
              filterSlot={
                <>
                  {isClosedView && <ArchiveButton threads={sortedFiltered} onArchive={handleArchive} />}
                  {isCancelledView && <CloseAllButton threads={sortedFiltered} onCloseAll={handleCloseAll} />}
                  {view === "events" && !showArchived && (
                    <EventSortMenu sortByEventDate={sortByEventDate} onChange={setSortByEventDate} />
                  )}
                  {(view === "support" || view === "events") && !showArchived && inquiryTypes.length > 0 ? (
                    <InquiryTypeFilter types={inquiryTypes} value={inquiryType} onChange={setInquiryType} />
                  ) : null}
                </>
              }
            />
            )}
          </div>
        </div>

        {/* Resize grabber — desktop split view only (component is hidden on mobile) */}
        {(selectedThread || (bugMode && selectedBug)) && <ResizeHandle onDrag={handleListResize} />}

        {/* Center: thread panel — full-screen on mobile only when opened */}
        <div
          className={`${mobilePanelOpen ? "flex flex-col flex-1" : "hidden md:flex md:flex-col md:flex-1"} h-full overflow-hidden min-w-0 rounded-3xl bg-white/45 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 shadow-2xl shadow-black/20`}
        >
          {bugMode ? (
            liveBug ? (
              <BugDetailPanel
                key={liveBug.id}
                bug={liveBug}
                currentUser={currentUser}
                onReplied={() => qc.invalidateQueries({ queryKey: ["bug-reports"] })}
                onBack={() => setMobilePanelOpen(false)}
              />
            ) : (
              <EmptyThreadState accent={accent} onReportBug={() => setBugChatOpen(true)} />
            )
          ) : selectedThread ? (
            <ThreadPanel
              key={selectedThread.id}
              shakeKey={shaking}
              thread={selectedThread} staff={staff} currentUser={currentUser}
              onStatusChange={handleStatus} onAssign={handleAssign}
              onSelectThread={(t) => handleSelect(t)}
              onBack={() => setMobilePanelOpen(false)}
            />
          ) : (
            <EmptyThreadState
              accent={accent}
              onReportBug={() => {
                setShowArchived(false);
                setView("support");
                setSubFilter("bug");
                setSelected(null);
                setBugChatOpen(true);
              }}
            />
          )}
        </div>

        {/* Transparent hover line to collapse/expand the detail panel (desktop) */}
        <DetailToggleHandle open={showContact} onToggle={() => setShowContact((s) => !s)} />

        {/* Right: bug detail panel — 3rd column for the Bugs view */}
        {bugMode && liveBug && showContact && (
          <div className="hidden lg:block lg:w-[320px] lg:shrink-0 h-full overflow-hidden">
            <div className="h-full rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-white/50 dark:border-white/15 shadow-2xl shadow-black/20 overflow-hidden">
              <BugSidePanel
                key={liveBug.id}
                bug={liveBug}
                onUpdated={() => qc.invalidateQueries({ queryKey: ["bug-reports"] })}
                onClose={() => setShowContact(false)}
              />
            </div>
          </div>
        )}

        {/* Right: contact panel — desktop-only sidebar (never overlays mobile/tablet) */}
        {!bugMode && selectedThread && showContact && (
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

      {/* Mobile/tablet bottom tab bar — hidden when a conversation is open */}
      {!mobilePanelOpen && (
        <InboxMobileTabBar
          currentUser={currentUser}
          onOpenThread={(n) => {
            if (n.source_app && VALID_VIEWS.includes(n.source_app)) setView(n.source_app);
            const t = threads.find((th) => th.id === n.thread_id);
            if (t) handleSelect(t, { shake: true });
          }}
        />
      )}

      {/* Live-chat widgets — triggered from the status rail / Bugs panel (+).
          Floating buttons are hidden; the rail controls open/close. */}
      <TermsAssistantChat accent={accent} open={termsOpen} onOpenChange={setTermsOpen} hideFloatingButton />
      <BugReportChat currentUser={currentUser} accent={accent} open={bugChatOpen} onOpenChange={setBugChatOpen} hideFloatingButton />
    </div>
  );
}