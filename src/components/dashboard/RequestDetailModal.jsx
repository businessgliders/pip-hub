import { useEffect } from 'react';
import { X, User, Calendar, Tag, Users, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

/**
 * RequestDetailModal — PHASE 3 PLACEHOLDER.
 * Currently shows the lead's fields. The full pip-events email + AI
 * conversation panel will replace this body in the next phase.
 */
export default function RequestDetailModal({ request, onClose }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  const submittedAt = request.submitted_date || request.created_date;

  const Row = ({ icon: Icon, label, value }) => value ? (
    <div className="flex items-start gap-3 py-2 border-b border-pink-100/60">
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#e86c84' }} />
      <div>
        <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: '#c48a96' }}>{label}</p>
        <p className="text-sm" style={{ color: '#5a3535' }}>{value}</p>
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col"
        style={{ maxWidth: '620px', maxHeight: '90vh', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(251,224,226,0.5), rgba(255,255,255,0.95))', borderBottom: '1px solid rgba(247,177,189,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)' }}>
              <User className="w-5 h-5" style={{ color: '#e86c84' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight" style={{ color: '#6b4e4e' }}>{request.full_name || request.name}</h2>
              <p className="text-xs mt-0.5" style={{ color: '#c48a96' }}>
                {request.event_type} · {request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50">
            <X className="w-5 h-5" style={{ color: '#c48a96' }} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <Row icon={Mail} label="Email" value={request.email} />
          <Row icon={Phone} label="Phone" value={request.phone} />
          <Row icon={Tag} label="Event Type" value={request.event_type} />
          <Row icon={Users} label="Guests" value={request.number_of_guests ?? request.guest_count} />
          <Row icon={Calendar} label="Submitted" value={submittedAt ? format(new Date(submittedAt), 'PPp') : null} />
          {request.message && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: '#c48a96' }}>Message</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#5a3535' }}>{request.message}</p>
            </div>
          )}
          <p className="text-xs text-center mt-6 text-gray-400">Email &amp; AI conversation coming in the next phase.</p>
        </div>
      </div>
    </div>
  );
}