import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Mail, AlertCircle } from 'lucide-react';

const statusConfig = {
  new: { icon: Mail, color: 'text-pink-600', bg: 'bg-pink-50', label: 'New' },
  processed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Replied' },
  ignored: { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Ignored' },
  error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Error' },
};

export default function EmailListItem({ email, isSelected, onClick }) {
  const status = statusConfig[email.status] || statusConfig.new;
  const StatusIcon = status.icon;
  const isUnread = email.status === 'new';

  const received = email.received_at ? new Date(email.received_at) : new Date(email.created_date);
  const timeAgo = formatDistanceToNow(received, { addSuffix: true });

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors',
        isSelected && 'bg-pink-50 hover:bg-pink-50 border-l-4 border-l-pink-500',
        !isSelected && isUnread && 'bg-white',
        !isSelected && !isUnread && 'bg-slate-50/40'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', status.bg)}>
            <StatusIcon className={cn('w-3.5 h-3.5', status.color)} />
          </div>
          <span className={cn(
            'text-sm truncate',
            isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
          )}>
            {email.from_name || email.from_email}
          </span>
        </div>
        <span className="text-xs text-slate-400 shrink-0">{timeAgo}</span>
      </div>
      <div className={cn(
        'text-sm truncate pl-9',
        isUnread ? 'text-slate-800 font-medium' : 'text-slate-600'
      )}>
        {email.subject || '(no subject)'}
      </div>
      <div className="text-xs text-slate-500 truncate pl-9 mt-0.5">
        {email.snippet}
      </div>
      {email.matched_recipient && (
        <div className="pl-9 mt-1.5">
          <Badge variant="outline" className="text-[10px] font-normal text-slate-500 border-slate-200">
            → {email.matched_recipient}
          </Badge>
        </div>
      )}
    </button>
  );
}