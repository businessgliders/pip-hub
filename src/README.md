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

## 🚚 How Spokes Consume the Master Kanban

**(Open question — see TODO at bottom.)** Current candidates:

- **A) Manual copy-paste** — each spoke copies `components/master-kanban/` + `hooks/useHorizontalScroll.js` from this repo. Simple, but drifts over time.
- **B) Published npm package** — `@pip/master-kanban`. Cleanest, but adds publish/version overhead.
- **C) Git submodule or scripted sync** — pull from this repo at build time.

The current state is **(A) implicit copy-paste**. pip-partner already has its own version of these components; the Hub's are a refined/generalized derivation that pip-partner, pip-support, and pip-events should eventually adopt.

---

## 📦 Spoke App Snapshots (as of 2026-06-05)

### PiP-Support — self-sufficient email pipeline
- Entities: `SupportTicket`, `EmailMessage`, `EmailTemplate`, `BugReport`, `BackupSettings`
- Pages: `IntakeForm`, `TicketBoard`, `Analytics`, `Templates`, `ReportBug`, `SignatureSettings`, `AdminSettingsPage`, `Settings`
- Functions: `ingestGmailReply`, `pollGmailReplies`, `sendTicketEmail`, `sendWelcomeEmail`, `sendAssignmentEmail`, `assignTicketNumber`, `aiEmailAssist`, `askTerms`, `renumberTickets`, `runBackup`, `sendBugReport`, `sendBugReportReply`, `sendDailyReminders`, `debugBugReplies`, `getUsersForSelection`
- Public form: https://support.pilatesinpinkstudio.com/ → creates `SupportTicket`, assigns 5-digit number, sends branded welcome email with `[Ticket #xxxxx]` subject tag
- Reply flow: client replies to `[Ticket #xxxxx]` → `pollGmailReplies` / `ingestGmailReply` matches the tag → creates `EmailMessage` attached to the ticket
- **Bottom line: PiP-Support does NOT need the Hub for email.** It has its own complete pipeline.

### PiP-Events — TBD (repo not yet inspected)
### PiP-Partner — TBD (repo not yet inspected; demo mirrors its 4-board pattern)

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

## ✅ Open TODOs

1. **Decide Master Kanban distribution mechanism** (A / B / C above) and document it here.
2. **Inspect pip-events and pip-partner repos** — confirm whether they have their own email infra and how their existing kanbans compare to the Master Kanban set.
3. **Audit Master Kanban API surface** — is it final? Any rough edges before declaring "ready for spokes"?
4. **Decide email routing scope** — should the Hub stop routing `support@` (since PiP-Support handles it) and focus on `events@` / `partner@` / `frontdesk@` / `franchise@` / `instructors@` / `influencers@`?
5. **Resolve Gmail Pub/Sub webhook delivery issue** (Base44 support ticket open).