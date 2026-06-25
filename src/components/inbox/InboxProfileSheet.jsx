import React from "react";
import { base44 } from "@/api/base44Client";
import { Moon, Sun, Users, LogOut } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

const getInitials = (user) => {
  if ((user?.email || "").toLowerCase() === "info@pilatesinpinkstudio.com") return "FD";
  const name = (user?.full_name || "").trim();
  if (name) {
    const parts = name.split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
  return (user?.email || "?").slice(0, 2).toUpperCase();
};

export default function InboxProfileSheet({ user, accent = "#f1889b", onClose }) {
  useBodyScrollLock(true);
  const { dark, toggle } = useTheme();

  const Row = ({ icon: Icon, label, onClick, danger }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-100/80 active:bg-gray-200/80 transition-colors ${danger ? "text-red-600" : "text-gray-800"}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? "bg-red-50" : "bg-gradient-to-br from-[#f1889b]/20 to-[#f7b1bd]/20"}`}>
        <Icon className={`w-4.5 h-4.5 ${danger ? "text-red-500" : "text-[#f1889b]"}`} />
      </div>
      <span className="text-base font-medium">{label}</span>
    </button>
  );

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full bg-white/95 backdrop-blur-xl rounded-t-3xl border-t border-gray-200/60 shadow-2xl animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)" }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Account header */}
        {user && (
          <div className="flex items-center gap-3 px-5 pb-3 border-b border-gray-100">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
            >
              {getInitials(user)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name || "Account"}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <div className="px-4 pt-2 pb-2">
          <Row icon={dark ? Sun : Moon} label={dark ? "Light Mode" : "Dark Mode"} onClick={toggle} />
          <Row icon={Users} label="Switch User" onClick={() => base44.auth.logout(window.location.href)} />
          <Row icon={LogOut} label="Log out" danger onClick={() => base44.auth.logout()} />
        </div>
      </div>
    </div>
  );
}