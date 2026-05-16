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
    () => time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
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

        {/* Gradient for legibility — matches AmbientHeroWidget */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/65 via-black/35 to-black/10 pointer-events-none" />

        {/* Weather gradient (for icon stroke) */}
        <svg width="0" height="0" className="absolute">
          <linearGradient id="announce-weather-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#fde68a" offset="0%" />
            <stop stopColor="#fbcfe8" offset="50%" />
            <stop stopColor="#ddd6fe" offset="100%" />
          </linearGradient>
        </svg>

        {/* Content layout — mirrors AmbientHeroWidget */}
        {current && (
          <div className="relative h-full flex flex-col justify-between p-4 lg:p-5 text-white">
            {/* Top: Date (left) · Time + Weather (right) */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/80">{dateStr}</p>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-sm">
                <div className="text-2xl lg:text-3xl xl:text-4xl font-light tracking-tight leading-none drop-shadow">
                  {timeStr}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CloudSun className="w-4 h-4" stroke="url(#announce-weather-gradient)" strokeWidth={1.8} />
                  <span className="text-xs font-medium text-white/95">
                    {weather ? `${weather.temp}°C` : '—'}
                  </span>
                  <span className="text-xs text-white/75 truncate max-w-[120px]">
                    {weather?.city ? `· ${weather.city}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Headline — centered */}
            <h2 className="text-sm sm:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight drop-shadow-sm leading-tight truncate sm:whitespace-normal sm:break-words sm:text-center sm:flex-1 sm:flex sm:items-center sm:justify-center lg:text-left lg:block lg:flex-none">
              <span className="inline-flex items-center gap-2">
                {current.title}
                {current.link_url && <ExternalLink className="w-4 h-4 opacity-80 flex-shrink-0" />}
              </span>
            </h2>

            {/* Bottom: Subtitle */}
            {current.subtitle && (
              <div className="max-w-2xl">
                <p className="text-xs lg:text-[13px] xl:text-sm leading-relaxed text-white/95 italic drop-shadow-sm line-clamp-2 lg:line-clamp-3">
                  {current.subtitle}
                </p>
              </div>
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