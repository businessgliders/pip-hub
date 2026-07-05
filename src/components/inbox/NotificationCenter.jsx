import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, UserPlus, Clock, Bug, CheckCheck, Trash2, Headphones, CalendarHeart, Handshake } from "lucide-react";
import { relativeTime } from "./inboxConfig";

const TYPE_ICON = {
  assignment: UserPlus,
  reminder: Clock,
  bug: Bug,
  reply: Bell,
  status: Bell,
  other: Bell,
};

// The four notification columns shown on desktop.
const COLUMNS = [
  { key: "support", label: "Support", Icon: Headphones },
  { key: "events", label: "Events", Icon: CalendarHeart },
  { key: "influencer", label: "Influencer", Icon: Handshake },
  { key: "bugs", label: "Bugs", Icon: Bug },
];

const groupKey = (n) => (n.type === "bug" ? "bugs" : (n.source_app || "support"));

// A single notification row (shared between desktop columns and mobile list).
// Compact: 1-2 lines — title, then type + date on one line.
function NotificationRow({ n, onClick }) {
  const Icon = TYPE_ICON[n.type] || Bell;
  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full text-left flex gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors ${
        n.is_read ? "opacity-60" : "bg-pink-50 dark:bg-pink-500/10"
      }`}
    >
      <div className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-2.5 h-2.5 text-pink-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium leading-tight line-clamp-1">{n.title}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground leading-tight">
          {n.body && <span className="truncate">{n.body}</span>}
          <span className="shrink-0">· {relativeTime(n.created_date)}</span>
        </div>
      </div>
      {!n.is_read && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />}
    </button>
  );
}

// One desktop column: full scrollable list (no "All other" overview split).
function Column({ label, Icon, items, onClick }) {
  return (
    <div className="flex flex-col min-w-0 border-r last:border-r-0 border-border/60">
      <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 border-b bg-muted sticky top-0 z-10">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground truncate">
          <Icon className="w-3 h-3 shrink-0" /> {label}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground shrink-0">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {items.length === 0 ? (
          <p className="text-center text-[10px] text-muted-foreground py-6">Nothing here</p>
        ) : (
          items.map((n) => <NotificationRow key={n.id} n={n} onClick={onClick} />)
        )}
      </div>
    </div>
  );
}

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

  // Per-column buckets for the desktop 4-column layout.
  const byColumn = COLUMNS.map((c) => ({
    ...c,
    items: notifications.filter((n) => groupKey(n) === c.key),
  }));

  // Mobile/tablet: 1-column, grouped by inbox (full list per group, no overview tail).
  const mobileSections = COLUMNS
    .map((g) => ({ ...g, items: notifications.filter((n) => groupKey(n) === g.key) }))
    .filter((g) => g.items.length > 0);

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
    // Bug notifications carry the bug id in thread_id; thread notifications carry
    // the thread id. Either way, route so the item opens and highlights.
    if ((n.thread_id || n.type === "bug") && onOpenThread) {
      onOpenThread(n);
      setOpen(false);
    }
  };

  const Header = (
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
  );

  const empty = (
    <div className="py-10 text-center text-sm text-muted-foreground">
      <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
      You're all caught up
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full text-pink-900/50 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
          <Bell className="w-5 h-5" />
          {unread.length > 0 && (
            <span className={`absolute top-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-pink-500 rounded-full ${unread.length > 9 ? "right-0" : "right-1"}`}>
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 lg:w-[720px] p-0 bg-popover backdrop-blur-none shadow-xl">
        {Header}

        {/* Desktop: expanded 4-column panel */}
        <div className="hidden lg:block">
          {notifications.length === 0 ? empty : (
            <div className="grid grid-cols-4 h-[460px]">
              {byColumn.map((c) => (
                <Column key={c.key} label={c.label} Icon={c.Icon} items={c.items} onClick={handleClick} />
              ))}
            </div>
          )}
        </div>

        {/* Mobile / tablet: single-column grouped list */}
        <div className="lg:hidden max-h-96 overflow-y-auto">
          {notifications.length === 0 ? empty : (
            mobileSections.map((g) => (
              <div key={g.key}>
                <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-1.5 bg-muted/80 backdrop-blur-sm border-b">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{g.label}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">{g.items.length}</span>
                </div>
                <div className="p-1.5 space-y-1">
                  {g.items.map((n) => <NotificationRow key={n.id} n={n} onClick={handleClick} />)}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}