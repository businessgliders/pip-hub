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
        <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {l}
          <button onClick={() => onChange(labels.filter((x) => x !== l))} className="hover:text-red-500">
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
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs text-slate-400 border border-dashed border-slate-300 hover:text-slate-600">
          <Plus className="w-3 h-3" /> Tag
        </button>
      )}
    </div>
  );
}