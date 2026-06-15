import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { StickyNote, Send } from "lucide-react";
import { relativeTime } from "./inboxConfig";

export default function ContactNotes({ threadId, accent }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

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

  const submit = () => {
    if (!body.trim()) return;
    addMutation.mutate(body.trim());
    setBody("");
  };

  return (
    <div className="px-4 py-3 border-b border-white/50 dark:border-white/15" style={accent ? { color: accent } : undefined}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 opacity-60 dark:text-white/60">
        <StickyNote className="w-3.5 h-3.5" /> Internal Notes
      </h4>

      {/* Inline single-line composer */}
      <div className="relative mb-2.5">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder="Add a private note…"
          className="h-9 pr-9 text-sm rounded-full bg-amber-50/50 border-amber-200 dark:bg-amber-300/10 dark:border-amber-300/30 dark:text-white dark:placeholder:text-white/40"
        />
        <button
          onClick={submit}
          disabled={addMutation.isPending || !body.trim()}
          title="Post note"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-pink-900/90 text-white hover:bg-pink-900 disabled:opacity-40 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5">
        {isLoading ? (
          <div className="h-9 bg-amber-50/60 rounded-lg animate-pulse" />
        ) : notes.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-white/50">No notes yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-white/60 bg-white/40 dark:border-white/10 dark:bg-white/5 px-2.5 py-1.5">
              <p className="text-[13px] leading-snug dark:text-white/85 whitespace-pre-wrap" style={accent ? { color: accent } : undefined}>{n.body}</p>
              <span className="block text-[10px] opacity-45 dark:text-white/40 mt-0.5">{n.author_name || n.author_email} · {relativeTime(n.created_date)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}