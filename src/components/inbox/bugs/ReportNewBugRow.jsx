import React from "react";
import { Plus } from "lucide-react";

// A list item (same footprint as a BugRow) that launches the live-chat bug
// reporter when clicked. Always sits at the very top of the Bugs list.
export default function ReportNewBugRow({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left mx-2 my-1 px-3 py-3 flex gap-3 rounded-2xl transition-all border border-white/15 bg-[#6b7280]/85 backdrop-blur-md hover:bg-[#4b5563]/90 shadow-md"
      style={{ width: "calc(100% - 1rem)" }}
    >
      <div className="w-10 h-10 shrink-0 rounded-full bg-[#9ca3af] flex items-center justify-center text-white shadow-sm">
        <Plus className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className="truncate text-sm font-semibold text-white">
          Report a new Bug
        </span>
        <p className="truncate text-xs text-white/60 mt-0.5">
          Start a live chat to escalate an issue
        </p>
      </div>
    </button>
  );
}