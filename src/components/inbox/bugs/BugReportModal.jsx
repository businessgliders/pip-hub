import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip } from "lucide-react";
import AttachmentLightbox from "./AttachmentLightbox";

function isImg(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url || "");
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <span className="block text-[10px] uppercase tracking-wide text-orange-400 dark:text-white/40">{label}</span>
      <span className="block text-orange-900/80 dark:text-white/80 font-medium break-words">{value}</span>
    </div>
  );
}

// Full bug-report detail (top fields + attachments). No transcript.
export default function BugReportModal({ bug, open, onClose }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  if (!bug) return null;
  const images = bug.image_urls || [];
  const imgUrls = images.filter(isImg);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 bg-white dark:bg-zinc-800">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10">
          <DialogTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
            {bug.title || "Bug report"}
            {bug.bug_number != null && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                B{Math.round(bug.bug_number)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {bug.description && (
            <p className="text-sm leading-relaxed text-slate-800 dark:text-white/85 whitespace-pre-line">
              {bug.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            <Field label="Reported by" value={bug.reported_by_name} />
            <Field label="Urgency" value={bug.urgency} />
            <Field label="Client" value={bug.client_name} />
            <Field label="Platform" value={bug.platform} />
            <Field label="Booking" value={bug.booking_info} />
            {bug.ticket_number && <Field label="Ticket" value={`#${bug.ticket_number}`} />}
          </div>

          {images.length > 0 && (
            <div>
              <span className="block text-[10px] uppercase tracking-wide text-orange-400 dark:text-white/40 mb-2">Attachments</span>
              <div className="flex flex-wrap gap-2">
                {images.map((url, i) =>
                  isImg(url) ? (
                    <button key={i} type="button" onClick={() => setLightboxIndex(imgUrls.indexOf(url))}>
                      <img src={url} alt="" className="w-24 h-24 rounded-xl object-cover border border-orange-200/60 dark:border-white/15 hover:opacity-90 transition-opacity" />
                    </button>
                  ) : (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-200 text-xs font-medium hover:bg-orange-100 transition-colors">
                      <Paperclip className="w-3.5 h-3.5" /> File {i + 1}
                    </a>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {lightboxIndex !== null && (
        <AttachmentLightbox
          images={imgUrls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </Dialog>
  );
}