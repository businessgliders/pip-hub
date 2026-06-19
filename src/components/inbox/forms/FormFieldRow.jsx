import React from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FIELD_TYPES, hasOptions } from "./formFieldTypes";

// Editable row for a single form field in the builder preview.
export default function FormFieldRow({ field, accent, onChange, onRemove }) {
  const set = (patch) => onChange({ ...field, ...patch });

  return (
    <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 p-3 space-y-2.5">
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 mt-2.5 text-pink-900/30 dark:text-white/30 shrink-0" />
        <Input
          value={field.label}
          onChange={(e) => set({ label: e.target.value })}
          placeholder="Field label"
          className="flex-1 bg-transparent"
        />
        <button
          onClick={onRemove}
          title="Remove field"
          className="p-2 rounded-lg text-pink-900/40 dark:text-white/40 hover:text-red-500 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 pl-6 flex-wrap">
        <Select value={field.type} onValueChange={(v) => set({ type: v })}>
          <SelectTrigger className="w-40 h-9 bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-xs font-medium text-pink-900/70 dark:text-white/70">
          <Switch
            checked={!!field.required}
            onCheckedChange={(v) => set({ required: v })}
            style={field.required ? { backgroundColor: accent } : undefined}
          />
          Required
        </label>
      </div>

      {hasOptions(field.type) && (
        <div className="pl-6">
          <Input
            value={(field.options || []).join(", ")}
            onChange={(e) => set({ options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="Option 1, Option 2, Option 3"
            className="bg-transparent text-sm"
          />
          <p className="text-[11px] text-pink-900/40 dark:text-white/40 mt-1">Separate choices with commas</p>
        </div>
      )}
    </div>
  );
}