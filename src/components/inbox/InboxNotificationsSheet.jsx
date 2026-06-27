import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, UserPlus, Clock, Bug, CheckCheck, Trash2 } from "lucide-react";
import { relativeTime } from "./inboxConfig";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

const TYPE_ICON = { assignment: UserPlus, reminder: Clock, bug: Bug, reply: Bell, status: Bell, other: Bell };

export default function InboxNotificationsSheet({ currentUser, onClose, onOpenThread }) {
  useBodyScrollLock(true);
  const qc = useQueryClient();
  const email = currentUser?.email;

  const { data: notifications } = useQuery({
    queryKey: ["notifications", email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: email }, "-created_date", 50),
    initialData: [],
    enabled: !!email,
  });

  const unread = notifications.filter((n) => !n.is_read);

  // Group notifications by inbox type. Bug notifications form their own group;
  // everything else groups by source_app.
  const GROUPS = [
    { key: "support", label: "Support" },
    { key: "events", label: "Events" },
    { key: "influencer", label: "Influencer" },
    { key: "bugs", label: "Bugs" },
  ];
  const groupKey = (n) => (n.type === "bug" ? "bugs" : (n.source_app || "support"));
  const grouped = GROUPS
    .map((g) => ({ ...g, items: notifications.filter((n) => groupKey(n) === g.key) }))
    .filter((g) => g.items.length > 0);

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", email] }),
  });
  const markAll = useMutation({
    mutationFn: async () => { await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true }))); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", email] }),
  });
  const clearAll = useMutation({
    mutationFn: async () => { await Promise.all(notifications.map((n) => base44.entities.Notification.delete(n.id))); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", email] }),
  });

  const handleClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.thread_id && onOpenThread) { onOpenThread(n); onClose(); }
  };

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-h-[80vh] flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-t-3xl border-t border-gray-200/60 dark:border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-white/10 shrink-0">
          <span className="text-base font-semibold">Notifications</span>
          <div className="flex items-center gap-3">
            {unread.length > 0 && (
              <button onClick={() => markAll.mutate()} className="text-xs text-pink-600 hover:underline flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={() => clearAll.mutate()} className="text-xs text-muted-foreground hover:text-red-600 hover:underline flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto ios-scroll">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
              You're all caught up
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.key}>
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-1.5 bg-muted/80 backdrop-blur-sm border-b dark:border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{g.label}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">{g.items.length}</span>
                </div>
                {g.items.map((n) => {
                  const Icon = TYPE_ICON[n.type] || Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left flex gap-3 px-4 py-3 border-b last:border-0 dark:border-white/10 hover:bg-muted/60 transition-colors ${n.is_read ? "opacity-60" : "bg-pink-50/50 dark:bg-pink-500/5"}`}
                    >
                      <div className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-pink-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                        <p className="text-[11px] text-muted-foreground mt-0.5">{relativeTime(n.created_date)}</p>
                      </div>
                      {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-pink-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}