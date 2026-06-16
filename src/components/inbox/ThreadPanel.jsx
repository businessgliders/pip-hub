import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ThreadHeader from "./ThreadHeader";
import EmailThreadTab from "./EmailThreadTab";
import EmailComposer from "./email/EmailComposer";
import ContactPanel from "./ContactPanel";
import { MessagesSquare, X } from "lucide-react";

export default function ThreadPanel({ thread, staff, currentUser, onStatusChange, onAssign, onSelectThread, onBack, shakeKey }) {
  const qc = useQueryClient();
  // Mobile/tablet only: slide-in detail panel that overlays the email view.
  const [detailOpen, setDetailOpen] = useState(false);
  // Brief shake when opened via a notification click.
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!shakeKey) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 550);
    return () => clearTimeout(t);
  }, [shakeKey]);

  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ["thread-messages", thread.id],
    queryFn: () => base44.entities.EmailMessage.filter({ ticket_id: thread.id }, "sent_at"),
    initialData: [],
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  // Real-time: new inbound/outbound emails appear instantly (no refresh needed).
  useEffect(() => {
    const unsubscribe = base44.entities.EmailMessage.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["thread-messages", thread.id] });
    });
    return unsubscribe;
  }, [qc, thread.id]);

  const handleSent = () => {
    qc.invalidateQueries({ queryKey: ["thread-messages", thread.id] });
    qc.invalidateQueries({ queryKey: ["threads"] });
  };

  return (
    <div className={`relative flex flex-col h-full ${shaking ? "animate-shake" : ""}`}>
      <ThreadHeader
        thread={thread} staff={staff} currentUser={currentUser}
        onStatusChange={onStatusChange} onAssign={onAssign}
        onBack={onBack}
        onShowDetails={() => setDetailOpen(true)}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <EmailThreadTab messages={messages} loading={loadingMsgs} thread={thread} currentUser={currentUser} />
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

      {/* Mobile/tablet slide-in detail panel (replaces email view) */}
      <div className={`lg:hidden absolute inset-0 z-30 transition-transform duration-300 ease-out ${detailOpen ? "translate-x-0" : "translate-x-full pointer-events-none"}`}>
        <div className="h-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/15">
            <span className="font-bold text-pink-900 dark:text-white">Details</span>
            <button onClick={() => setDetailOpen(false)} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-pink-700 dark:text-white/80" />
            </button>
          </div>
          <div className="h-[calc(100%-3.25rem)] overflow-hidden">
            <ContactPanel
              thread={thread}
              staff={staff}
              onAssign={onAssign}
              onSelectThread={(t) => { setDetailOpen(false); onSelectThread?.(t); }}
              onClose={() => setDetailOpen(false)}
            />
          </div>
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