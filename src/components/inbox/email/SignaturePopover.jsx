import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { PenLine, Loader2, Check } from 'lucide-react';

// Default signature derived from the logged-in user (mirrors the server-side
// fallback in sendThreadReply). Used as a placeholder when no custom signature
// has been saved yet.
function firstNameFor(user) {
  const email = String(user?.email || '').toLowerCase();
  if (email === 'info@pilatesinpinkstudio.com') return 'Front Desk';
  const full = String(user?.full_name || '').trim();
  if (full) return full.split(/\s+/)[0];
  return String(user?.email || '').split('@')[0] || '';
}

export function defaultSignatureText(user) {
  return `Best,\n${firstNameFor(user)}\nPilates in Pink™`;
}

export default function SignaturePopover({ currentUser }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setValue(currentUser?.email_signature || defaultSignatureText(currentUser));
  }, [currentUser]);

  useEffect(() => {
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ email_signature: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Edit signature"
        className="flex items-center gap-1 max-w-[120px] h-7 px-1.5 rounded-full transition-all bg-pink-50 dark:bg-white/10 text-pink-700/80 dark:text-white/70 border border-pink-200/70 dark:border-white/15 hover:bg-pink-100"
      >
        <PenLine className="w-3 h-3 shrink-0" />
        <span className="text-[9px] leading-[1.05] text-left whitespace-pre-line line-clamp-3 overflow-hidden">
          {value || defaultSignatureText(currentUser)}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-72 bg-white dark:bg-neutral-900 border border-pink-200/70 dark:border-white/15 rounded-xl shadow-xl p-3">
          <p className="text-xs font-semibold text-pink-900 dark:text-white mb-2">Email signature</p>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full text-sm rounded-lg border border-pink-200/60 dark:border-white/15 bg-white dark:bg-neutral-900 text-pink-900 dark:text-white px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-pink-300 resize-none"
            placeholder="Best,&#10;Your name&#10;Pilates in Pink™"
          />
          <p className="text-[11px] text-pink-500/70 dark:text-white/40 mt-1.5">Auto-appended to every reply you send.</p>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}