import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Collapsed: a passive chevron-down hint beside the timestamp.
// Expanded: a circular chevron-up pill that collapses the bubble.
export default function ExpandToggleButton({ expanded, onCollapse, colored = false, className = "" }) {
  if (!expanded) {
    return <ChevronDown className={`w-3.5 h-3.5 shrink-0 opacity-70 ${className}`} aria-hidden="true" />;
  }
  return (
    <button
      type="button"
      title="Collapse"
      aria-label="Collapse message"
      onClick={(e) => { e.stopPropagation(); onCollapse?.(); }}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
        colored ? "bg-white/25 hover:bg-white/40" : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
      } ${className}`}
    >
      <ChevronUp className="w-3.5 h-3.5" />
    </button>
  );
}