import React from 'react';
import AppCard from './AppCard';
import AppListRow from './AppListRow';

export default function SectionGroup({
  section,
  apps,
  favorites,
  onToggleFavorite,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  draggingAppId,
  onOpenApp,
  viewMode = 'grid'
}) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">
        {section.name}
      </h2>

      {viewMode === 'list' ? (
        <div className="rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm">
          {apps.map((app, i) => (
            <AppListRow
              key={app.id}
              app={app}
              isFavorited={favorites.includes(app.id)}
              onToggleFavorite={onToggleFavorite}
              onOpenApp={onOpenApp}
              isLast={i === apps.length - 1}
            />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, section.id)}
        >
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              isFavorited={favorites.includes(app.id)}
              onToggleFavorite={onToggleFavorite}
              onDragStart={(e) => onDragStart(e, app.id)}
              onDragEnd={onDragEnd}
              isDragging={draggingAppId === app.id}
              onOpenApp={onOpenApp}
            />
          ))}
        </div>
      )}
    </div>
  );
}