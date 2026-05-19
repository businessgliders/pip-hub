import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, ExternalLink, Megaphone } from 'lucide-react';

// Auto-rotating announcement banner slider.
// Banners are global Announcement records (owner-managed).
export default function AnnouncementBannerWidget() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);

  // Load active banners
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await base44.entities.Announcement.filter({ is_active: true }, 'order');
        if (!cancelled) setBanners(list);
      } catch {
        if (!cancelled) setBanners([]);
      }
    };
    load();
    const i = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  // Auto-rotate every 6s when multiple banners exist
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  const current = banners[index];

  if (banners.length === 0) {
    return (
      <div className="h-full w-full">
        <div className="h-full w-full rounded-[1rem] bg-gradient-to-br from-[#fbe0e2] via-[#f7b1bd]/40 to-[#fbe0e2] flex items-center justify-center text-center px-4">
          <div>
            <p className="text-sm font-medium text-gray-700">No announcements yet</p>
            <p className="text-xs text-gray-500 mt-1">The owner can add banners in Customize → Announcements.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (current?.link_url) {
      window.open(current.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  const goPrev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + banners.length) % banners.length);
  };
  const goNext = (e) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % banners.length);
  };

  return (
    <div className="h-full w-full">
      <div
        onClick={handleClick}
        className={`relative h-full w-full rounded-[1rem] overflow-hidden group ${current?.link_url ? 'cursor-pointer' : ''}`}
      >
        {/* Slides */}
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: `url(${b.image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}

        {/* Gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/15 pointer-events-none" />

        {/* Announcement content */}
        {current && (
          <div className="relative h-full flex flex-col justify-end p-4 lg:p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[10px] font-semibold uppercase tracking-[0.15em]">
                <Megaphone className="w-3 h-3" />
                Announcement
              </div>
            </div>

            <h2 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight drop-shadow-sm leading-tight">
              <span className="inline-flex items-center gap-2 flex-wrap">
                {current.title}
                {current.link_url && <ExternalLink className="w-4 h-4 opacity-80 flex-shrink-0" />}
              </span>
            </h2>

            {current.subtitle && (
              <p className="mt-2 text-sm lg:text-base leading-relaxed text-white/95 drop-shadow-sm line-clamp-2 lg:line-clamp-3 max-w-2xl">
                {current.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Arrows (only if multiple) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                  className={`rounded-full transition-all ${i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}