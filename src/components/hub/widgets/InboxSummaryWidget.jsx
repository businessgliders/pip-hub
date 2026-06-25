import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Inbox, MessageSquareReply } from 'lucide-react';

// Per-inbox display config. Each inbox counts any of its "open / new" statuses
// (a thread can land as either the lowercase generic status or the capitalized
// "New" pipeline stage), so freshly-arrived tickets always show up.
const INBOXES = [
  { key: 'support', label: 'Support', hash: 'support', openStatuses: ['open', 'New'], dot: 'bg-amber-700', text: 'text-amber-800' },
  { key: 'events', label: 'Events', hash: 'events', openStatuses: ['New', 'open'], dot: 'bg-pink-600', text: 'text-pink-700' },
  { key: 'influencer', label: 'Influencer', hash: 'influencer', openStatuses: ['open', 'New'], dot: 'bg-purple-700', text: 'text-purple-800' },
];

export default function InboxSummaryWidget({ widget }) {
  // 2-column layout ONLY on true phones; tablets & desktop always 1-column
  // (matching the desktop small-mode look).
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 639px)').matches : false
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const { data: threads = [] } = useQuery({
    queryKey: ['inbox-summary-threads'],
    queryFn: () => base44.entities.Thread.list('-last_activity_at', 1000),
    refetchInterval: 30000,
    initialData: [],
  });

  const { data: inbound = [] } = useQuery({
    queryKey: ['inbox-summary-replies'],
    queryFn: () => base44.entities.EmailMessage.filter({ direction: 'inbound' }, '-sent_at', 200),
    refetchInterval: 30000,
    initialData: [],
  });

  // Open count per inbox (excludes archived).
  const counts = React.useMemo(() => {
    const c = { support: 0, events: 0, influencer: 0 };
    threads.forEach((t) => {
      if (t.archived) return;
      const cfg = INBOXES.find((i) => i.key === t.source_app);
      if (cfg && cfg.openStatuses.includes(t.status)) c[t.source_app]++;
    });
    return c;
  }, [threads]);

  const totalOpen = counts.support + counts.events + counts.influencer;

  // Map ticket replies back to threads to know which inbox each reply belongs to.
  const replyCounts = React.useMemo(() => {
    const byTicket = {};
    threads.forEach((t) => { if (t.source_ticket_id) byTicket[t.source_ticket_id] = t.source_app; });
    const c = { support: 0, events: 0, influencer: 0, total: 0 };
    inbound.forEach((m) => {
      const app = byTicket[m.ticket_id];
      if (app && c[app] !== undefined) { c[app]++; c.total++; }
    });
    return c;
  }, [inbound, threads]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Subtle inbox logo watermark */}
      <img
        src="https://media.base44.com/images/public/69841af9c747b033a60780f2/8796f5d2d_IMG_0093.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-4 -right-3 w-24 h-24 opacity-[0.06] select-none"
      />
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/60 flex-shrink-0 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/inbox" title="Open inbox" className="shrink-0 hover:opacity-70 transition-opacity">
            <Inbox className="w-4 h-4 text-[#f1889b]" />
          </Link>
          <h3 className="font-semibold text-gray-800 text-sm tracking-tight truncate">PiP Inbox</h3>
          <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">{totalOpen} open</span>
        </div>
        {replyCounts.total > 0 && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0">
            <MessageSquareReply className="w-3 h-3" />
            {replyCounts.total}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 min-h-0 relative z-10">
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
          {INBOXES.map((ib) => (
            <a
              key={ib.key}
              href={`https://inbox.pilatesinpinkstudio.com/inbox#${ib.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-3 py-2 rounded-xl bg-white/50 hover:bg-white/80 border border-white/60 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${ib.dot} flex-shrink-0`} />
              <span className={`flex-1 text-sm font-medium ${ib.text} truncate`}>{ib.label}</span>
              {replyCounts[ib.key] > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {replyCounts[ib.key]}
                </span>
              )}
              <span className="text-sm font-bold text-gray-700 tabular-nums">{counts[ib.key]}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}