import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, CloudSun, ExternalLink } from 'lucide-react';
import useWeather from '@/hooks/useWeather';

// Auto-rotating banner slider with date/time/weather overlay.
// Banners are global Announcement records (owner-managed).
export default function AnnouncementBannerWidget() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(new Date());
  const weather = useWeather();

  // Tick clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
    // Poll every 60s so new banners show up without refresh
    const i = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  // Auto-rotate every 6s
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  const current = banners[index];

  const dateStr = useMemo(
    () => time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
    [time]
  );
  const timeStr = useMemo(
    () => time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [time]
  );

  if (banners.length === 0) {
    return (
      <div className="h-full w-full p-1.5">
        <div className="h-full w-full rounded-[1rem] border-[1.5px] border-white/60 bg-gradient-to-br from-[#fbe0e2] via-[#f7b1bd]/40 to-[#fbe0e2] flex items-center justify-center text-center px-4">
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
    <div className="h-full w-full p-1.5">
      <div
        onClick={handleClick}
        className={`relative h-full w-full rounded-[1rem] overflow-hidden border-[1.5px] border-white/60 group ${current?.link_url ? 'cursor-pointer' : ''}`}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/30 pointer-events-none" />

        {/* Date / Time / Weather overlay (top-right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-medium shadow-sm">
          <span>{dateStr}</span>
          <span className="opacity-50">·</span>
          <span>{timeStr}</span>
          {weather && (
            <>
              <span className="opacity-50">·</span>
              <CloudSun className="w-3.5 h-3.5" />
              <span>{weather.temp}°</span>
            </>
          )}
        </div>

        {/* Title block (bottom-left) */}
        {current && (
          <div className="absolute left-3 right-3 bottom-3 text-white drop-shadow">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-xl font-semibold leading-tight line-clamp-2">{current.title}</h3>
              {current.link_url && (
                <ExternalLink className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
              )}
            </div>
            {current.subtitle && (
              <p className="text-[11px] sm:text-sm opacity-90 mt-0.5 line-clamp-1">{current.subtitle}</p>
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