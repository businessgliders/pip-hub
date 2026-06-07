import { useState, useMemo } from 'react';
import { Archive, Ban, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function getClosedTimestamp(ticket) {
  const hist = ticket.status_history || [];
  const closedEntry = [...hist].reverse().find(e => e.status === 'Closed' || e.status === 'Cancelled');
  if (closedEntry?.timestamp) return closedEntry.timestamp;
  if (hist.length > 0) return hist[hist.length - 1].timestamp;
  return ticket.created_date;
}

export default function ArchivedTicketsList({ tickets, cancelledTickets = [], onView, onRestore }) {
  const [tab, setTab] = useState('archived'); // 'archived' | 'cancelled'
  const activeTickets = tab === 'archived' ? tickets : cancelledTickets;

  // Group by year → month
  const grouped = useMemo(() => {
    const byYear = {};
    activeTickets.forEach(t => {
      const ts = getClosedTimestamp(t);
      if (!ts) return;
      const d = new Date(ts);
      const year = d.getFullYear();
      const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!byYear[year]) byYear[year] = { total: 0, months: {} };
      if (!byYear[year].months[monthKey]) byYear[year].months[monthKey] = { label: monthLabel, tickets: [] };
      byYear[year].months[monthKey].tickets.push(t);
      byYear[year].total++;
    });
    return byYear;
  }, [activeTickets]);

  const years = Object.keys(grouped).sort((a, b) => b - a);
  const firstYear = years[0];
  const firstMonth = firstYear ? Object.keys(grouped[firstYear].months).sort().reverse()[0] : null;
  const [openYears, setOpenYears] = useState(firstYear ? { [firstYear]: true } : {});
  const [selectedMonth, setSelectedMonth] = useState(firstMonth);

  // Keep the selected month in sync when switching tabs
  const validMonth = useMemo(() => {
    if (selectedMonth && years.some(y => grouped[y].months[selectedMonth])) return selectedMonth;
    return firstMonth;
  }, [selectedMonth, years, grouped, firstMonth]);

  const currentMonthData = useMemo(() => {
    for (const y of years) {
      if (grouped[y].months[validMonth]) return grouped[y].months[validMonth];
    }
    return null;
  }, [grouped, years, validMonth]);

  const tabsRow = (
    <div className="inline-flex rounded-full overflow-hidden bg-white/30 backdrop-blur shadow-sm mb-4">
      <button
        onClick={() => setTab('archived')}
        className="px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-colors"
        style={{
          background: tab === 'archived' ? '#3a1f1f' : 'transparent',
          color: tab === 'archived' ? 'white' : 'rgba(255,255,255,0.85)',
        }}
      >
        <Archive className="w-4 h-4" /> Archived
        <span className="ml-1 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold"
          style={{ background: tab === 'archived' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.35)', color: 'white' }}>
          {tickets.length}
        </span>
      </button>
      <button
        onClick={() => setTab('cancelled')}
        className="px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-colors"
        style={{
          background: tab === 'cancelled' ? '#3a1f1f' : 'transparent',
          color: tab === 'cancelled' ? 'white' : 'rgba(255,255,255,0.85)',
        }}
      >
        <Ban className="w-4 h-4" /> Cancelled
        <span className="ml-1 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold"
          style={{ background: tab === 'cancelled' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.35)', color: 'white' }}>
          {cancelledTickets.length}
        </span>
      </button>
    </div>
  );

  if (activeTickets.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
        {tabsRow}
        <div className="flex-1 flex flex-col items-center justify-center text-white/70 py-12">
          {tab === 'archived' ? <Archive className="w-12 h-12 mb-3" /> : <Ban className="w-12 h-12 mb-3" />}
          <p className="text-lg font-medium">No {tab} inquiries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-xl flex-1 overflow-hidden">
      {tabsRow}
      <div className="flex flex-col md:flex-row gap-4 h-full max-h-[calc(100vh-260px)]">
        {/* Sidebar */}
        <aside className="md:w-60 flex-shrink-0 overflow-y-auto custom-scrollbar">
          <h2 className="text-white font-bold text-lg mb-3 px-2">{tab === 'archived' ? 'Archive' : 'Cancelled'}</h2>
          {years.map(year => (
            <div key={year} className="mb-1">
              <button
                onClick={() => setOpenYears(o => ({ ...o, [year]: !o[year] }))}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/20 text-white text-sm"
              >
                {openYears[year] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-semibold flex-1 text-left">{year}</span>
                <Badge className="bg-white/30 text-white border-0">{grouped[year].total}</Badge>
              </button>
              {openYears[year] && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {Object.keys(grouped[year].months).sort().reverse().map(mk => {
                    const m = grouped[year].months[mk];
                    const isSelected = validMonth === mk;
                    return (
                      <button
                        key={mk}
                        onClick={() => setSelectedMonth(mk)}
                        className={`w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md text-xs transition-colors ${
                          isSelected ? 'text-white' : 'text-white/80 hover:bg-white/10'
                        }`}
                        style={isSelected ? { background: '#b67651' } : undefined}
                      >
                        <span className="truncate">{m.label.replace(` ${year}`, '')}</span>
                        <span className="text-[10px] opacity-80">{m.tickets.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {currentMonthData ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-white text-xl font-bold drop-shadow">{currentMonthData.label}</h2>
                <Badge className="bg-white/30 text-white border-0">{currentMonthData.tickets.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentMonthData.tickets.map(t => (
                  <div
                    key={t.id}
                    className="backdrop-blur-md bg-white/60 border border-white/50 rounded-xl p-3 shadow hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-gray-400 font-bold">
                        {t.ticket_number ? `#${t.ticket_number}` : `#${t.id?.slice(-6)}`}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-white/60 border-pink-200 text-pink-700">
                        {t.event_type}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#5a3535' }}>{t.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{t.email}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => onView && onView(t)}>
                        View
                      </Button>
                      {onRestore && (
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => onRestore(t)}>
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/70 py-12">Select a month</div>
          )}
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 8px; }
      `}</style>
    </div>
  );
}