import React, { useState, useRef, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, MessageSquare, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'Which admin converts the most leads?',
  'What are the most common incidents this month?',
  'How have walk-ins trended over time?',
  'What inventory keeps running low?',
];

// Compact the reports into a token-friendly dataset for the LLM.
function buildDataset(reports) {
  return reports.map(r => ({
    date: r.shift_date,
    time: r.shift_time,
    admin: r.admin_name,
    location: r.location,
    calls: r.calls_handled,
    emails: r.total_emails,
    walk_ins: r.total_walk_ins,
    leads_converted: r.leads_converted,
    reviews: r.reviews_solicited,
    social: !!r.posted_social_media,
    conversion_notes: r.conversion_notes,
    low_inventory: r.low_inventory_items,
    incidents: r.incidents || (r.incidents_list || []).join('; '),
    feedback: r.feedback || (r.feedback_list || []).join('; '),
    general_notes: r.general_notes,
  }));
}

export default function ReportsChatPanel({ reports }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const dataset = useMemo(() => buildDataset(reports), [reports]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async (question) => {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    const history = [...messages, { role: 'user', content: q }];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const priorTurns = history.slice(-8).map(m => `${m.role === 'user' ? 'Q' : 'A'}: ${m.content.replace(/<[^>]+>/g, ' ')}`).join('\n');
      const answer = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a data analyst for a Pilates studio. Answer the user's question using ONLY the end-of-day shift report data below. Be specific, cite numbers, attribute to the admin/submitter where relevant, and identify trends over time when asked. If the data can't answer the question, say so briefly.\n\nFormat your answer as clean HTML using these tags only: <p>, <strong>, <em>, <ul>, <ol>, <li>, <br>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <h4>. Use a <table> when comparing numbers across admins or months. Do NOT include <html>, <head>, <body>, or markdown fences.\n\nConversation so far:\n${priorTurns}\n\nShift report data (JSON):\n${JSON.stringify(dataset)}`,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: String(answer || '') }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '<p>Sorry, something went wrong fetching that answer. Please try again.</p>' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-1 pb-3 mb-1 border-b border-gray-100 shrink-0">
        <MessageSquare className="w-4 h-4 text-[#f1889b]" />
        <div className="text-sm font-semibold text-gray-700">Ask the data</div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 px-0.5 pr-1">
        {messages.length === 0 && !loading && (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4 text-[#f1889b] mt-0.5 shrink-0" />
              <p>Ask anything about all end-of-day reports — trends, per-admin performance, common issues, inventory, and more.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)}
                  className="text-[11px] bg-[#fbe0e2]/60 hover:bg-[#fbe0e2] text-[#c45a6e] rounded-full px-2.5 py-1 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] bg-[#f1889b] text-white rounded-2xl rounded-br-md px-3 py-2 text-sm">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div
                className="max-w-[92%] bg-white border border-gray-100 rounded-2xl rounded-bl-md px-3 py-2 text-sm text-gray-700 shadow-sm eod-chat-html"
                dangerouslySetInnerHTML={{ __html: m.content }}
              />
            </div>
          )
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-3 py-2 text-sm text-gray-400 shadow-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing reports…
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); ask(); }}
        className="mt-3 flex items-center gap-2 shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the report data…"
          className="flex-1 px-3 py-2 rounded-full text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f1889b]/40 text-gray-800"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-full bg-[#f1889b] hover:bg-[#e0758a] text-white flex items-center justify-center disabled:opacity-40 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}