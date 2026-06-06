# PiP Hub

Internal hub app for **Pilates in Pink**. Two purposes:

1. **Shared UI / pattern library** for the three spoke apps:
   - **PiP-Support** — support ticket triage (https://github.com/businessgliders/pip-support)
   - **PiP-Events** — event inquiries
   - **PiP-Partner** — franchise / instructor / front-desk / influencer applications
2. **Operational dashboard** — AppHub launcher, end-of-day reports, announcements, widgets for the front-desk team.

> ⚠️ **Scope decision (2026-06-05):** Hub is **NOT** a centralized backend. It does not route Gmail, does not own ticket entities, does not handle spoke business logic. Each spoke owns its own email pipeline, its own entities, its own integrations. Hub provides **reusable UI primitives** (Master Kanban, etc.) and the **operational dashboard**. That's it.

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

**Current version: `v0.1.2`** (exported as `MASTER_KANBAN_VERSION` from `components/master-kanban/index.jsx`).

> **v0.1.2 (2026-06-06)** — Theme-able columns & cards. Originated in pip-partner (dark glassmorphic Influencer board) and back-ported here. `MasterKanbanColumn` gains optional `shellClasses` / `listClasses` / `titleClasses` / `countBadgeClasses` / `descriptionClasses` / `emptyClasses` overrides, all defaulting to the previous hard-coded values. New `bareCard` prop (on both column + card) skips the default white chrome so a spoke's `renderContent` can supply a fully-styled card without doubling up backgrounds. Dragged item now gets inline `z-index: 9999`; card wrapper always carries `rounded-xl` so the highlight ring follows on bare cards; unread badge bumped to `z-10`. **Fully back-compatible** — no callsite changes required. **Sync 3 files to each spoke:** `components/master-kanban/MasterKanbanColumn.jsx`, `components/master-kanban/MasterKanbanCard.jsx`, and `components/master-kanban/index.jsx`.

> **v0.1.1 patch (2026-06-06)** — Touch drag re-enabled. v0.1.0's `useIsTouchViewport` + `isDragDisabled` gate broke mobile/tablet drag everywhere. `MasterKanbanColumn` no longer touches the touch gate — drag now works on all viewports (matches pip-support's working pattern; the portal-to-body trick handles pointer alignment).

> 📌 **Barrel filename:** the Master Kanban barrel file is `index.jsx` (NOT `index.js`). Use the `.jsx` extension in any raw GitHub URL or sync command, otherwise the fetch will 404.

### Components (in `components/master-kanban/`)

| Component | Purpose |
|---|---|
| `MasterKanbanBoard` | Top-level orchestrator. Wraps columns in a `DragDropContext`, adds the gold-standard horizontal scroll arrows. |
| `MasterKanbanColumn` | One column. Presentational: takes `colorClasses` / `headerClasses` from the parent. Supports optional bulk actions (Tidy Up, Clean, Archive All). Portals the dragged card to `document.body` so it escapes blurred / clipped ancestors. Drag is enabled on all viewports (touch included). |
| `MasterKanbanCard` | Dumb card shell. Spoke renders the body via `renderContent(ticket)`. Provides drag styling (border tinted to source column), highlight glow, unread badge. |
| `MasterBoardTabs` | Generic board-type switcher (mirrors pip-partner's 4-board pattern). Supports per-user access via `allowedKeys`. |
| `MasterSwimlaneScroller` | Inline horizontal scroller for sub-rows inside a column. |
| `useHorizontalScroll` (hook, `hooks/useHorizontalScroll.js`) | Shared scroll-arrow visibility + step-scrolling logic. |
| `useIsTouchViewport` (hook, `hooks/useIsTouchViewport.js`) | Reports when viewport is touch-sized. No longer used by `MasterKanbanColumn` (v0.1.1+), but still exported for spokes that want it for other purposes. |

### Design rules

- **Theming is owned by the parent.** Master components never hard-code statuses or colors. The spoke passes `colorClasses` / `headerClasses` per column.
- **Card content is owned by the parent.** Pass `renderCardContent(ticket)`. The card just provides chrome.
- **Drag-end is owned by the parent.** Standard `@hello-pangea/dnd` `onDragEnd(result)` handler.
- **Per-user access is owned by the parent.** Pass `allowedKeys` to `MasterBoardTabs`.
- **Bulk actions are opt-in.** `getActions(status)` returns `{ onTidyUp?, onArchiveSome?, onArchiveAll? }` — hidden unless provided.
- **Per-column descriptions are opt-in.** Pass `description` on a column config; rendered as a subtitle under the title.

### Demo / sandbox

Route: `/master-kanban-demo` → `pages/MasterKanbanDemo.jsx`

Mirrors pip-partner's 4-board pattern (Franchise / Instructor / Front Desk / Influencer) with fake data. Toggle "Admin view" to see how `allowedKeys` filters tabs.

---

## 📦 Spoke App Reality (audited 2026-06-05)

**All 3 spokes have self-sufficient ticket boards + Gmail integration.** Master Kanban does NOT introduce new functionality — it consolidates duplicated UI primitives. Audit of `src/components/` in each repo:

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

Same purpose, same file names in two spokes, **three different implementations**. Every bug fixed in one is fixed three times. The Master Kanban set fixes that.

### Spoke-specific code (stays in the spoke, never moves to Hub)

| Spoke | Spoke-only files |
|---|---|
| pip-support | `BugReportChat`, `BugReportIssueList`, `BugReportReplyComposer`, `NotificationCenter`, `NotificationRow`, `MobileTabBar`, `MobileUserFilter`, `FloatingUserFilter`, `CancellationFlow`, `ChangelogPopup`, `ReplyBubble` |
| pip-events | `AddonLegend`, `StatusChangeDialog`, `HostedSidePanel` |
| pip-partner | `MapView`, `FddCountdownPill`, `ProgramDock`, `BoardDialogs`, `landMask`, `tableColumns`, `boardConfig` |

### Email infrastructure — each spoke owns its own
- **pip-support:** `ingestGmailReply`, `pollGmailReplies`, `sendTicketEmail`, `[Ticket #xxxxx]` tag matching
- **pip-events:** has its own `email/` components folder
- **pip-partner:** has its own `email/` components folder

→ **Hub does NOT centralize Gmail.** See "Archived: Email Routing" below.

---

## 🎯 Tiered Scope for the Master Kanban Set

| Tier | Scope | Components |
|---|---|---|
| **T1 — Universal** (all 3 spokes have it, must consolidate) | `MasterKanbanBoard`, `MasterKanbanColumn`, `MasterKanbanCard`, `useHorizontalScroll`, `useIsTouchViewport` | ✅ shipped in v0.1.0 |
| **T2 — Common** (2 of 3 spokes) | `MasterArchivedTicketsList`, `MasterCleanupTicketRow`, `MasterResolvedCleanupPopup`, `MasterSwimlaneScroller` | ⚠️ `SwimlaneScroller` done. Others TBD. |
| **T3 — Multi-board pattern** (pip-partner only today, but Master-ready) | `MasterBoardTabs` | ✅ done |
| **T4 — Spoke-specific** (stays in spoke) | All bug-report / notification / map / FDD / addon-legend code | ❌ never moves |

---

## 🚚 How Spokes Consume the Master Kanban

**Manual copy-paste, with version stamping.**

- **A) Manual copy-paste** ← current path. Each spoke copies `components/master-kanban/` + `hooks/useHorizontalScroll.js` + `hooks/useIsTouchViewport.js` from this repo. Stamp every copy with the `MASTER_KANBAN_VERSION` constant so we can trace which version each spoke has.
- **B) Published npm package** `@pip/master-kanban` — only if the same bug ends up fixed in 3 places too often.
- **C) Scripted git sync** — middle ground, but custom tooling adds its own bugs. Skip for now.

### Manual sync procedure (when ready to port)

1. In Hub: bump `MASTER_KANBAN_VERSION` in `components/master-kanban/index.jsx`.
2. In target spoke: copy `components/master-kanban/*` → `src/components/master-kanban/` and `hooks/useHorizontalScroll.js` + `hooks/useIsTouchViewport.js` → `src/hooks/`.
3. In the spoke, rewrite the local `KanbanColumn.jsx` / `TicketCard.jsx` callsite to use `MasterKanbanBoard` + `renderCardContent` instead.
4. Delete the spoke's now-replaced primitives (`KanbanColumn`, `TicketCard`, etc.).
5. Record sync in the spoke's README: "Master Kanban v0.X.Y synced YYYY-MM-DD from pip-hub@<commit>".

---

## 🛠️ Operational Dashboard Features

Hub also serves as the front-desk launcher and shift management tool:

- **AppHub** (`/`, `pages/AppHub.jsx`) — main launcher with sections, apps, favorites, widgets, drag-and-drop personalization
- **SplitView** (`/splitview`) — dual-pane workspace with AppHub on the left and an iframe browser on the right
- **End-of-Day** (`/end-of-day`) — shift report calendar
- **Shift reports** — `ShiftReport` entity + `sendEndOfDayReport` function for branded daily HTML email (uses Gmail connector)
- **Announcements** — `Announcement` entity, banner slider widget
- **Widgets** — clock, calculator, sticky notes, agenda (Google Calendar), tasks, weather

---

## 🗂️ Key Files Reference

```
App.jsx                              # Router. NEW pages need explicit <Route> elements.
pages.config.js                      # NO LONGER auto-generated. Old pages live here; new ones go in App.jsx.
index.css                            # Design tokens (shadcn defaults).
tailwind.config.js                   # Tailwind theme config.

components/master-kanban/            # ★ THE HEADLINE PROJECT ★
hooks/useHorizontalScroll.js         # Used by Master Kanban.
hooks/useIsTouchViewport.js          # Used by Master Kanban.

pages/MasterKanbanDemo.jsx           # /master-kanban-demo — visual sandbox
pages/AppHub.jsx                     # / — main launcher
pages/SplitView.jsx                  # /splitview
pages/EndOfDayCalendar.jsx           # /end-of-day

entities/ShiftReport.json
entities/App.json, Section.json      # AppHub launcher
entities/Announcement.json
entities/UserAppPreference.json, UserSectionPreference.json, HiddenApp.json, UserWidget.json

functions/sendEndOfDayReport.js      # End-of-day HTML email (uses Gmail connector)
functions/getTodayAgenda.js          # Calendar widget (uses Google Calendar connector)
functions/getAllUsers.js, validateUserPassword.js
```

---

## 🗄️ Archived: Email Routing

Hub previously had a centralized Gmail webhook + routing system to dispatch incoming mail to the correct spoke. **Decommissioned 2026-06-05** — each spoke owns its own email pipeline (pip-support already does; pip-events and pip-partner have their own `email/` folders).

The route and import are unhooked in `App.jsx`, but the files remain in place for reference:

```
pages/SupportInbox.jsx                # /support page (route removed)
components/support/EmailDetail.jsx
components/support/EmailListItem.jsx
functions/gmailInboxWebhook.js        # Gmail Pub/Sub webhook
functions/sendSupportReply.js         # Threaded Gmail reply
functions/gmailDiagnostic.js          # Admin-only Gmail connection test
entities/IncomingEmail.json
entities/EmailRoute.json
```

The Gmail connector itself is **kept authorized** because `sendEndOfDayReport` still uses it to send shift reports.

If we ever revive a Hub-level inbox (e.g. for unrouted catch-all addresses), re-add the import and `<Route path="/support" .../>` to `App.jsx`.

---

## ✅ Open TODOs

1. ~~Decide distribution mechanism~~ → **Manual copy-paste** with `MASTER_KANBAN_VERSION` stamping.
2. ~~Inspect pip-events / pip-partner repos~~ → **Done.** File map + drift findings above.
3. ~~Audit Master Kanban API surface~~ → **Done.** v0.1.0 closes all known T1 gaps.
4. ~~Decide email routing scope~~ → **Done.** Hub drops email centralization (2026-06-05). Files archived in place.
5. ~~Port to pip-events as proof of concept~~ → **Done.** v0.1.0 synced to pip-events (8 files); v0.1.1 patch (2 files) ready to push.
6. **Sync v0.1.1 to pip-partner + pip-support** when they're ported (mobile drag fix).
7. **T2 components** — port `MasterArchivedTicketsList`, `MasterCleanupTicketRow`, `MasterResolvedCleanupPopup` after pip-partner migration confirms shared API shape.