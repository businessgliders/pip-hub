import React from 'react';
import { Star, ChevronRight, ExternalLink, Pencil, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppListRow({ app, isFavorited, onToggleFavorite, onOpenApp, isLast, isEditMode, onEdit, onDelete, dragHandleProps }) {
  const handleClick = (e) => {
    if (isEditMode) return;
    if (e.target.closest('.action-button')) return;
    if (app.open_in_new_tab) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } else {
      onOpenApp(app);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-white/70 backdrop-blur-sm transition-colors group',
        !isEditMode && 'active:bg-gray-100 cursor-pointer',
        !isLast && 'border-b border-gray-200/60'
      )}
    >
      {/* Drag handle in edit mode */}
      {isEditMode && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="action-button flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded transition-colors"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
      )}

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f1889b]/20 to-[#f7b1bd]/20 border border-[#f1889b]/20 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
        {app.icon_url ? (
          <img src={app.icon_url} alt={app.name} className="w-7 h-7 object-contain" />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
        )}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-gray-800 text-sm">{app.name}</span>
          {app.is_new && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold text-white bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] rounded-full">New</span>
          )}
        </div>
        {app.description && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{app.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isEditMode ? (
          <>
            <button
              className="action-button w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 transition-colors"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Pencil className="w-4 h-4 text-blue-400" />
            </button>
            <button
              className="action-button w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="action-button star-button w-7 h-7 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(app.id); }}
            >
              <Star className={cn('w-4 h-4', isFavorited ? 'fill-[#f1889b] text-[#f1889b]' : 'text-gray-300 hover:text-gray-400')} />
            </button>
            {app.open_in_new_tab ? (
              <ExternalLink className="w-4 h-4 text-gray-300" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-300" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}