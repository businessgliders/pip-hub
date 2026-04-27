import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, MapPin, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const formatEventTime = (event) => {
  if (event.isAllDay) return 'All day';
  if (!event.start) return '';
  const d = new Date(event.start);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export default function AgendaWidget() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());

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

  const upcomingIdx = events.findIndex(e => e.end && new Date(e.end) > now);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/60 flex-shrink-0">
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

      <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
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
                    <div className="flex-shrink-0 w-14 text-right">
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
  );
}