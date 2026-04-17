import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';

export default function StickyNotesWidget({ widget }) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (widget?.data) {
      try {
        const parsed = JSON.parse(widget.data);
        setNote(parsed.text || '');
      } catch (e) {
        setNote(widget.data);
      }
    }
  }, [widget?.data]);

  const handleSave = async (newText) => {
    setNote(newText);
    if (widget?.id) {
      await base44.entities.UserWidget.update(widget.id, {
        data: JSON.stringify({ text: newText })
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fef08a] text-gray-800">
      <div className="bg-[#fde047] px-3 py-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center justify-between">
        Quick Note
      </div>
      <Textarea
        value={note}
        onChange={(e) => handleSave(e.target.value)}
        placeholder="Type a note here..."
        className="flex-1 bg-transparent border-none focus-visible:ring-0 resize-none p-3 text-sm placeholder:text-gray-500 rounded-none shadow-none"
      />
    </div>
  );
}