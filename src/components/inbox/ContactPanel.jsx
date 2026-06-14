import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Avatar from "./Avatar";
import SourceBadge from "./SourceBadge";
import StatusPill from "./StatusPill";
import ContactLabels from "./ContactLabels";
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
    return <div className="h-full bg-white border-l border-slate-200 p-4 animate-pulse" />;
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 overflow-y-auto">
      <div className="lg:hidden flex justify-end p-2">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center px-4 pt-4 pb-6 border-b border-slate-100">
        <Avatar name={contact.name} email={contact.email} size="lg" />
        <h3 className="mt-3 font-semibold text-slate-900">{contact.name}</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-500">
          <a href={`mailto:${contact.email}`} className="flex items-center justify-center gap-1.5 hover:text-slate-700">
            <Mail className="w-3.5 h-3.5" /> {contact.email}
          </a>
          {contact.phone && (
            <span className="flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {contact.phone}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-b border-slate-100">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Labels</h4>
        <ContactLabels labels={contact.labels || []} onChange={(l) => labelMutation.mutate(l)} />
      </div>

      <div className="px-4 py-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          All Threads ({allThreads.length})
        </h4>
        <div className="space-y-1.5">
          {allThreads.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectThread(t)}
              className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                t.id === thread.id ? "border-slate-300 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <SourceBadge source={t.source_app} />
                <span className="text-[11px] text-slate-400">{relativeTime(t.last_activity_at || t.created_date)}</span>
              </div>
              <p className="text-xs font-medium text-slate-700 truncate">{t.subject}</p>
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