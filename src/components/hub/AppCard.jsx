import React from 'react';
import { Star, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function AppCard({ app, isFavorited, onToggleFavorite, onDragStart, onDragEnd, isDragging, onOpenApp }) {
  // Check if app is new (created within last 7 days)
  const isNewApp = () => {
    if (!app.is_new) return false;
    const createdDate = new Date(app.created_date);
    const now = new Date();
    const daysSinceCreation = (now - createdDate) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 7;
  };
  const handleCardClick = (e) => {
    if (e.target.closest('.star-button') || e.target.closest('.info-button')) {
      return;
    }
    if (app.open_in_new_tab) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } else {
      onOpenApp(app);
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300",
        "backdrop-blur-xl bg-white/40 border border-white/60",
        "hover:bg-white/60 hover:shadow-[0_8px_32px_rgba(241,136,155,0.2)] hover:scale-[1.02]",
        "hover:border-[#f1889b]/30",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* New Badge */}
      {isNewApp() && (
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] rounded-full shadow-lg">
            New
          </span>
        </div>
      )}
      
      <div className="relative p-6 flex flex-col items-center gap-4">
        {/* Icon */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#f1889b]/20 to-[#f7b1bd]/20 border border-[#f1889b]/20 flex items-center justify-center overflow-hidden shadow-lg">
          {app.icon_url ? (
            <img src={app.icon_url} alt={app.name} className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
          )}
        </div>

        {/* App name */}
        <div className="text-center">
          <h3 className="font-semibold text-gray-800 text-sm tracking-tight">{app.name}</h3>
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          {app.description && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  className="info-button w-7 h-7 rounded-lg backdrop-blur-md bg-white/60 border border-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Info className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 backdrop-blur-xl bg-white/90 border-white/60 z-50" side="top" align="end">
                <p className="text-sm text-gray-700">{app.description}</p>
              </HoverCardContent>
            </HoverCard>
          )}
          
          <button
            className="star-button w-7 h-7 rounded-lg backdrop-blur-md bg-white/60 border border-white/80 flex items-center justify-center transition-all duration-200 hover:bg-white/80"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(app.id);
            }}
          >
            <Star
              className={cn(
                "w-3.5 h-3.5 transition-all duration-200",
                isFavorited ? "fill-[#f1889b] text-[#f1889b]" : "text-gray-400"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}