import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

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

// Same theme/wallpaper resolution as AppHub
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
  const quote = getDailyQuote();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const wallpaperUrl = getWallpaperUrl(user);
  const dateString = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${wallpaperUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/30 to-transparent" />
      <div className="relative h-full flex flex-col justify-between p-5 text-white">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/80">{dateString}</p>
          <h2 className="mt-1.5 text-xl xl:text-2xl font-bold tracking-tight drop-shadow-sm leading-tight">
            {getGreeting(user?.full_name)}
          </h2>
        </div>
        <div className="max-w-md">
          <p className="text-xs xl:text-sm leading-relaxed text-white/95 italic drop-shadow-sm line-clamp-3">
            “{quote.text}”
          </p>
          <p className="mt-1 text-[10px] text-white/75">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
}