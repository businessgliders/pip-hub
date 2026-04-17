import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import AppCard from './AppCard';
import AppListRow from './AppListRow';

export default function FavoritesSection({
  favoritedApps,
  viewMode,
  isEditMode,
  draggingAppId,
  onToggleFavorite,
  onOpenApp,
  onEditApp,
  onDeleteApp,
  onDragStart,
  onDragEnd,
  onReorderFavorites,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => !isEditMode && setIsCollapsed(c => !c)}
          className={`flex items-center gap-1.5 flex-1 text-left ${!isEditMode ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Favorites</h2>
          {!isEditMode && (
            <ChevronRight
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
            />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {viewMode === 'list' ? (
            isEditMode ? (
              <Droppable droppableId="favorites" direction="vertical" type="FAVORITE">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm"
                    >
                      {favoritedApps.map((app, i) => (
                        <Draggable key={app.id} draggableId={`fav-${app.id}`} index={i}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{ ...provided.draggableProps.style }}
                              className={snapshot.isDragging ? 'opacity-80 z-50 shadow-xl bg-white rounded-lg' : ''}
                            >
                              <AppListRow
                                app={app}
                                isFavorited={true}
                                onToggleFavorite={() => onToggleFavorite(app.id)}
                                onOpenApp={onOpenApp}
                                isLast={i === favoritedApps.length - 1}
                                isEditMode={isEditMode}
                                onEdit={() => onEditApp(app)}
                                onDelete={() => onDeleteApp(app.id)}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
              </Droppable>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm">
                {favoritedApps.map((app, i) => (
                  <AppListRow
                    key={app.id}
                    app={app}
                    isFavorited={true}
                    onToggleFavorite={() => onToggleFavorite(app.id)}
                    onOpenApp={onOpenApp}
                    isLast={i === favoritedApps.length - 1}
                    isEditMode={isEditMode}
                    onEdit={() => onEditApp(app)}
                    onDelete={() => onDeleteApp(app.id)}
                  />
                ))}
              </div>
            )
          ) : isEditMode ? (
            // Grid edit mode: drag-and-drop reorder
            <Droppable droppableId="favorites" direction="horizontal" type="FAVORITE">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  >
                    {favoritedApps.map((app, i) => (
                      <Draggable key={app.id} draggableId={`fav-${app.id}`} index={i}>
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
                              isFavorited={true}
                              onToggleFavorite={() => onToggleFavorite(app.id)}
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
          ) : (
            // Grid normal mode
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {favoritedApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isFavorited={true}
                  onToggleFavorite={() => onToggleFavorite(app.id)}
                  onDragStart={(e) => onDragStart(e, app.id)}
                  onDragEnd={onDragEnd}
                  isDragging={draggingAppId === app.id}
                  onOpenApp={onOpenApp}
                  isEditMode={false}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}