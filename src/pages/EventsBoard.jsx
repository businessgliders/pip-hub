import { useState, useMemo, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Search, LayoutGrid, Archive, ArrowLeft } from 'lucide-react';
import MasterKanbanBoard from '@/components/master-kanban/MasterKanbanBoard';
import TicketCardContent from '@/components/board/TicketCardContent';
import { COLUMN_COLOR_CLASSES, COLUMN_HEADER_CLASSES, DEFAULT_COLOR, DEFAULT_HEADER } from '@/components/board/columnTheme';
import HostedSidePanel from '@/components/board/HostedSidePanel';
import ArchivedTicketsList from '@/components/board/ArchivedTicketsList';
import StatusChangeDialog from '@/components/board/StatusChangeDialog';
import AddonLegend from '@/components/board/AddonLegend';
import RequestDetailModal from '@/components/dashboard/RequestDetailModal';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const STATUS_COLUMNS = ['New', 'In Conversations', 'Waiting for Payment', 'Confirmed', 'Closed', 'Hosted'];
const BOARD_COLUMNS = STATUS_COLUMNS.filter(c => c !== 'Hosted');

export default function EventsBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('board'); // 'board' | 'archive'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [focusComposer, setFocusComposer] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);
  const [orderOverrides, setOrderOverrides] = useState({});
  const { unreadCountByTicket } = useUnreadMessages(user?.email);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Request Board';
    return () => { document.title = prev; };
  }, []);

  const { data: allTickets = [], isLoading } = useQuery({
    queryKey: ['eventLeads'],
    queryFn: () => base44.entities.EventLead.list('-created_date', 500),
    refetchInterval: 5000,
  });

  // Normalize legacy "Pending" → "In Conversations" + mirror name → full_name
  const tickets = useMemo(
    () => allTickets.map(t => ({
      ...t,
      full_name: t.full_name || t.name,
      number_of_guests: t.number_of_guests ?? t.guest_count,
      status: t.status === 'Pending' ? 'In Conversations' : t.status,
    })),
    [allTickets]
  );

  const matchesSearch = (t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.full_name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.event_type?.toLowerCase().includes(q) ||
      String(t.ticket_number || '').includes(q)
    );
  };

  const activeTickets = useMemo(
    () => tickets.filter(t => !t.archived && t.status !== 'Cancelled' && matchesSearch(t)),
    [tickets, search]
  );

  const archivedTickets = useMemo(
    () => tickets.filter(t => t.archived && t.status !== 'Cancelled' && matchesSearch(t)),
    [tickets, search]
  );

  const cancelledTickets = useMemo(
    () => tickets.filter(t => t.status === 'Cancelled' && matchesSearch(t)),
    [tickets, search]
  );

  const ticketsByColumn = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach(c => (map[c] = []));
    activeTickets.forEach(t => {
      if (map[t.status]) map[t.status].push(t);
    });
    const defaultCmp = (a, b, key) => {
      const aTime = new Date(a[key] || a.created_date || 0).getTime();
      const bTime = new Date(b[key] || b.created_date || 0).getTime();
      return bTime - aTime;
    };
    Object.keys(map).forEach(k => {
      const sortKey = k === 'In Conversations' ? 'updated_date' : 'submitted_date';
      map[k].sort((a, b) => {
        const aMan = orderOverrides[a.id] !== undefined
          ? orderOverrides[a.id]
          : (typeof a.manual_order === 'number' ? a.manual_order : null);
        const bMan = orderOverrides[b.id] !== undefined
          ? orderOverrides[b.id]
          : (typeof b.manual_order === 'number' ? b.manual_order : null);
        if (aMan !== null && bMan !== null) return aMan - bMan;
        if (aMan !== null) return -1;
        if (bMan !== null) return 1;
        return defaultCmp(a, b, sortKey);
      });
    });
    return map;
  }, [activeTickets, orderOverrides]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const ticket = activeTickets.find(t => t.id === draggableId);
    if (!ticket) return;
    const newStatus = destination.droppableId;

    // Same-column reorder → persist manual_order
    if (ticket.status === newStatus) {
      const columnTickets = ticketsByColumn[newStatus] || [];
      const reordered = Array.from(columnTickets);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      const orderMap = {};
      reordered.forEach((t, i) => { orderMap[t.id] = i; });
      flushSync(() => {
        setOrderOverrides(prev => ({ ...prev, ...orderMap }));
      });

      await Promise.all(
        reordered.map((t, i) => base44.entities.EventLead.update(t.id, { manual_order: i }))
      );
      await queryClient.invalidateQueries({ queryKey: ['eventLeads'] });
      setOrderOverrides(prev => {
        const next = { ...prev };
        Object.keys(orderMap).forEach(id => { delete next[id]; });
        return next;
      });
      return;
    }

    // Cross-column → open status-change dialog
    setPendingStatusChange({
      ticketId: ticket.id,
      client_name: ticket.full_name,
      oldStatus: ticket.status,
      newStatus,
    });
  };

  const confirmStatusChange = async ({ name, note }) => {
    const { ticketId, newStatus } = pendingStatusChange;
    const ticket = tickets.find(t => t.id === ticketId);
    const history = ticket?.status_history || [];
    await base44.entities.EventLead.update(ticketId, {
      status: newStatus,
      manual_order: null,
      status_history: [
        ...history,
        { status: newStatus, note, name, timestamp: new Date().toISOString() },
      ],
    });
    setPendingStatusChange(null);
    setHighlightedTicketId(ticketId);
    setTimeout(() => setHighlightedTicketId(null), 2000);
    queryClient.invalidateQueries({ queryKey: ['eventLeads'] });
  };

  const handleArchiveAll = async () => {
    const closed = ticketsByColumn['Closed'] || [];
    if (!closed.length) return;
    if (!confirm(`Archive ${closed.length} request${closed.length === 1 ? '' : 's'}?`)) return;
    await Promise.all(closed.map(t => base44.entities.EventLead.update(t.id, { archived: true })));
    queryClient.invalidateQueries({ queryKey: ['eventLeads'] });
  };

  const handleRestore = async (ticket) => {
    await base44.entities.EventLead.update(ticket.id, { archived: false });
    queryClient.invalidateQueries({ queryKey: ['eventLeads'] });
  };

  const columns = BOARD_COLUMNS.map(status => ({
    status,
    tickets: ticketsByColumn[status] || [],
    colorClasses: COLUMN_COLOR_CLASSES[status] || DEFAULT_COLOR,
    headerClasses: COLUMN_HEADER_CLASSES[status] || DEFAULT_HEADER,
    emptyLabel: 'No requests',
  }));

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fdf2f6 0%, #fce7ef 45%, #f9d9e6 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/40 border-b border-white/40 px-4 md:px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-pink-700 hover:text-pink-900">
            <ArrowLeft className="w-4 h-4" /> Hub
          </Link>
          <h1 className="text-lg font-bold" style={{ color: '#5a3535' }}>Request Board</h1>

          {/* View toggle */}
          <div className="inline-flex rounded-full overflow-hidden bg-white/50 ml-auto">
            <button
              onClick={() => setView('board')}
              className={`px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-colors ${view === 'board' ? 'text-white' : 'text-pink-700'}`}
              style={view === 'board' ? { background: 'linear-gradient(135deg, #f1889b, #e86c84)' } : undefined}
            >
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
            <button
              onClick={() => setView('archive')}
              className={`px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-colors ${view === 'archive' ? 'text-white' : 'text-pink-700'}`}
              style={view === 'archive' ? { background: 'linear-gradient(135deg, #f1889b, #e86c84)' } : undefined}
            >
              <Archive className="w-4 h-4" /> Archive
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white/70 border border-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6">
        {view === 'board' ? (
          <>
            {view === 'board' && (ticketsByColumn['Closed'] || []).length > 0 && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleArchiveAll}
                  className="text-xs font-semibold text-pink-700 hover:text-pink-900 inline-flex items-center gap-1"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive all Closed
                </button>
              </div>
            )}
            <MasterKanbanBoard
              columns={columns}
              onDragEnd={handleDragEnd}
              isLoading={isLoading}
              highlightedTicketId={highlightedTicketId}
              unreadByTicket={unreadCountByTicket}
              onTicketClick={setSelectedRequest}
              renderCardContent={(ticket) => (
                <TicketCardContent ticket={ticket} viewMode="status" unreadCount={unreadCountByTicket[ticket.id] || 0} />
              )}
              boardHeightClasses="h-[calc(100dvh-200px)] md:h-[calc(100dvh-180px)]"
            />
            <AddonLegend />
            <HostedSidePanel
              tickets={ticketsByColumn['Hosted'] || []}
              onTicketClick={setSelectedRequest}
              highlightedTicketId={highlightedTicketId}
              unreadCountByTicket={unreadCountByTicket}
              onDragEnd={handleDragEnd}
            />
          </>
        ) : (
          <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 160px)' }}>
            <ArchivedTicketsList
              tickets={archivedTickets}
              cancelledTickets={cancelledTickets}
              onView={setSelectedRequest}
              onRestore={handleRestore}
            />
          </div>
        )}
      </div>

      <StatusChangeDialog
        data={pendingStatusChange}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatusChange(null)}
      />

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          focusComposer={focusComposer}
          onClose={() => { setSelectedRequest(null); setFocusComposer(false); }}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ['eventLeads'] })}
        />
      )}
    </div>
  );
}