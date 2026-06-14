import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ThreadHeader from "./ThreadHeader";
import EmailThreadTab from "./EmailThreadTab";
import ComposeFooter from "./ComposeFooter";
import { MessagesSquare } from "lucide-react";
import { toast } from "sonner";

export default function ThreadPanel({ thread, staff, currentUser, onStatusChange, onAssign, onBack, onToggleContact, contactOpen }) {
  const qc = useQueryClient();

  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ["thread-messages", thread.id],
    queryFn: () => base44.entities.EmailMessage.filter({ ticket_id: thread.id }, "sent_at"),
    initialData: [],
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
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

  return (
    <div className="flex flex-col h-full">
      <ThreadHeader
        thread={thread} staff={staff}
        onStatusChange={onStatusChange} onAssign={onAssign}
        onBack={onBack} onToggleContact={onToggleContact} contactOpen={contactOpen}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <EmailThreadTab messages={messages} loading={loadingMsgs} thread={thread} />
        </div>
        <ComposeFooter
          sending={sendMutation.isPending}
          onSend={(html, reset) => sendMutation.mutate(html, { onSuccess: reset })}
        />
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