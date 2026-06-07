import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Fetches recent inbound EmailMessages and computes which are unread for the current user.
 * Unread = direction === 'inbound' AND currentUser.email NOT in message.read_by.
 */
export function useUnreadMessages(currentUserEmail) {
  const queryClient = useQueryClient();

  const { data: inboundMessages = [] } = useQuery({
    queryKey: ['inbound-messages'],
    queryFn: () => base44.entities.EmailMessage.filter({ direction: 'inbound' }, '-sent_at', 200),
    refetchInterval: 15000,
    initialData: [],
    enabled: !!currentUserEmail,
  });

  const unreadMessages = useMemo(() => {
    if (!currentUserEmail) return [];
    return inboundMessages.filter(m => {
      const readBy = Array.isArray(m.read_by) ? m.read_by : [];
      return !readBy.includes(currentUserEmail);
    });
  }, [inboundMessages, currentUserEmail]);

  const unreadCountByTicket = useMemo(() => {
    const map = {};
    unreadMessages.forEach(m => {
      if (!m.ticket_id) return;
      map[m.ticket_id] = (map[m.ticket_id] || 0) + 1;
    });
    return map;
  }, [unreadMessages]);

  const markAsRead = async (messageId) => {
    if (!currentUserEmail || !messageId) return;
    const msg = inboundMessages.find(m => m.id === messageId);
    if (!msg) return;
    const readBy = Array.isArray(msg.read_by) ? msg.read_by : [];
    if (readBy.includes(currentUserEmail)) return;
    const readAt = Array.isArray(msg.read_at) ? msg.read_at : [];
    await base44.entities.EmailMessage.update(messageId, {
      read_by: [...readBy, currentUserEmail],
      read_at: [...readAt, { email: currentUserEmail, timestamp: new Date().toISOString() }],
    });
    queryClient.invalidateQueries({ queryKey: ['inbound-messages'] });
    queryClient.invalidateQueries({ queryKey: ['email-messages', msg.ticket_id] });
  };

  return { unreadMessages, unreadCountByTicket, totalUnread: unreadMessages.length, markAsRead };
}