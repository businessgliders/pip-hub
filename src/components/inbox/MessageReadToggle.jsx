import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Mail, MailOpen, Loader2 } from "lucide-react";

/**
 * Compact read/unread toggle for an inbound message bubble.
 *
 * Marking UNREAD:  sets thread.is_read = false (drives the unread UI in the list)
 * Marking READ:    sets thread.is_read = true
 *
 * No notification is created for manual unread.
 */
export default function MessageReadToggle({ message, thread, currentUser }) {
  const qc = useQueryClient();
  const email = currentUser?.email;

  const toggle = useMutation({
    mutationFn: (markUnread) =>
      base44.entities.Thread.update(thread.id, { is_read: !markUnread }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
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