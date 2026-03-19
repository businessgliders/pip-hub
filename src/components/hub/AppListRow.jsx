import React from 'react';
import { Star, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppListRow({ app, isFavorited, onToggleFavorite, onOpenApp, isLast }) {
  const handleClick = (e) => {
    if (e.target.closest('.star-button')) return;
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
        'flex items-center gap-3 px-4 py-3 bg-white/70 backdrop-blur-sm active:bg-gray-100 cursor-pointer transition-colors',
        !isLast && 'border-b border-gray-200/60'
      )}
    >
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
        <button
          className="star-button w-7 h-7 flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(app.id); }}
        >
          <Star className={cn('w-4 h-4', isFavorited ? 'fill-[#f1889b] text-[#f1889b]' : 'text-gray-300')} />
        </button>
        {app.open_in_new_tab ? (
          <ExternalLink className="w-4 h-4 text-gray-300" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-300" />
        )}
      </div>
    </div>
  );
}