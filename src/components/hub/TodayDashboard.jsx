import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, MapPin, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Curated rotating set of gentle, on-brand quotes
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

const formatEventTime = (event) => {
  if (event.isAllDay) return 'All day';
  if (!event.start) return '';
  const d = new Date(event.start);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export default function TodayDashboard({ user, wallpaperUrl }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());
  const quote = getDailyQuote();

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('getTodayAgenda', {});
      if (res.data?.events) {
        setEvents(res.data.events);
      } else {
        setError(res.data?.error || 'Could not load calendar');
      }
    } catch (e) {
      setError('Could not load calendar');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const dateString = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  // Determine "next up" event — first event whose end is in the future
  const upcomingIdx = events.findIndex(e => e.end && new Date(e.end) > now);

  return (
    <div className="hidden md:grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
      {/* Hero — wallpaper view + greeting + daily quote */}
      <div className="lg:col-span-3 relative rounded-3xl overflow-hidden border border-white/60 shadow-lg min-h-[280px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${wallpaperUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/25 to-transparent" />
        <div className="relative h-full flex flex-col justify-between p-6 text-white">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/80">{dateString}</p>
            <h2 className="mt-2 text-3xl xl:text-4xl font-bold tracking-tight drop-shadow-sm">
              {getGreeting(user?.full_name)}
            </h2>
          </div>
          <div className="max-w-md">
            <p className="text-sm xl:text-base leading-relaxed text-white/95 italic drop-shadow-sm">
              “{quote.text}”
            </p>
            <p className="mt-2 text-xs text-white/75">— {quote.author}</p>
          </div>
        </div>
      </div>

      {/* Agenda panel */}
      <div className="lg:col-span-2 rounded-3xl border border-white/60 bg-white/55 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col min-h-[280px]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/60">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#f1889b]" />
            <h3 className="font-semibold text-gray-800 text-sm tracking-tight">Today's agenda</h3>
          </div>
          <button
            onClick={fetchEvents}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/70 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && events.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">Loading…</div>
          ) : error ? (
            <div className="px-4 py-6 flex flex-col items-center gap-2 text-center">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              <p className="text-xs text-gray-500">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-600 font-medium">Nothing on the books</p>
              <p className="text-xs text-gray-400 mt-1">Enjoy a clear day ✨</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {events.map((event, idx) => {
                const isPast = event.end && new Date(event.end) < now;
                const isNext = idx === upcomingIdx;
                return (
                  <li key={event.id}>
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex items-start gap-3 px-3 py-2 rounded-xl transition-colors ${
                        isNext ? 'bg-[#f1889b]/10' : 'hover:bg-white/70'
                      } ${isPast ? 'opacity-50' : ''}`}
                    >
                      <div className="flex-shrink-0 w-16 text-right">
                        <div className={`text-xs font-semibold ${isNext ? 'text-[#f1889b]' : 'text-gray-700'}`}>
                          {formatEventTime(event)}
                        </div>
                      </div>
                      <div className={`flex-shrink-0 w-1 self-stretch rounded-full ${isNext ? 'bg-[#f1889b]' : 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{event.summary}</p>
                          <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                        {event.location && (
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}