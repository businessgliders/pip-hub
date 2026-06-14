import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ContactLabels({ labels = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const add = () => {
    const v = value.trim();
    if (v && !labels.includes(v)) onChange([...labels, v]);
    setValue("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {labels.map((l) => (
        <span key={l} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-100/80 text-pink-700 border border-pink-200/70">
          {l}
          <button onClick={() => onChange(labels.filter((x) => x !== l))} className="hover:text-rose-600">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <Input
          autoFocus value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={add}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Label"
          className="h-6 w-20 text-xs px-2"
        />
      ) : (
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-xs text-pink-400 dark:text-pink-300/80 border border-dashed border-pink-300 dark:border-pink-300/40 hover:text-pink-600 hover:border-pink-400 dark:hover:text-pink-200">
          <Plus className="w-3 h-3" /> Tag
        </button>
      )}
    </div>
  );
}