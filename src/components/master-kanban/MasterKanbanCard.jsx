import React from "react";
import { cn } from "@/lib/utils";

/**
 * MasterKanbanCard — a generic, presentation-only ticket card.
 *
 * Intentionally dumb: the spoke app decides what to render inside via the
 * `renderContent` prop. The card just provides drag styling, highlight glow,
 * unread badge, and click handling.
 */
export default function MasterKanbanCard({
  ticket,
  onClick,
  isDragging = false,
  isHighlighted = false,
  unreadCount = 0,
  renderContent,
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-white rounded-xl border border-slate-200 p-3 shadow-sm cursor-pointer transition-all",
        "hover:shadow-md hover:border-slate-300",
        isDragging && "shadow-2xl ring-2 ring-pink-300 rotate-1",
        isHighlighted && "ring-2 ring-pink-400 animate-pulse"
      )}
    >
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
      {renderContent ? renderContent(ticket) : (
        <div className="text-sm text-slate-700">{ticket.title || ticket.id}</div>
      )}
    </div>
  );
}