import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { Sparkles, Phone, Mail, Users, Star, Loader2, TrendingUp } from 'lucide-react';

const PINK = '#f1889b';

function monthKey(dateStr) {
  if (!dateStr) return null;
  const [y, m] = dateStr.split('-');
  return `${y}-${m}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(m) - 1]} ${y.slice(2)}`;
}

export default function AnalyticsModal({ open, onClose, reports }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const totals = useMemo(() => ({
    reports: reports.length,
    calls: reports.reduce((s, r) => s + (r.calls_handled || 0), 0),
    emails: reports.reduce((s, r) => s + (r.total_emails || 0), 0),
    walkIns: reports.reduce((s, r) => s + (r.total_walk_ins || 0), 0),
    converted: reports.reduce((s, r) => s + (r.leads_converted || 0), 0),
    reviews: reports.reduce((s, r) => s + (r.reviews_solicited || 0), 0),
    social: reports.filter(r => r.posted_social_media).length,
  }), [reports]);

  const trendData = useMemo(() => {
    const map = {};
    reports.forEach(r => {
      const k = monthKey(r.shift_date);
      if (!k) return;
      if (!map[k]) map[k] = { key: k, calls: 0, emails: 0, walkIns: 0, converted: 0 };
      map[k].calls += r.calls_handled || 0;
      map[k].emails += r.total_emails || 0;
      map[k].walkIns += r.total_walk_ins || 0;
      map[k].converted += r.leads_converted || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12)
      .map(d => ({ ...d, month: monthLabel(d.key) }));
  }, [reports]);

  const generateSummary = async () => {
    setLoadingAi(true);
    const items = reports.map(r => ({
      date: r.shift_date,
      admin: r.admin_name,
      conversion_notes: r.conversion_notes,
      low_inventory: r.low_inventory_items,
      incidents: r.incidents || (r.incidents_list || []).join('; '),
      feedback: r.feedback || (r.feedback_list || []).join('; '),
      general_notes: r.general_notes,
    })).filter(i => i.conversion_notes || i.low_inventory || i.incidents || i.feedback || i.general_notes);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are analyzing end-of-day shift reports for a Pilates studio. Below is a JSON array of report notes. Summarize the trends and most commonly reported items across these categories: incidents, client feedback, low inventory items, conversion blockers (why leads didn't convert), and general notes. Identify recurring themes and how often they appear. Be specific and actionable.\n\nReports:\n${JSON.stringify(items, null, 2)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          overview: { type: 'string', description: '2-3 sentence high level summary' },
          common_incidents: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'number' } } } },
          common_feedback: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'number' } } } },
          common_inventory: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'number' } } } },
          conversion_blockers: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'number' } } } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    setAiSummary(result);
    setLoadingAi(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="w-5 h-5 text-[#f1889b]" />
            End of Day Analytics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MetricCard icon={Phone} label="Total calls" value={totals.calls} />
            <MetricCard icon={Mail} label="Total emails" value={totals.emails} />
            <MetricCard icon={Users} label="Walk-ins" value={totals.walkIns} />
            <MetricCard icon={Star} label="Reviews" value={totals.reviews} />
          </div>
          <div className="text-xs text-gray-500">
            Based on <span className="font-semibold text-gray-700">{totals.reports}</span> reports · {totals.converted} leads converted · social posted {totals.social} days
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">Monthly trends</div>
            {trendData.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-8">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="calls" fill="#f1889b" name="Calls" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="emails" fill="#f7b1bd" name="Emails" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="walkIns" fill="#fbcfd5" name="Walk-ins" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted" fill="#c45a6e" name="Converted" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* AI summary */}
          <div className="bg-gradient-to-br from-[#fbe0e2]/40 to-white rounded-2xl border border-[#f1889b]/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Sparkles className="w-4 h-4 text-[#f1889b]" /> AI summary of reported items
              </div>
              <Button size="sm" onClick={generateSummary} disabled={loadingAi}
                className="bg-[#f1889b] hover:bg-[#e0758a] text-white rounded-lg h-8">
                {loadingAi ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing…</> : (aiSummary ? 'Regenerate' : 'Generate')}
              </Button>
            </div>

            {!aiSummary && !loadingAi && (
              <div className="text-sm text-gray-500">Click Generate to summarize common incidents, feedback, inventory issues, and conversion blockers across all reports.</div>
            )}

            {aiSummary && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">{aiSummary.overview}</p>
                <ThemeList title="Common incidents" items={aiSummary.common_incidents} />
                <ThemeList title="Client feedback" items={aiSummary.common_feedback} />
                <ThemeList title="Low inventory" items={aiSummary.common_inventory} />
                <ThemeList title="Conversion blockers" items={aiSummary.conversion_blockers} />
                {aiSummary.recommendations?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Recommendations</div>
                    <ul className="space-y-1">
                      {aiSummary.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-[#f1889b]">•</span> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
      <Icon className="w-4 h-4 text-[#f1889b] mx-auto mb-1" />
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function ThemeList({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-700">
            {it.item}
            {it.count > 1 && <span className="bg-[#fbe0e2] text-[#c45a6e] font-semibold rounded-full px-1.5 text-[10px]">{it.count}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}