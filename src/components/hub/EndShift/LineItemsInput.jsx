import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LineItemsInput({ items = [], onChange, placeholder = 'Add an item' }) {
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...(items || []), v]);
    setDraft('');
  };

  const removeItem = (idx) => {
    const next = [...items];
    next.splice(idx, 1);
    onChange(next);
  };

  const updateItem = (idx, value) => {
    const next = [...items];
    next[idx] = value;
    onChange(next);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-2">
      {items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100"
            >
              <span className="mt-2 w-5 h-5 rounded-full bg-[#f1889b]/10 text-[#f1889b] text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <Input
                value={item}
                onChange={(e) => updateItem(idx, e.target.value)}
                className="bg-white"
                style={{ fontSize: '16px' }}
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="mt-1.5 w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 flex-shrink-0"
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{ fontSize: '16px' }}
        />
        <Button
          type="button"
          onClick={addItem}
          disabled={!draft.trim()}
          className="rounded-xl bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] text-white hover:opacity-90 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-1" /> Add item
        </Button>
      </div>
    </div>
  );
}