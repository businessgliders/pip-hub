import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function StatusChangeDialog({ data, onConfirm, onCancel }) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (data) { setName(''); setNote(''); }
  }, [data]);

  if (!data) return null;

  return (
    <Dialog open={!!data} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="backdrop-blur-2xl bg-white/95 border-white/40 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Confirm Status Change</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Moving <strong>{data.client_name}</strong> from{' '}
            <span className="font-semibold text-blue-600">{data.oldStatus}</span> to{' '}
            <span className="font-semibold text-green-600">{data.newStatus}</span>
          </p>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Your name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Who is making this change?" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Note *</label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Why are you changing the status?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            disabled={!name.trim() || !note.trim()}
            onClick={() => onConfirm({ name: name.trim(), note: note.trim() })}
            style={{ background: 'linear-gradient(135deg, #f1889b, #e86c84)', color: 'white' }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}