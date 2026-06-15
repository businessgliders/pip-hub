import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';

const LS_KEY = 'pip-sticky-note';

export default function StickyNotesWidget({ widget }) {
  const [note, setNote] = useState('');

  // Load note: prefer the widget's saved data; if empty (e.g. just re-added),
  // fall back to the locally retained text so it isn't lost on delete/re-add.
  useEffect(() => {
    let saved = '';
    if (widget?.data) {
      try {
        saved = JSON.parse(widget.data).text || '';
      } catch {
        saved = widget.data;
      }
    }
    if (!saved) {
      try { saved = localStorage.getItem(LS_KEY) || ''; } catch { /* ignore */ }
    }
    setNote(saved);
    // If the widget had no data but we recovered text locally, persist it back.
    if (!getWidgetText(widget) && saved && widget?.id) {
      base44.entities.UserWidget.update(widget.id, { data: JSON.stringify({ text: saved }) }).catch(() => {});
    }
  }, [widget?.data, widget?.id]);

  const handleSave = async (newText) => {
    setNote(newText);
    try { localStorage.setItem(LS_KEY, newText); } catch { /* ignore */ }
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

function getWidgetText(widget) {
  if (!widget?.data) return '';
  try { return JSON.parse(widget.data).text || ''; } catch { return widget.data; }
}