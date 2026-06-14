import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Avatar from "./Avatar";
import SourceBadge from "./SourceBadge";
import StatusPill from "./StatusPill";
import ContactLabels from "./ContactLabels";
import ContactNotes from "./ContactNotes";
import { Mail, Phone, X } from "lucide-react";
import { relativeTime } from "./inboxConfig";

export default function ContactPanel({ thread, onSelectThread, onClose }) {
  const qc = useQueryClient();

  const { data: contact } = useQuery({
    queryKey: ["contact", thread.contact_id],
    queryFn: () => base44.entities.Contact.get(thread.contact_id),
    enabled: !!thread.contact_id,
  });

  const { data: allThreads } = useQuery({
    queryKey: ["contact-threads", thread.contact_email],
    queryFn: () => base44.entities.Thread.filter({ contact_email: thread.contact_email }, "-last_activity_at"),
    initialData: [],
  });

  const labelMutation = useMutation({
    mutationFn: (labels) => base44.entities.Contact.update(thread.contact_id, { labels }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact", thread.contact_id] }),
  });

  if (!contact) {
    return <div className="h-full p-4 animate-pulse" />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="lg:hidden flex justify-end p-2">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/60">
          <X className="w-5 h-5 text-pink-700" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center px-4 pt-6 pb-6 border-b border-white/50">
        <div className="p-1 rounded-full bg-gradient-to-br from-pink-300/60 to-rose-300/60">
          <Avatar name={contact.name} email={contact.email} size="lg" />
        </div>
        <h3 className="mt-3 font-bold text-lg text-pink-900">{contact.name}</h3>
        <div className="mt-2 space-y-1 text-sm text-pink-900/60">
          <a href={`mailto:${contact.email}`} className="flex items-center justify-center gap-1.5 hover:text-pink-700">
            <Mail className="w-3.5 h-3.5" /> {contact.email}
          </a>
          {contact.phone && (
            <span className="flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {contact.phone}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-b border-white/50">
        <h4 className="text-[11px] font-semibold text-pink-400 uppercase tracking-wide mb-2">Labels</h4>
        <ContactLabels labels={contact.labels || []} onChange={(l) => labelMutation.mutate(l)} />
      </div>

      <ContactNotes threadId={thread.id} />

      <div className="px-4 py-4">
        <h4 className="text-[11px] font-semibold text-pink-400 uppercase tracking-wide mb-2">
          All Threads ({allThreads.length})
        </h4>
        <div className="space-y-1.5">
          {allThreads.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectThread(t)}
              className={`w-full text-left rounded-2xl border p-2.5 transition-colors ${
                t.id === thread.id ? "border-pink-200 bg-white/70" : "border-white/60 bg-white/40 hover:bg-white/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <SourceBadge source={t.source_app} />
                <span className="text-[11px] text-pink-400">{relativeTime(t.last_activity_at || t.created_date)}</span>
              </div>
              <p className="text-xs font-medium text-pink-900/80 truncate">{t.subject}</p>
              <div className="mt-1.5">
                <StatusPill status={t.status} readOnly />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}