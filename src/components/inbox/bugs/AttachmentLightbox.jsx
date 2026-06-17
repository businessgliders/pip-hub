import React, { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

// Fullscreen lightbox for previewing image attachments.
// `images` is an array of URLs; `index` is the currently shown image.
export default function AttachmentLightbox({ images = [], index = 0, onClose, onIndexChange }) {
  const has = images.length > 0;
  const url = images[index];

  useEffect(() => {
    if (!has) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") onIndexChange?.((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndexChange?.((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [has, index, images.length, onClose, onIndexChange]);

  if (!has) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
        title="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <a
        href={url}
        download
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-16 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
        title="Download"
      >
        <Download className="w-5 h-5" />
      </a>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange?.((index - 1 + images.length) % images.length); }}
            className="absolute left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            title="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange?.((index + 1) % images.length); }}
            className="absolute right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            title="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <img
        src={url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[88vh] rounded-lg shadow-2xl object-contain"
      />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}