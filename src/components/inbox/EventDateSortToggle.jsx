import React from "react";
import { CalendarClock } from "lucide-react";

// Toggle between "Event date" (soonest first) and "Submission date" (newest
// first) sorting for the Events inbox.
export default function EventDateSortToggle({ active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={active ? "Sorting by event date (soonest first) — switch to submission date" : "Sorting by submission date (newest first) — switch to event date"}
      className={`relative p-1.5 rounded-full transition-colors ${
        active
          ? "bg-pink-500 text-white shadow-sm"
          : "text-pink-400 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/10"
      }`}
    >
      <CalendarClock className="w-4 h-4" />
    </button>
  );
}