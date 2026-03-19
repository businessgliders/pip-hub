import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AppCard from './AppCard';
import AppListRow from './AppListRow';

export default function SectionGroup({
  section,
  sectionIndex,
  totalSections,
  apps,
  favorites,
  onToggleFavorite,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  draggingAppId,
  onOpenApp,
  viewMode = 'list',
  isEditMode = false,
  onEditApp,
  onDeleteApp,
  onMoveAppUp,
  onMoveAppDown,
  onMoveSectionUp,
  onMoveSectionDown,
  onReorderAppsInSection,
}) {
  const handleDragEnd = (result) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    onReorderAppsInSection?.(section.id, result.source.index, result.destination.index);
  };

  return (
    <div className="mb-10">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        {isEditMode && (
          <div className="flex flex-col gap-0.5">
            <button onClick={onMoveSectionUp} className="w-6 h-5 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-20 transition-colors">
              <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button onClick={onMoveSectionDown} className="w-6 h-5 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-20 transition-colors">
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        )}
        <h2 className="text-xl font-semibold text-gray-800 tracking-tight flex-1">{section.name}</h2>
      </div>

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
              isEditMode={isEditMode}
              onEdit={() => onEditApp(app)}
              onDelete={() => onDeleteApp(app.id)}
              onMoveUp={i > 0 ? () => onMoveAppUp(app.id) : null}
              onMoveDown={i < apps.length - 1 ? () => onMoveAppDown(app.id) : null}
            />
          ))}
        </div>
      ) : isEditMode ? (
        // Grid edit mode: drag-and-drop
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={section.id} direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                {apps.map((app, i) => (
                  <Draggable key={app.id} draggableId={app.id} index={i}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{ ...provided.draggableProps.style }}
                        className={snapshot.isDragging ? 'opacity-70 scale-105 z-50' : ''}
                      >
                        <AppCard
                          app={app}
                          isFavorited={favorites.includes(app.id)}
                          onToggleFavorite={onToggleFavorite}
                          onOpenApp={onOpenApp}
                          isEditMode={isEditMode}
                          isDragging={snapshot.isDragging}
                          onEdit={() => onEditApp(app)}
                          onDelete={() => onDeleteApp(app.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        // Grid normal mode
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, section.id)}
        >
          {apps.map((app, i) => (
            <AppCard
              key={app.id}
              app={app}
              isFavorited={favorites.includes(app.id)}
              onToggleFavorite={onToggleFavorite}
              onDragStart={(e) => onDragStart(e, app.id)}
              onDragEnd={onDragEnd}
              isDragging={draggingAppId === app.id}
              onOpenApp={onOpenApp}
              isEditMode={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}