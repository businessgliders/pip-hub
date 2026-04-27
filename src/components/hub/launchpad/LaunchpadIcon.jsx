import React from 'react';
import { Pencil, Trash2, EyeOff } from 'lucide-react';

// A single app icon styled like macOS Launchpad / iOS springboard.
// In edit mode shows edit + delete/hide buttons (matching the rest of the app).
export default function LaunchpadIcon({ app, onOpen, isEditMode, onEdit, onDelete, onHide }) {
  const isNewApp = () => {
    if (!app?.is_new) return false;
    const created = new Date(app.created_date);
    return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  };

  const handleClick = (e) => {
    if (isEditMode) return;
    if (e.target.closest('.lp-action-btn')) return;
    if (app.open_in_new_tab) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } else {
      onOpen?.(app);
    }
  };

  return (
    <div className="group relative flex flex-col items-center gap-2 w-20 sm:w-24">
      <button
        type="button"
        onClick={handleClick}
        className={`relative focus:outline-none ${isEditMode ? 'cursor-grab active:cursor-grabbing pointer-events-none' : ''}`}
      >
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 flex items-center justify-center overflow-hidden shadow-xl transition-transform duration-200 ${isEditMode ? 'animate-[wiggle_0.6s_ease-in-out_infinite]' : 'group-hover:scale-110 group-active:scale-95'}`}>
          {app.icon_url ? (
            <img src={app.icon_url} alt={app.name} className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
          )}
        </div>
        {isNewApp() && !isEditMode && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-semibold text-white bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] rounded-full shadow-md">
            New
          </span>
        )}
      </button>

      {/* Edit mode action buttons */}
      {isEditMode && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit?.(app); }}
            className="lp-action-btn w-6 h-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-blue-50"
            title="Edit app"
          >
            <Pencil className="w-3 h-3 text-blue-500" />
          </button>
          {app.is_global ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onHide?.(app.id); }}
              className="lp-action-btn w-6 h-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-100"
              title="Hide from my dashboard"
            >
              <EyeOff className="w-3 h-3 text-gray-500" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete?.(app.id); }}
              className="lp-action-btn w-6 h-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-red-50"
              title="Delete app"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          )}
        </div>
      )}

      <span className="text-xs sm:text-sm text-gray-800 font-medium text-center truncate w-full drop-shadow-sm">
        {app.name}
      </span>
    </div>
  );
}