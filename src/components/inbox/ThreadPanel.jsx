import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ThreadHeader from "./ThreadHeader";
import EmailThreadTab from "./EmailThreadTab";
import InternalNotesTab from "./InternalNotesTab";
import SubmissionDetails from "./SubmissionDetails";
import ComposeFooter from "./ComposeFooter";
import { MessagesSquare } from "lucide-react";
import { toast } from "sonner";

const BODY_TABS = [
  { key: "email", label: "Email" },
  { key: "notes", label: "Internal Notes" },
  { key: "submission", label: "Submission" },
];

export default function ThreadPanel({ thread, staff, currentUser, onStatusChange, onAssign, onBack, onToggleContact }) {
  const [bodyTab, setBodyTab] = useState("email");
  const qc = useQueryClient();

  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ["thread-messages", thread.id],
    queryFn: () => base44.entities.EmailMessage.filter({ ticket_id: thread.id }, "sent_at"),
    initialData: [],
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ["thread-notes", thread.id],
    queryFn: () => base44.entities.InternalNote.filter({ thread_id: thread.id }, "created_date"),
    initialData: [],
  });

  const sendMutation = useMutation({
    mutationFn: (body_html) => base44.functions.invoke("sendThreadReply", { thread_id: thread.id, body_html }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thread-messages", thread.id] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Reply sent");
    },
    onError: () => toast.error("Failed to send reply"),
  });

  const noteMutation = useMutation({
    mutationFn: (body) => base44.entities.InternalNote.create({
      thread_id: thread.id, body,
      author_email: currentUser?.email, author_name: currentUser?.full_name,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["thread-notes", thread.id] }),
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <ThreadHeader
        thread={thread} staff={staff}
        onStatusChange={onStatusChange} onAssign={onAssign}
        onBack={onBack} onToggleContact={onToggleContact}
      />

      <div className="flex items-center gap-1 px-4 border-b border-slate-200 bg-white">
        {BODY_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setBodyTab(t.key)}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              bodyTab === t.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.key === "notes" && notes.length > 0 && <span className="ml-1 text-amber-600">{notes.length}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {bodyTab === "email" && (
          <>
            <div className="flex-1 overflow-y-auto">
              <EmailThreadTab messages={messages} loading={loadingMsgs} />
            </div>
            <ComposeFooter
              sending={sendMutation.isPending}
              onSend={(html, reset) => sendMutation.mutate(html, { onSuccess: reset })}
            />
          </>
        )}
        {bodyTab === "notes" && (
          <InternalNotesTab
            notes={notes} loading={loadingNotes}
            posting={noteMutation.isPending}
            onAdd={(body) => noteMutation.mutate(body)}
          />
        )}
        {bodyTab === "submission" && (
          <div className="flex-1 overflow-y-auto">
            <SubmissionDetails formData={thread.form_data} />
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyThreadState() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400">
      <MessagesSquare className="w-12 h-12 mb-3" />
      <p className="text-sm">Select a conversation to get started.</p>
    </div>
  );
}