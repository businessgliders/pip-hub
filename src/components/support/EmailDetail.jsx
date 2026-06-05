import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Reply, CheckCircle2, Archive, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EmailDetail({ email, onUpdate }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Select an email to view it
      </div>
    );
  }

  const received = email.received_at ? new Date(email.received_at) : new Date(email.created_date);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const replyHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #374151; font-size: 14px; line-height: 1.6;">
        ${replyText.replace(/\n/g, '<br>')}
        <br><br>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 16px; color: #6b7280; font-size: 12px;">
          Pilates in Pink™ Support<br>
          <a href="https://pilatesinpinkstudio.com" style="color: #f1889b;">pilatesinpinkstudio.com</a>
        </div>
      </div>`;

      const res = await base44.functions.invoke('sendSupportReply', {
        emailId: email.id,
        replyHtml,
      });

      if (res.data?.success) {
        toast.success('Reply sent');
        setReplyOpen(false);
        setReplyText('');
        onUpdate?.();
      } else {
        toast.error(res.data?.error || 'Failed to send reply');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleMarkProcessed = async () => {
    setMarking(true);
    try {
      await base44.entities.IncomingEmail.update(email.id, { status: 'processed' });
      toast.success('Marked as processed');
      onUpdate?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-xl font-semibold text-slate-900 leading-tight">
            {email.subject || '(no subject)'}
          </h2>
          <Badge
            variant="outline"
            className={
              email.status === 'processed'
                ? 'bg-green-50 text-green-700 border-green-200'
                : email.status === 'new'
                ? 'bg-pink-50 text-pink-700 border-pink-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }
          >
            {email.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-semibold text-xs">
            {(email.from_name || email.from_email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 truncate">
              {email.from_name || email.from_email}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {email.from_name ? email.from_email : ''} → {email.matched_recipient}
            </div>
          </div>
          <div className="text-xs text-slate-400 shrink-0">
            {format(received, 'MMM d, yyyy · h:mm a')}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {email.body_html ? (
          <div
            className="prose prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: email.body_html }}
          />
        ) : email.body_text ? (
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
            {email.body_text}
          </pre>
        ) : (
          <div className="text-sm text-slate-500 italic">{email.snippet}</div>
        )}
      </div>

      {/* Reply composer */}
      {replyOpen && (
        <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
          <div className="text-xs text-slate-500 mb-2">
            Replying to <span className="font-medium text-slate-700">{email.from_email}</span> as <span className="font-medium text-slate-700">support@pilatesinpinkstudio.com</span>
          </div>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            className="min-h-32 bg-white border-slate-200"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => { setReplyOpen(false); setReplyText(''); }} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSendReply} disabled={sending || !replyText.trim()} className="bg-pink-500 hover:bg-pink-600 text-white">
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Reply className="w-4 h-4 mr-2" />}
              Send Reply
            </Button>
          </div>
        </div>
      )}

      {/* Footer actions */}
      {!replyOpen && (
        <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between bg-white">
          <div className="text-xs text-slate-400">
            {email.processing_notes || ''}
          </div>
          <div className="flex items-center gap-2">
            {email.status !== 'processed' && (
              <Button variant="outline" size="sm" onClick={handleMarkProcessed} disabled={marking}>
                {marking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Mark Processed
              </Button>
            )}
            <Button onClick={() => setReplyOpen(true)} className="bg-pink-500 hover:bg-pink-600 text-white" size="sm">
              <Reply className="w-4 h-4 mr-2" />
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}