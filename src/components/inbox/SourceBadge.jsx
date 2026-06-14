import React from "react";
import { SOURCE_META } from "./inboxConfig";

export default function SourceBadge({ source }) {
  const meta = SOURCE_META[source] || SOURCE_META.support;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.badge}`}>
      {meta.label}
    </span>
  );
}