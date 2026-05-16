import React from 'react';
import { ChevronDown } from 'lucide-react';

// Expandable settings card used in the Customize panel.
export default function CustomizeCard({ icon: Icon, title, description, isOpen, onToggle, action, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-md overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/90 transition-colors text-left"
      >
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f1889b]/15 to-[#f7b1bd]/15 border border-[#f1889b]/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4.5 h-4.5 text-[#f1889b]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
        </div>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}