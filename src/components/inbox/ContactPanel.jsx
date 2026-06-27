import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/ThemeContext";
import Avatar from "./Avatar";
import ThreadHistoryItem from "./ThreadHistoryItem";
import ContactNotes from "./ContactNotes";
import ActivityLog from "./ActivityLog";
import AssigneePanel from "./AssigneePanel";
import ThreadContactActions from "./ThreadContactActions";
import ThreadDeleteButton from "./ThreadDeleteButton";
import { Mail, Phone } from "lucide-react";
import { displayName, viewTextColor } from "./inboxConfig";

export default function ContactPanel({ thread, staff = [], onAssign, onSelectThread, onClose }) {
  const { dark } = useTheme();
  // In dark mode the brand brown accent is unreadable — fall back to the
  // dark:text-* classes by not forcing an inline color.
  const accent = dark ? undefined : viewTextColor(thread.source_app);

  const { data: contactRecord } = useQuery({
    queryKey: ["contact", thread.contact_id],
    queryFn: () => base44.entities.Contact.get(thread.contact_id),
    enabled: !!thread.contact_id,
  });

  // Always have a contact to render — fall back to the thread's denormalized
  // contact fields when the Contact record is missing or hasn't loaded. This
  // prevents the detail panel from rendering blank for threads with no/stale
  // contact_id (the "hit or miss" empty panel some users saw in "All").
  const contact = contactRecord || {
    name: thread.contact_name,
    email: thread.contact_email,
    phone: thread.form_data?.phone || thread.form_data?.phone_number || "",
  };

  const { data: allThreads } = useQuery({
    queryKey: ["contact-threads", thread.contact_email],
    queryFn: () => base44.entities.Thread.filter({ contact_email: thread.contact_email }, "-last_activity_at"),
    initialData: [],
  });

  // Exclude the thread currently being viewed — only show other related threads.
  const relatedThreads = allThreads.filter((t) => t.id !== thread.id);



  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ color: accent }}>
      {/* Contact details */}
      <div className="flex flex-col items-center text-center px-4 pt-6 pb-6 border-b border-white/50 dark:border-white/15">
        <div className="p-1 rounded-full bg-gradient-to-br from-pink-300/60 to-rose-300/60">
          <Avatar name={contact.name} email={contact.email} size="lg" />
        </div>
        <h3 className="mt-3 font-bold text-lg dark:text-white" style={{ color: accent }}>{displayName(contact.name, contact.email)}</h3>
        <div className="mt-2 space-y-1 text-sm dark:text-white/70" style={{ color: accent }}>
          <a href={`mailto:${contact.email}`} className="flex items-center justify-center gap-1.5 hover:opacity-70">
            <Mail className="w-3.5 h-3.5" /> {contact.email}
          </a>
          {contact.phone && (
            <span className="flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {contact.phone}
            </span>
          )}
        </div>
        {/* Quick contact actions: Gmail search + Zoom call */}
        <div className="mt-3">
          <ThreadContactActions thread={thread} view={thread.source_app} />
        </div>
      </div>

      {/* Related threads — other conversations with this contact (excludes current) */}
      {relatedThreads.length > 0 && (
        <div className="px-4 py-4 border-b border-white/50 dark:border-white/15">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide mb-2 opacity-60 dark:text-white/60">
            Related Threads ({relatedThreads.length})
          </h4>
          <div className="space-y-1.5">
            {relatedThreads.map((t) => (
              <ThreadHistoryItem
                key={t.id}
                thread={t}
                active={false}
                accent={accent}
                onSelect={onSelectThread}
              />
            ))}
          </div>
        </div>
      )}

      {/* Escalate / assignment (moved up to where Activity used to be) */}
      <AssigneePanel thread={thread} staff={staff} onAssign={onAssign} accent={accent} />

      {/* Internal notes */}
      <ContactNotes threadId={thread.id} accent={accent} />

      {/* Activity — status change audit trail (now the last section) */}
      <ActivityLog thread={thread} accent={accent} />

      {/* Delete — only for tickets escalated/assigned to Gurpreen */}
      <ThreadDeleteButton thread={thread} onDeleted={onClose} />
    </div>
  );
}