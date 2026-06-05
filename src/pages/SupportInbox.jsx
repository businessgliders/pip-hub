import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Inbox, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmailListItem from '@/components/support/EmailListItem';
import EmailDetail from '@/components/support/EmailDetail';

const FILTERS = [
  { key: 'new', label: 'New' },
  { key: 'all', label: 'All' },
  { key: 'processed', label: 'Replied' },
];

export default function SupportInbox() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('new');
  const [search, setSearch] = useState('');

  const { data: emails = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['supportEmails'],
    queryFn: () => base44.entities.IncomingEmail.filter({ spoke_key: 'support' }, '-received_at', 200),
  });

  const filtered = useMemo(() => {
    let list = emails;
    if (filter === 'new') list = list.filter(e => e.status === 'new');
    else if (filter === 'processed') list = list.filter(e => e.status === 'processed');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.subject || '').toLowerCase().includes(q) ||
        (e.from_email || '').toLowerCase().includes(q) ||
        (e.from_name || '').toLowerCase().includes(q) ||
        (e.snippet || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, filter, search]);

  const selected = useMemo(
    () => emails.find(e => e.id === selectedId) || null,
    [emails, selectedId]
  );

  const newCount = useMemo(() => emails.filter(e => e.status === 'new').length, [emails]);

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['supportEmails'] });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            ← Hub
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
              <Inbox className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-tight">Support Inbox</div>
              <div className="text-xs text-slate-500 leading-tight">support@pilatesinpinkstudio.com</div>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </header>

      {/* Main 2-pane layout */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar list */}
        <aside className="w-96 border-r border-slate-200 bg-white flex flex-col min-h-0">
          {/* Filters */}
          <div className="px-4 py-3 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, sender, body..."
                className="pl-9 h-9 bg-slate-50 border-slate-200"
              />
            </div>
            <div className="flex items-center gap-1">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    filter === f.key
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                  {f.key === 'new' && newCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-pink-500 text-white rounded-full text-[10px] font-semibold">
                      {newCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading emails...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                {emails.length === 0
                  ? 'No support emails yet. They\'ll appear here when clients reply.'
                  : 'No emails match this filter.'}
              </div>
            ) : (
              filtered.map(email => (
                <EmailListItem
                  key={email.id}
                  email={email}
                  isSelected={selectedId === email.id}
                  onClick={() => setSelectedId(email.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Detail pane */}
        <main className="flex-1 flex flex-col min-h-0">
          <EmailDetail email={selected} onUpdate={handleUpdate} />
        </main>
      </div>
    </div>
  );
}