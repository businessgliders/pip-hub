import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MasterKanbanBoard,
  MasterBoardTabs,
  MasterSwimlaneScroller,
} from "@/components/master-kanban";

/**
 * MasterKanbanDemo — visual sandbox for the Master Kanban set.
 *
 * Mirrors pip-partner's 4-board pattern (Franchise / Instructor / Front Desk /
 * Influencer) with fake data, so we can sanity-check the components before
 * wiring them into spoke apps.
 *
 * Also demonstrates per-user board access: toggle the "Admin view" switch to
 * see how `allowedKeys` filters the visible tabs.
 */

// --- Fake board configs (mirrors pip-partner/boardConfig.jsx) ---
const BOARDS = [
  {
    key: "franchise",
    label: "Franchise",
    color: "#b67651",
    bg: "#fbe0e2",
    statuses: ["new", "scheduled", "discussion", "qualified", "training", "closed"],
  },
  {
    key: "instructor",
    label: "Instructor",
    color: "#c4896b",
    bg: "#f6eee7",
    statuses: ["pending", "reviewed", "invited", "declined"],
  },
  {
    key: "frontadmin",
    label: "Front Desk",
    color: "#d4a088",
    bg: "#faf3ec",
    statuses: ["pending", "reviewed", "invited", "declined"],
  },
  {
    key: "influencer",
    label: "Influencer",
    color: "#f1889b",
    bg: "#fce8ee",
    statuses: ["pending", "approved", "declined"],
  },
];

// Per-status color palettes (parent owns these, not the component)
const COLOR_THEMES = {
  new:        { col: "from-pink-100 to-pink-50 border-pink-200",      head: "bg-pink-200/60 border-pink-300/60" },
  pending:    { col: "from-pink-100 to-pink-50 border-pink-200",      head: "bg-pink-200/60 border-pink-300/60" },
  scheduled:  { col: "from-blue-100 to-blue-50 border-blue-200",      head: "bg-blue-200/60 border-blue-300/60" },
  reviewed:   { col: "from-blue-100 to-blue-50 border-blue-200",      head: "bg-blue-200/60 border-blue-300/60" },
  discussion: { col: "from-amber-100 to-amber-50 border-amber-200",   head: "bg-amber-200/60 border-amber-300/60" },
  qualified:  { col: "from-green-100 to-green-50 border-green-200",   head: "bg-green-200/60 border-green-300/60" },
  approved:   { col: "from-green-100 to-green-50 border-green-200",   head: "bg-green-200/60 border-green-300/60" },
  invited:    { col: "from-green-100 to-green-50 border-green-200",   head: "bg-green-200/60 border-green-300/60" },
  training:   { col: "from-purple-100 to-purple-50 border-purple-200", head: "bg-purple-200/60 border-purple-300/60" },
  closed:     { col: "from-slate-100 to-slate-50 border-slate-200",   head: "bg-slate-200/60 border-slate-300/60" },
  declined:   { col: "from-slate-100 to-slate-50 border-slate-200",   head: "bg-slate-200/60 border-slate-300/60" },
};

// --- Fake ticket factory ---
const NAMES = ["Alex Kim", "Priya Shah", "Jordan Lee", "Sam Patel", "Riya Singh", "Mia Chen", "Noah Park", "Eva Rao"];
const SUBJECTS = ["Interested in opening a studio", "Following up on call", "Resume submitted", "Looking to partner", "Brand collab inquiry"];

const makeTickets = (boardKey, statuses) => {
  let id = 1;
  return statuses.flatMap((status) => {
    const count = Math.floor(Math.random() * 4) + 1;
    return Array.from({ length: count }, () => ({
      id: `${boardKey}-${id++}`,
      ticket_number: 1000 + id,
      client_name: NAMES[Math.floor(Math.random() * NAMES.length)],
      subject: SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)],
      status,
    }));
  });
};

export default function MasterKanbanDemo() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [activeKey, setActiveKey] = useState("franchise");

  // Per-user access: non-admins only see "influencer" (mirrors pip-partner rule)
  const allowedKeys = isAdmin ? undefined : ["influencer"];

  // Effective active board (snap back if user lost access)
  const effectiveKey =
    !isAdmin && activeKey !== "influencer" ? "influencer" : activeKey;
  const board = BOARDS.find((b) => b.key === effectiveKey);

  // Fake tickets per board (memoized so they don't reshuffle on every render)
  const ticketsByBoard = useMemo(
    () => Object.fromEntries(BOARDS.map((b) => [b.key, makeTickets(b.key, b.statuses)])),
    []
  );
  const [tickets, setTickets] = useState(ticketsByBoard);

  // Build columns for the active board
  const columns = board.statuses.map((status) => {
    const theme = COLOR_THEMES[status] || { col: "from-slate-100 to-slate-50 border-slate-200", head: "bg-slate-200/60" };
    return {
      status,
      tickets: tickets[board.key].filter((t) => t.status === status),
      colorClasses: theme.col,
      headerClasses: theme.head,
      isDimmed: status === "closed" || status === "declined",
    };
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    setTickets((prev) => {
      const list = [...prev[board.key]];
      const moved = list.find((t) => t.id === draggableId);
      if (!moved) return prev;

      // Remove the dragged ticket from the flat list
      const without = list.filter((t) => t.id !== draggableId);

      // Find indices of tickets currently in the destination column (in
      // their natural array order) — these define the insertion slots.
      const destIndices = [];
      without.forEach((t, i) => {
        if (t.status === destination.droppableId) destIndices.push(i);
      });

      // Build the updated card with the new status
      const updated = { ...moved, status: destination.droppableId };

      // Compute the flat-array insert position based on the destination index
      let insertAt;
      if (destination.index >= destIndices.length) {
        insertAt = destIndices.length
          ? destIndices[destIndices.length - 1] + 1
          : without.length;
      } else {
        insertAt = destIndices[destination.index];
      }

      const next = [...without];
      next.splice(insertAt, 0, updated);
      return { ...prev, [board.key]: next };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Master Kanban — Demo</h1>
              <p className="text-sm text-slate-500">
                Sandbox for the reusable kanban set. Drag cards between columns.
              </p>
            </div>
          </div>

          {/* Per-user access toggle */}
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Admin view (sees all 4 boards)
          </label>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-4">
          <MasterBoardTabs
            boards={BOARDS}
            activeKey={effectiveKey}
            onChange={setActiveKey}
            allowedKeys={allowedKeys}
          />
          <span className="text-xs text-slate-500">
            {isAdmin ? "Admin: all boards visible" : "Non-admin: only Influencer visible"}
          </span>
        </div>

        {/* Swimlane scroller demo (the inline mini-scroller) */}
        <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Inline Swimlane Scroller (used inside columns for sub-rows)
          </div>
          <MasterSwimlaneScroller>
            {board.statuses.map((s) => (
              <span
                key={s}
                className="px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-700 whitespace-nowrap"
              >
                {s}
              </span>
            ))}
          </MasterSwimlaneScroller>
        </div>

        {/* The main board */}
        <MasterKanbanBoard
          columns={columns}
          onDragEnd={handleDragEnd}
          onTicketClick={(t) => alert(`Clicked: ${t.client_name} (${t.id})`)}
          renderCardContent={(t) => (
            <>
              <div className="text-[10px] text-slate-400 font-mono">
                #{t.ticket_number}
              </div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {t.client_name}
              </div>
              <div className="text-xs text-slate-600 line-clamp-2 mt-1">
                {t.subject}
              </div>
            </>
          )}
          getActions={(status) => {
            if (status === "closed" || status === "declined") {
              return {
                onArchiveAll: () => alert(`Archive all in "${status}"`),
                onArchiveSome: () => alert(`Clean up "${status}"`),
              };
            }
            return {};
          }}
        />
      </div>
    </div>
  );
}