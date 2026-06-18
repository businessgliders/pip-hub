import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, UserPlus, Clock, Bug, CheckCheck, Trash2 } from "lucide-react";
import { relativeTime } from "./inboxConfig";

const TYPE_ICON = {
  assignment: UserPlus,
  reminder: Clock,
  bug: Bug,
  reply: Bell,
  status: Bell,
  other: Bell,
};

export default function NotificationCenter({ currentUser, onOpenThread }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const email = currentUser?.email;

  const { data: notifications } = useQuery({
    queryKey: ["notifications", email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: email }, "-created_date", 50),
    initialData: [],
    enabled: !!email,
    refetchInterval: 60000,
  });

  // Real-time: new notifications appear instantly in the bell (no refresh needed).
  useEffect(() => {
    if (!email) return;
    const unsubscribe = base44.entities.Notification.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["notifications", email] });
    });
    return unsubscribe;
  }, [qc, email]);

  const unread = notifications.filter((n) => !n.is_read);

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", email] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", email] }),
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      await Promise.all(notifications.map((n) => base44.entities.Notification.delete(n.id)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", email] }),
  });

  const handleClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.thread_id && onOpenThread) {
      onOpenThread(n);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full text-pink-900/50 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
          <Bell className="w-5 h-5" />
          {unread.length > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-pink-500 rounded-full">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          <div className="flex items-center gap-3">
            {unread.length > 0 && (
              <button onClick={() => markAll.mutate()} className="text-xs text-pink-600 hover:underline flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={() => clearAll.mutate()} className="text-xs text-muted-foreground hover:text-red-600 hover:underline flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
              You're all caught up
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left flex gap-3 px-3 py-2.5 border-b last:border-0 hover:bg-muted/60 transition-colors ${
                    n.is_read ? "opacity-60" : "bg-pink-50/50 dark:bg-pink-500/5"
                  }`}
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
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}