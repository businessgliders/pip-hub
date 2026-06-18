import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Paperclip, Plus, Loader2, X } from "lucide-react";
import AttachmentLightbox from "./AttachmentLightbox";
import BugDeleteButton from "./BugDeleteButton";

function isImg(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url || "");
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <span className="block text-[10px] uppercase tracking-wide text-orange-400 dark:text-white/40">{label}</span>
      <span className="block text-orange-900/85 dark:text-white/85 font-medium break-words">{value}</span>
    </div>
  );
}

// 3rd-column detail panel for the Bugs view. Shows the full report metadata and
// large attachment thumbnails, plus the ability to add more attachments.
export default function BugSidePanel({ bug, onUpdated, onClose }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const images = bug.image_urls || [];
  const imgUrls = images.filter(isImg);

  const handleFiles = async (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = "";
    if (!list.length) return;
    setUploading(true);
    const added = [];
    for (const file of list) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) added.push(file_url);
      } catch { /* skip failed upload */ }
    }
    if (added.length) {
      await base44.entities.BugReport.update(bug.id, { image_urls: [...images, ...added] });
      onUpdated?.();
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/10 shrink-0">
        <span className="text-sm font-bold text-orange-900 dark:text-white">Report details</span>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <X className="w-4 h-4 text-orange-700 dark:text-white/70" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto ios-scroll p-4 space-y-4">
        {bug.description && (
          <p className="text-sm leading-relaxed text-orange-950/90 dark:text-white/90 whitespace-pre-line">
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

        <div>
          <span className="block text-[10px] uppercase tracking-wide text-orange-400 dark:text-white/40 mb-2">Attachments</span>
          <div className="flex flex-wrap gap-2.5">
            {images.map((url, i) =>
              isImg(url) ? (
                <button key={i} type="button" onClick={() => setLightboxIndex(imgUrls.indexOf(url))}>
                  <img src={url} alt="" className="w-24 h-24 rounded-xl object-cover border border-orange-200/60 dark:border-white/15 hover:opacity-90 transition-opacity" />
                </button>
              ) : (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="w-24 h-24 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-200 text-xs font-medium hover:bg-orange-100 transition-colors border border-orange-200/60 dark:border-white/15">
                  <Paperclip className="w-5 h-5" /> File {i + 1}
                </a>
              )
            )}

            {/* Add more attachments */}
            <label className="w-24 h-24 rounded-xl flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-orange-300/60 dark:border-white/20 text-orange-500 dark:text-white/60 cursor-pointer hover:bg-orange-50 dark:hover:bg-white/5 transition-colors">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span className="text-[11px] font-medium">{uploading ? "Uploading…" : "Add"}</span>
              <input type="file" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      <BugDeleteButton bug={bug} onDeleted={onClose} />

      {lightboxIndex !== null && (
        <AttachmentLightbox
          images={imgUrls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}