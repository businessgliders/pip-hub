import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Mail, MailOpen, Loader2 } from "lucide-react";

/**
 * Compact read/unread toggle for an inbound message bubble.
 *
 * Marking UNREAD:
 *  - sets thread.is_read = false (drives the existing unread UI in the thread list)
 *  - creates a `reply` Notification for the current user (so it shows in the bell)
 *
 * Marking READ:
 *  - sets thread.is_read = true
 *  - clears any unread `reply` notifications for this thread for the current user
 */
export default function MessageReadToggle({ message, thread, currentUser }) {
  const qc = useQueryClient();
  const email = currentUser?.email;

  const toggle = useMutation({
    mutationFn: async (markUnread) => {
      if (markUnread) {
        await base44.entities.Thread.update(thread.id, { is_read: false });
        if (email) {
          const tag = thread.ticket_number ? `#${thread.ticket_number} ` : "";
          const snippet = (message.snippet || message.body_text || message.body_html || "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 160);
          await base44.entities.Notification.create({
            recipient_email: email,
            type: "reply",
            title: `Marked unread — ${thread.contact_name || message.from_email}`,
            body: `${tag}${snippet}`,
            thread_id: thread.id,
            source_app: thread.source_app,
            is_read: false,
          });
        }
      } else {
        await base44.entities.Thread.update(thread.id, { is_read: true });
        if (email) {
          const notifs = await base44.entities.Notification.filter({
            recipient_email: email,
            thread_id: thread.id,
            type: "reply",
            is_read: false,
          });
          await Promise.all(notifs.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.invalidateQueries({ queryKey: ["notifications", email] });
    },
  });

  const isUnread = thread?.is_read === false;
  const Icon = toggle.isPending ? Loader2 : isUnread ? MailOpen : Mail;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate(!isUnread);
      }}
      disabled={toggle.isPending}
      title={isUnread ? "Mark as read" : "Mark as unread"}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-pink-500 dark:text-white/60 hover:bg-pink-100/70 dark:hover:bg-white/10 transition-colors"
    >
      <Icon className={`w-3 h-3 ${toggle.isPending ? "animate-spin" : ""}`} />
      {isUnread ? "Mark read" : "Mark unread"}
    </button>
  );
}