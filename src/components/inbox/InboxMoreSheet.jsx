import React from "react";
import { base44 } from "@/api/base44Client";
import { Moon, Sun, Users, LogOut, HelpCircle } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function InboxMoreSheet({ user, onClose, onTerms }) {
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
        <div className="px-4 pb-2">
          <Row icon={dark ? Sun : Moon} label={dark ? "Light Mode" : "Dark Mode"} onClick={toggle} />
          {onTerms && (
            <Row icon={HelpCircle} label="Terms Assistant" onClick={() => { onClose?.(); onTerms(); }} />
          )}
        </div>
      </div>
    </div>
  );
}