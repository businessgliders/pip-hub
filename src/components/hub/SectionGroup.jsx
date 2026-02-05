import React from 'react';
import AppCard from './AppCard';

export default function SectionGroup({
  section,
  apps,
  favorites,
  onToggleFavorite,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  draggingAppId
}) {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 tracking-tight">
        {section.name}
      </h2>
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
          />
        ))}
      </div>
    </div>
  );
}