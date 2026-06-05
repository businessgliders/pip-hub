# PiP Hub

Internal hub app for **Pilates in Pink**. Two purposes:

1. **Component library / pattern source** for the three spoke apps:
   - **PiP-Support** — support ticket triage (https://github.com/businessgliders/pip-support)
   - **PiP-Events** — event inquiries
   - **PiP-Partner** — franchise / instructor / front-desk / influencer applications
2. **Operational dashboard** — AppHub launcher, end-of-day reports, announcements, widgets for the front-desk team.

> ⚠️ Read this before doing any work on this app. The headline mission is the **Master Kanban set** (below). Email routing is a secondary side-feature.

---

## 🎯 The Headline Project: Master Kanban Set

The Hub owns the **canonical implementation** of the reusable kanban UI used across all three spoke apps. The spokes consume it so they all look and behave identically, and improvements made here propagate downstream.

```
   PiP-Hub (THIS app)
   ┌───────────────────────────────┐
   │  Master Kanban Set            │  ← Source of truth
   │  components/master-kanban/    │     designed & tested here
   └────────────┬──────────────────┘
                │ exported / copied to
   ┌────────────┼────────────┐
   ▼            ▼            ▼
PiP-Support  PiP-Events  PiP-Partner
```

### Components (in `components/master-kanban/`)

| Component | Purpose |
|---|---|
| `MasterKanbanBoard` | Top-level orchestrator. Wraps columns in a `DragDropContext`, adds the gold-standard horizontal scroll arrows. |
| `MasterKanbanColumn` | One column. Presentational: takes `colorClasses` / `headerClasses` from the parent. Supports optional bulk actions (Tidy Up, Clean, Archive All). Portals the dragged card to `document.body` so it escapes blurred / clipped ancestors. |
| `MasterKanbanCard` | Dumb card shell. Spoke renders the body via `renderContent(ticket)`. Provides drag styling, highlight glow, unread badge. |
| `MasterBoardTabs` | Generic board-type switcher (mirrors pip-partner's 4-board pattern). Supports per-user access via `allowedKeys`. |
| `MasterSwimlaneScroller` | Inline horizontal scroller for sub-rows inside a column. |
| `useHorizontalScroll` (hook, `hooks/useHorizontalScroll.js`) | Shared scroll-arrow visibility + step-scrolling logic. |

### Design rules

- **Theming is owned by the parent.** Master components never hard-code statuses or colors. The spoke passes `colorClasses` / `headerClasses` per column.
- **Card content is owned by the parent.** Pass `renderCardContent(ticket)`. The card just provides chrome.
- **Drag-end is owned by the parent.** Standard `@hello-pangea/dnd` `onDragEnd(result)` handler.
- **Per-user access is owned by the parent.** Pass `allowedKeys` to `MasterBoardTabs`.
- **Bulk actions are opt-in.** `getActions(status)` returns `{ onTidyUp?, onArchiveSome?, onArchiveAll? }` — hidden unless provided.

### Demo / sandbox

Route: `/master-kanban-demo` → `pages/MasterKanbanDemo.jsx`

Mirrors pip-partner's 4-board pattern (Franchise / Instructor / Front Desk / Influencer) with fake data. Toggle "Admin view" to see how `allowedKeys` filters tabs.

---

## 📦 Spoke App Reality (audited 2026-06-05)

**All 3 spokes have self-sufficient ticket boards + Gmail integration.** The Master Kanban does NOT introduce new functionality — it consolidates duplicated UI primitives. Audit of `src/components/` in each repo:

### File-level drift across spokes

| Concept | pip-support | pip-events | pip-partner |
|---|---|---|---|
| **Kanban column** | `support/KanbanColumn.jsx` | `board/KanbanColumn.jsx` | `board/KanbanColumn.jsx` |
| **Ticket card** | (inline / mixed) | `board/TicketCard.jsx` | `board/TicketCard.jsx` |
| **Archived tickets list** | `support/ArchivedTicketsList.jsx` | `board/ArchivedTicketsList.jsx` | `board/ArchivedTicketsList.jsx` |
| **Cleanup row** | `support/CleanupTicketRow.jsx` | — | `board/CleanupTicketRow.jsx` |
| **Resolved cleanup popup** | `support/ResolvedCleanupPopup.jsx` | — | `board/ResolvedCleanupPopup.jsx` |
| **Swimlane / sub-row scroller** | `support/EscalationSwimlane.jsx` | — | `board/SwimlaneScroller.jsx` |
| **Side panel** | — | `board/HostedSidePanel.jsx` | `board/ClosedSidePanel.jsx` |
| **Multi-board config** | — | — | `board/boardConfig.jsx` (4 boards) |

Same purpose, same file names in two spokes, **three different implementations**. Every bug fixed in one is fixed three times.

### Spoke-specific code (stays in the spoke)

| Spoke | Spoke-only files |
|---|---|
| pip-support | `BugReportChat`, `BugReportIssueList`, `BugReportReplyComposer`, `NotificationCenter`, `NotificationRow`, `MobileTabBar`, `MobileUserFilter`, `FloatingUserFilter`, `CancellationFlow`, `ChangelogPopup`, `ReplyBubble` |
| pip-events | `AddonLegend`, `StatusChangeDialog`, `HostedSidePanel` |
| pip-partner | `MapView`, `FddCountdownPill`, `ProgramDock`, `BoardDialogs`, `landMask`, `tableColumns`, `boardConfig` |

### Email infrastructure — each spoke has its own
- **pip-support:** `ingestGmailReply`, `pollGmailReplies`, `sendTicketEmail`, `[Ticket #xxxxx]` tag matching → confirmed self-sufficient
- **pip-events:** has its own `email/` components folder
- **pip-partner:** has its own `email/` components folder

→ **Hub's email routing is therefore redundant for support.** It may still be useful for unrouted/catch-all addresses, but it does NOT replace any spoke's pipeline.

---

## 🎯 Tiered Scope for the Master Kanban Set

| Tier | Scope | Components |
|---|---|---|
| **T1 — Universal** (all 3 spokes have it, must consolidate) | `MasterKanbanBoard`, `MasterKanbanColumn`, `MasterKanbanCard`, `useHorizontalScroll` | ✅ already in `components/master-kanban/` |
| **T2 — Common** (2 of 3 spokes) | `MasterArchivedTicketsList`, `MasterCleanupTicketRow`, `MasterResolvedCleanupPopup`, `MasterSwimlaneScroller` | ⚠️ `SwimlaneScroller` done. Others TBD. |
| **T3 — Multi-board pattern** (pip-partner only today, but Master-ready) | `MasterBoardTabs` | ✅ done |
| **T4 — Spoke-specific** (stays in spoke) | All bug-report / notification / map / FDD / addon-legend code | ❌ never moves |

---

## 🚚 How Spokes Consume the Master Kanban

**Recommendation: start with manual copy-paste, graduate to npm only if pain is real.**

- **A) Manual copy-paste** ← current path. Each spoke copies `components/master-kanban/` + `hooks/useHorizontalScroll.js` from this repo. Stamp every copy with a `MASTER_KANBAN_VERSION` constant so we can trace which version each spoke has.
- **B) Published npm package** `@pip/master-kanban` — only if the same bug ends up fixed in 3 places too often.
- **C) Scripted git sync** — middle ground, but custom tooling adds its own bugs. Skip for now.

### Manual sync procedure (when ready to port)

1. In Hub: bump `MASTER_KANBAN_VERSION` in `components/master-kanban/index.js`.
2. In target spoke: copy `components/master-kanban/*` → `src/components/master-kanban/` and `hooks/useHorizontalScroll.js` → `src/hooks/`.
3. In the spoke, rewrite the local `KanbanColumn.jsx` / `TicketCard.jsx` callsite to use `MasterKanbanBoard` + `renderCardContent` instead.
4. Delete the spoke's now-replaced primitives (`KanbanColumn`, `TicketCard`, etc.).
5. Record sync in the spoke's README: "Master Kanban v0.X.Y synced YYYY-MM-DD from pip-hub@<commit>".

---

## 📧 Email Routing (Secondary Feature)

The Hub has its own Gmail webhook + routing setup, separate from the Master Kanban work:

- Entities: `IncomingEmail`, `EmailRoute`
- Function: `gmailInboxWebhook` — Gmail Pub/Sub webhook, decodes message, matches recipient to an `EmailRoute`, stores as `IncomingEmail` with a `spoke_key`
- UI: `/support` page (`pages/SupportInbox.jsx`) — admin inbox view for emails routed to `spoke_key = "support"`
- Reply function: `sendSupportReply` — sends a threaded Gmail reply from the inbox UI
- Diagnostic: `gmailDiagnostic` — admin-only Gmail connection test

**Status:** webhook delivery currently broken (Pub/Sub side, awaiting Base44 support ticket). The routing rules and storage logic are confirmed correct.

**Open question:** Since PiP-Support already has its own email pipeline, the Hub's email routing is most useful for the OTHER spokes (Events, Partner) that don't yet have email infra. May want to remove `support@` from `EmailRoute` so the Hub stops claiming those.

---

## 🛠️ Other Hub Features

- **AppHub** (`/`, `pages/AppHub.jsx`) — main launcher with sections, apps, favorites, widgets, drag-and-drop personalization
- **SplitView** (`/splitview`) — dual-pane workspace with AppHub on the left and an iframe browser on the right
- **End-of-Day** (`/end-of-day`) — shift report calendar
- **Shift reports** — `ShiftReport` entity + `sendEndOfDayReport` function for branded daily HTML email
- **Announcements** — `Announcement` entity, banner slider widget
- **Widgets** — clock, calculator, sticky notes, agenda, tasks, weather

---

## 🗂️ Key Files Reference

```
App.jsx                              # Router. NEW pages need explicit <Route> elements.
pages.config.js                      # NO LONGER auto-generated. Old pages live here; new ones go in App.jsx.
index.css                            # Design tokens (shadcn defaults).
tailwind.config.js                   # Tailwind theme config.

components/master-kanban/            # ★ THE HEADLINE PROJECT ★
hooks/useHorizontalScroll.js         # Used by Master Kanban.

pages/MasterKanbanDemo.jsx           # /master-kanban-demo — visual sandbox
pages/SupportInbox.jsx               # /support — email routing inbox (secondary)
pages/AppHub.jsx                     # / — main launcher
pages/SplitView.jsx                  # /splitview
pages/EndOfDayCalendar.jsx           # /end-of-day

entities/IncomingEmail.json          # Email routing (admin-only RLS)
entities/EmailRoute.json             # Email routing rules
entities/ShiftReport.json
entities/App.json, Section.json      # AppHub launcher
entities/Announcement.json
entities/UserAppPreference.json, UserSectionPreference.json, HiddenApp.json, UserWidget.json

functions/gmailInboxWebhook.js       # Gmail Pub/Sub webhook → IncomingEmail
functions/sendSupportReply.js        # Threaded Gmail reply from /support inbox
functions/gmailDiagnostic.js         # Admin-only Gmail connection test
functions/sendEndOfDayReport.js      # End-of-day HTML email
functions/getTodayAgenda.js          # Calendar widget
functions/getAllUsers.js, validateUserPassword.js
```

---

## 🔍 Code-Level Audit (read each spoke's `KanbanColumn.jsx` + `TicketCard.jsx` — 2026-06-05)

### What the 3 spokes share (architecture is consistent ✅)
- `@hello-pangea/dnd` Droppable/Draggable
- Dragged card portaled to `document.body` (escapes blurred/clipped ancestors)
- `columnColors` + `headerColors` lookup keyed by status name
- Optional `onTidyUp` / `onArchiveSome` / `onArchiveAll` action buttons
- Skeleton loader when `isLoading`, empty-state text otherwise

### Where they drift
| Concern | pip-support | pip-events | pip-partner |
|---|---|---|---|
| Status casing | `"New"` Title Case | `"New"` Title Case | `"new"` lowercase |
| Touch-viewport DnD disabling | ❌ | ❌ | ✅ `useIsTouchViewport` |
| Status meta (label + description tooltip) | ❌ | ❌ | ✅ `getStatusMeta(boardKey, key)` |
| `boardKey` (multi-board) | ❌ | ❌ | ✅ |
| `allUsers` prop | ✅ | ❌ | ❌ |
| Buttons shown on which statuses | Resolved + Closed | Closed only | per status key |

**pip-partner's column is the most sophisticated.** pip-support and pip-events are simpler. Hub's current `MasterKanbanColumn` is close to pip-events/pip-support level.

### Card drift is huge (and that's fine)
`TicketCard.jsx` is wildly different across spokes — each knows its domain (event_date, FDD countdown, scheduled_call_time, instagram_handle, etc.). **This is exactly why `renderCardContent(ticket)` is the right API.** The Master card stays dumb; each spoke renders its own body. ✅ Already done.

### Gaps closed for v0.1.0 ✅
1. ✅ **Touch-viewport DnD disabling** — added `useIsTouchViewport` hook (`hooks/useIsTouchViewport.js`). `MasterKanbanColumn` now disables drag below 1024px so touch scroll/swipe works.
2. ✅ **Per-column description** — `MasterKanbanColumn` accepts an optional `description` prop; renders as a small subtitle under the title. Column configs passed to `MasterKanbanBoard` can include `description`.
3. ✅ **Version stamped** — `MASTER_KANBAN_VERSION = "0.1.0"` exported from `components/master-kanban/index.js`. Spokes should record which version they have synced.

---

## ✅ Open TODOs

1. ~~Decide distribution mechanism~~ → **Manual copy-paste** with `MASTER_KANBAN_VERSION` stamping.
2. ~~Inspect pip-events / pip-partner repos~~ → **Done.** File map + drift findings above.
3. ~~Audit Master Kanban API surface~~ → **Done.** Two gaps identified.
4. ~~Close the two API gaps~~ → **Done. Master Kanban v0.1.0 shipped.**
5. ~~Add `MASTER_KANBAN_VERSION`~~ → **Done.** Exported from `components/master-kanban/index.js`.
6. **Port to pip-events as proof of concept** (smallest surface: 6 files). ← NEXT
7. **Decide email routing scope** — Hub probably stops routing `support@` since PiP-Support handles it. Keep for `events@` / `partner@` / catch-all.
8. **Resolve Gmail Pub/Sub webhook delivery issue** (Base44 support ticket open).