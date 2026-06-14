import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Send, Trash2, Check, X, Pencil } from "lucide-react";
import { relativeTime } from "./inboxConfig";

export default function ContactNotes({ threadId }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["thread-notes", threadId],
    queryFn: () => base44.entities.InternalNote.filter({ thread_id: threadId }, "-created_date"),
    initialData: [],
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["thread-notes", threadId] });

  const addMutation = useMutation({
    mutationFn: (text) => base44.entities.InternalNote.create({
      thread_id: threadId, body: text,
      author_email: currentUser?.email, author_name: currentUser?.full_name,
    }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, text }) => base44.entities.InternalNote.update(id, { body: text }),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InternalNote.delete(id),
    onSuccess: invalidate,
  });

  const submit = () => {
    if (!body.trim()) return;
    addMutation.mutate(body.trim());
    setBody("");
  };

  return (
    <div className="px-4 py-4 border-b border-slate-100">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <StickyNote className="w-3.5 h-3.5" /> Internal Notes
      </h4>

      <div className="mb-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a private note (admins only)…"
          className="resize-none h-16 text-sm bg-amber-50/50 border-amber-200"
        />
        <div className="flex justify-end mt-1.5">
          <Button size="sm" onClick={submit} disabled={addMutation.isPending || !body.trim()} className="gap-1.5 h-7 text-xs">
            <Send className="w-3 h-3" /> Post
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="h-14 bg-amber-50 rounded-lg animate-pulse" />
        ) : notes.length === 0 ? (
          <p className="text-xs text-slate-400">No notes yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-amber-800 truncate">{n.author_name || n.author_email}</span>
                <span className="text-[10px] text-amber-600">{relativeTime(n.created_date)}</span>
              </div>
              {editingId === n.id ? (
                <div>
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="resize-none h-16 text-sm bg-white border-amber-200"
                  />
                  <div className="flex justify-end gap-1 mt-1.5">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingId(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                    <Button size="sm" className="h-6 px-2 text-xs gap-1" disabled={!editBody.trim()} onClick={() => updateMutation.mutate({ id: n.id, text: editBody.trim() })}>
                      <Check className="w-3 h-3" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.body}</p>
                  <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(n.id); setEditBody(n.body); }} className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => deleteMutation.mutate(n.id)} className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}