import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Transparent vertical line between the mail panel and the contact (detail) panel.
// On hover it reveals a small arrow to collapse/expand the detail panel.
export default function DetailToggleHandle({ open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={open ? "Hide details" : "Show details"}
      className="hidden lg:flex group relative w-2 shrink-0 items-center justify-center cursor-pointer"
    >
      <span className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-px bg-transparent group-hover:bg-white/40 transition-colors" />
      <span className="relative z-10 flex items-center justify-center w-5 h-10 rounded-full bg-white/0 text-transparent group-hover:bg-white/70 dark:group-hover:bg-white/15 group-hover:text-pink-700 dark:group-hover:text-pink-200 shadow-sm transition-all">
        {open ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </span>
    </button>
  );
}