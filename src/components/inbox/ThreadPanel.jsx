import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ThreadHeader from "./ThreadHeader";
import EmailThreadTab from "./EmailThreadTab";
import EmailComposer from "./email/EmailComposer";
import { MessagesSquare } from "lucide-react";

export default function ThreadPanel({ thread, staff, currentUser, onStatusChange, onAssign, onBack, onToggleContact, contactOpen }) {
  const qc = useQueryClient();

  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ["thread-messages", thread.id],
    queryFn: () => base44.entities.EmailMessage.filter({ ticket_id: thread.id }, "sent_at"),
    initialData: [],
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  const handleSent = () => {
    qc.invalidateQueries({ queryKey: ["thread-messages", thread.id] });
    qc.invalidateQueries({ queryKey: ["threads"] });
  };

  return (
    <div className="flex flex-col h-full">
      <ThreadHeader
        thread={thread} staff={staff} currentUser={currentUser}
        onStatusChange={onStatusChange} onAssign={onAssign}
        onBack={onBack} onToggleContact={onToggleContact} contactOpen={contactOpen}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <EmailThreadTab messages={messages} loading={loadingMsgs} thread={thread} />
        </div>
        <div className="border-t border-white/50 dark:border-white/10 p-3">
          <EmailComposer
            key={thread.id}
            thread={thread}
            currentUser={currentUser}
            onSent={handleSent}
          />
        </div>
      </div>
    </div>
  );
}

export function EmptyThreadState() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-pink-400">
      <MessagesSquare className="w-12 h-12 mb-3" />
      <p className="text-sm">Select a conversation to get started.</p>
    </div>
  );
}