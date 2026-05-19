import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, ArrowLeft, Calendar as CalendarIcon, User, Phone, Mail, Users, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function EndOfDayCalendar() {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selected, setSelected] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['shiftReports'],
    queryFn: () => base44.entities.ShiftReport.list('-shift_date', 500),
  });

  const reportsByDate = useMemo(() => {
    const map = {};
    reports.forEach(r => {
      if (!map[r.shift_date]) map[r.shift_date] = [];
      map[r.shift_date].push(r);
    });
    return map;
  }, [reports]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const todayStr = fmt(new Date());

  const prevMonth = () => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const nextMonth = () => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const goToday = () => {
    const n = new Date();
    setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
  };

  const monthReports = reports.filter(r => {
    if (!r.shift_date) return false;
    const [y, m] = r.shift_date.split('-');
    return Number(y) === cursor.getFullYear() && Number(m) === cursor.getMonth() + 1;
  });

  return (
    <div className="h-screen bg-gradient-to-br from-[#fbe0e2]/30 via-white to-white p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
         {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="rounded-lg text-gray-600 h-7 px-2">
              <ArrowLeft className="w-3 h-3 mr-1" /> Back
            </Button>
          </Link>
          <div className="text-xs font-semibold text-[#f1889b] tracking-[1px] uppercase">Pilates in Pink</div>
          <div className="w-12" />
        </div>

        <div className="mb-2 sm:mb-3">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">End of Day Reports</h1>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5 mb-3 sm:mb-4">
          <SummaryCard label="Reports this month" value={monthReports.length} />
          <SummaryCard label="Days covered" value={new Set(monthReports.map(r => r.shift_date)).size} />
          <SummaryCard label="Total calls" value={monthReports.reduce((s, r) => s + (r.calls_handled || 0), 0)} />
          <SummaryCard label="Total walk-ins" value={monthReports.reduce((s, r) => s + (r.total_walk_ins || 0), 0)} />
        </div>

        {/* Calendar card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 bg-gradient-to-br from-[#fbe0e2]/40 to-white">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-gray-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-800">
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </h2>
              <button onClick={goToday} className="text-xs px-1.5 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-[#f1889b] hover:text-[#f1889b]">
                Today
              </button>
            </div>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-gray-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 px-1.5 sm:px-2.5 pt-1.5 sm:pt-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-[7px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider text-center pb-1">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 p-1.5 sm:p-2.5 pt-0">
            {days.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;
              const ds = fmt(d);
              const dayReports = reportsByDate[ds] || [];
              const filled = dayReports.length > 0;
              const isToday = ds === todayStr;
              return (
                <button
                  key={i}
                  onClick={() => filled && setSelected(dayReports[0])}
                  disabled={!filled}
                  className={`
                     relative aspect-square rounded-lg p-0.5 sm:p-1 text-left transition-all text-[8px] sm:text-xs
                     ${filled
                       ? 'bg-gradient-to-br from-[#fbe0e2] to-[#f7b1bd]/30 hover:from-[#f7b1bd]/40 hover:to-[#f1889b]/30 cursor-pointer border border-[#f1889b]/30'
                       : 'bg-gray-50/60 border border-gray-100'}
                     ${isToday ? 'ring-2 ring-[#f1889b] ring-offset-0.5' : ''}
                   `}
                >
                  <div className={`font-semibold text-[9px] sm:text-xs ${filled ? 'text-gray-800' : 'text-gray-400'}`}>
                    {d.getDate()}
                  </div>
                  {filled && (
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center shadow-sm">
                      <Check className="w-1.5 h-1.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading && <div className="text-center text-sm text-gray-400 mt-4">Loading reports…</div>}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && <ReportDetail r={selected} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-2 sm:p-3">
      <div className="text-[7px] sm:text-[8px] font-semibold text-gray-400 uppercase tracking-wider leading-tight">{label}</div>
      <div className="text-base sm:text-xl font-bold text-gray-800 mt-0.5">{value}</div>
    </div>
  );
}

function ReportDetail({ r }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-gray-800">
          <CalendarIcon className="w-4 h-4 text-[#f1889b]" />
          {r.shift_date} · {r.shift_time}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#fbe0e2]/50">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#f1889b]" />
            <div className="text-sm">
              <span className="text-gray-500">Admin: </span>
              <span className="font-semibold text-gray-800">{r.admin_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="w-3.5 h-3.5 text-[#f1889b]" />
            <span className="font-semibold text-gray-800">{r.location || 'Brampton / HQ'}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat icon={Phone} label="Calls" value={r.calls_handled} />
          <Stat icon={Mail} label="Emails" value={r.total_emails} />
          <Stat icon={Users} label="Walk-ins" value={r.total_walk_ins} />
          <Stat icon={Check} label="Converted" value={r.leads_converted} />
          <Stat icon={Star} label="Reviews" value={r.reviews_solicited} />
          <Stat icon={Check} label="Social" value={r.posted_social_media ? 'Yes' : 'No'} />
        </div>

        <DetailRow label="Conversion notes" value={r.conversion_notes} />
        <DetailRow label="Content planned" value={r.content_planned} />
        <DetailRow label="Low inventory" value={r.low_inventory_items} />
        <DetailRow label="Incidents" value={r.incidents} />
        <DetailRow label="Feedback" value={r.feedback} />
        <DetailRow label="General notes" value={r.general_notes} />

        <div className="pt-3 border-t border-gray-100">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Signed</div>
          <div className="italic text-gray-700 mt-1">{r.signature}</div>
        </div>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
      <Icon className="w-3.5 h-3.5 text-[#f1889b] mx-auto mb-1" />
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-800">{value ?? 0}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{value}</div>
    </div>
  );
}