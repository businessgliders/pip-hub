import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Send } from "lucide-react";
import { relativeTime } from "./inboxConfig";

export default function InternalNotesTab({ notes, loading, onAdd, posting }) {
  const [body, setBody] = useState("");

  const submit = () => {
    if (!body.trim()) return;
    onAdd(body.trim());
    setBody("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="h-16 bg-amber-50 rounded-xl animate-pulse" />
        ) : !notes || notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <StickyNote className="w-10 h-10 mb-2" />
            <p className="text-sm">No internal notes yet.</p>
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-800">{n.author_name || n.author_email}</span>
                <span className="text-[11px] text-amber-600">{relativeTime(n.created_date)}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.body}</p>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-slate-200 p-3 bg-white">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a private note (admins only)…"
          className="resize-none h-20 bg-amber-50/50 border-amber-200"
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={submit} disabled={posting || !body.trim()} className="gap-1.5">
            <Send className="w-3.5 h-3.5" /> Post note
          </Button>
        </div>
      </div>
    </div>
  );
}