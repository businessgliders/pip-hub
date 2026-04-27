import React, { useEffect, useState } from 'react';
import { CloudSun } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useWeather from '@/hooks/useWeather';

const QUOTES = [
  { text: "Movement is a medicine for creating change in a person's physical, emotional, and mental states.", author: 'Carol Welch' },
  { text: 'Change happens through movement, and movement heals.', author: 'Joseph Pilates' },
  { text: 'Physical fitness is the first requisite of happiness.', author: 'Joseph Pilates' },
  { text: 'The mind, when housed within a healthful body, possesses a glorious sense of power.', author: 'Joseph Pilates' },
  { text: 'A body in motion stays in motion.', author: 'Newton (sort of)' },
  { text: 'Take care of your body. It’s the only place you have to live.', author: 'Jim Rohn' },
  { text: 'Strong is the new beautiful.', author: '—' },
  { text: 'Breathe. Lengthen. Soften. Begin again.', author: '—' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: '—' },
  { text: 'You don’t have to be extreme, just consistent.', author: '—' },
];

const getDailyQuote = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
};

const getGreeting = (name) => {
  const h = new Date().getHours();
  const first = (name || '').split(' ')[0] || 'there';
  if (h < 5) return `Still up, ${first}?`;
  if (h < 12) return `Good morning, ${first}`;
  if (h < 17) return `Good afternoon, ${first}`;
  if (h < 21) return `Good evening, ${first}`;
  return `Good night, ${first}`;
};

const getWallpaperUrl = (user) => {
  if (user?.customWallpaper) return user.customWallpaper;
  const theme = user?.selectedGradient;
  return theme === 'blue'   ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80' :
         theme === 'purple' ? 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80' :
         theme === 'green'  ? 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' :
         theme === 'orange' ? 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1920&q=80' :
         theme === 'dark'   ? 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80' :
         'https://images.unsplash.com/photo-1490750967868-88df5691cc8d?w=1920&q=80';
};

export default function AmbientHeroWidget() {
  const [user, setUser] = useState(null);
  const [now, setNow] = useState(new Date());
  const weather = useWeather();
  const quote = getDailyQuote();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const wallpaperUrl = getWallpaperUrl(user);
  const dateString = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${wallpaperUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/65 via-black/35 to-black/10" />

      <svg width="0" height="0" className="absolute">
        <linearGradient id="hero-weather-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#fde68a" offset="0%" />
          <stop stopColor="#fbcfe8" offset="50%" />
          <stop stopColor="#ddd6fe" offset="100%" />
        </linearGradient>
      </svg>

      <div className="relative h-full flex flex-col justify-between p-4 lg:p-5 text-white">
        {/* Top: Greeting + date / Time + Weather */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/80">{dateString}</p>
            <h2 className="mt-1 text-sm sm:text-lg lg:text-2xl xl:text-3xl font-bold tracking-tight drop-shadow-sm leading-tight truncate sm:whitespace-normal sm:break-words">
              {getGreeting(user?.full_name)}
            </h2>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="text-2xl lg:text-3xl xl:text-4xl font-light tracking-tight leading-none drop-shadow">
              {timeString}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <CloudSun className="w-4 h-4" stroke="url(#hero-weather-gradient)" strokeWidth={1.8} />
              <span className="text-xs font-medium text-white/95">
                {weather ? `${weather.temp}°C` : '—'}
              </span>
              <span className="text-xs text-white/75 truncate max-w-[120px]">
                {weather?.city ? `· ${weather.city}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Daily Quote */}
        <div className="max-w-2xl">
          <p className="text-xs lg:text-[13px] xl:text-sm leading-relaxed text-white/95 italic drop-shadow-sm line-clamp-2 lg:line-clamp-3">
            “{quote.text}”
          </p>
          <p className="mt-1 text-[10px] text-white/75">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
}