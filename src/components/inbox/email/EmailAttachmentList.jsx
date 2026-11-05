import React from "react";
import { Paperclip } from "lucide-react";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Attachments shown under an expanded email: image thumbnails + file chips.
export default function EmailAttachmentList({ attachments = [] }) {
  if (!attachments.length) return null;
  return (
    <div className="mt-3 pt-2 border-t border-current/10">
      <div className="flex items-center gap-1 text-[11px] font-medium opacity-70 mb-1.5">
        <Paperclip className="w-3 h-3" /> {attachments.length} attachment{attachments.length === 1 ? "" : "s"}
      </div>
      <div className="flex flex-wrap gap-2">
        {attachments.map((a, i) => {
          const isImage = (a.content_type || "").startsWith("image/");
          return (
            <a
              key={`${a.filename}-${i}`}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              title={a.filename}
              className="group flex items-center gap-2 rounded-lg border border-current/15 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors p-1.5 pr-2.5 max-w-[220px]"
            >
              {isImage ? (
                <img src={a.href} alt={a.filename} className="w-10 h-10 rounded object-cover shrink-0" />
              ) : (
                <span className="w-10 h-10 rounded bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Paperclip className="w-4 h-4 opacity-60" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-[11px] font-medium truncate">{a.filename}</span>
                <span className="block text-[10px] opacity-60">{formatSize(a.size)}</span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}