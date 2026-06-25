import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Inbox as InboxIcon, Bell } from "lucide-react";
import InboxProfileSheet from "./InboxProfileSheet";
import InboxNotificationsSheet from "./InboxNotificationsSheet";

const HOME_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/ad4ccf659_PiPHub.png";

/**
 * iOS-style bottom tab bar for the inbox on mobile/tablet.
 * Mirrors the AppHub bottom bar: Home, Inbox, Notifications, More.
 * Team-inbox switching lives in the top header on mobile.
 */
export default function InboxMobileTabBar({ currentUser, onOpenThread, accent = "#f1889b" }) {
  const qc = useQueryClient();
  const [showProfile, setShowProfile] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const email = currentUser?.email;

  // Two-letter initials for the profile avatar.
  const initials = (() => {
    if ((currentUser?.email || "").toLowerCase() === "info@pilatesinpinkstudio.com") return "FD";
    const name = (currentUser?.full_name || "").trim();
    if (name) {
      const parts = name.split(/\s+/);
      return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
    }
    return (currentUser?.email || "?").slice(0, 2).toUpperCase();
  })();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: email }, "-created_date", 50),
    initialData: [],
    enabled: !!email,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!email) return;
    const unsub = base44.entities.Notification.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["notifications", email] });
    });
    return unsub;
  }, [qc, email]);

  const unread = notifications.filter((n) => !n.is_read).length;

  const itemClass = "flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-gray-500 dark:text-white/55";

  return (
    <>
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-zinc-900/85 backdrop-blur-xl border-t border-gray-200/60 dark:border-white/10"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0px)" }}
      >
        <div className="flex items-center justify-around px-1 pt-2 pb-2">
          {/* Home → back to hub */}
          <Link to="/" className={itemClass}>
            <img src={HOME_LOGO} alt="Home" className="w-5 h-5 rounded-md" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Inbox (current) */}
          <Link to="/inbox" reloadDocument className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-[#f1889b]">
            <InboxIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Inbox</span>
          </Link>

          {/* Notifications */}
          <button onClick={() => setShowAlerts(true)} className={`relative ${itemClass}`}>
            <span className="relative">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-pink-500 rounded-full">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">Alerts</span>
          </button>

          {/* Profile */}
          <button onClick={() => setShowProfile(true)} className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
            >
              {initials}
            </span>
            <span className="text-[10px] font-medium text-gray-500 dark:text-white/55">Profile</span>
          </button>
        </div>
      </div>

      {showProfile && <InboxProfileSheet user={currentUser} accent={accent} onClose={() => setShowProfile(false)} />}
      {showAlerts && (
        <InboxNotificationsSheet
          currentUser={currentUser}
          onClose={() => setShowAlerts(false)}
          onOpenThread={onOpenThread}
        />
      )}
    </>
  );
}