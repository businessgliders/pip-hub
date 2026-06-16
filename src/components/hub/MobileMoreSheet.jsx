import React from 'react';
import { LayoutGrid, LogOut } from 'lucide-react';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function MobileMoreSheet({ user, onClose, onCustomize, onSwitchUser, onLogout }) {
  useBodyScrollLock(true);

  return (
    <div
      className="md:hidden fixed inset-0 z-40 flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full bg-white/95 backdrop-blur-xl rounded-t-3xl border-t border-gray-200/60 shadow-2xl animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="px-4 pb-2">
          <button
            onClick={() => { onClose(); onCustomize(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-100/80 active:bg-gray-200/80 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f1889b]/20 to-[#f7b1bd]/20 flex items-center justify-center">
              <LayoutGrid className="w-4.5 h-4.5 text-[#f1889b]" />
            </div>
            <span className="text-base font-medium text-gray-800">Customize</span>
          </button>
          <button
            onClick={() => { onClose(); onSwitchUser(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-100/80 active:bg-gray-200/80 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center">
              <span className="text-xs font-bold text-white">{getInitials(user?.full_name)}</span>
            </div>
            <span className="text-base font-medium text-gray-800">Switch User</span>
          </button>
          <button
            onClick={() => { onClose(); onLogout?.(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-100/80 active:bg-gray-200/80 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <LogOut className="w-4.5 h-4.5 text-gray-600" />
            </div>
            <span className="text-base font-medium text-gray-800">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}