import React, { useState } from 'react';
import { ChevronRight, Check, X, GripVertical } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
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
  onReorderAppsInSection,
  onRenameSection,
  isCollapsed,
  onToggleCollapse,
  dragHandleProps,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingValue, setRenamingValue] = useState(section.name);

  const handleRenameSubmit = () => {
    if (renamingValue.trim() && renamingValue !== section.name) {
      onRenameSection?.(section.id, renamingValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenamingValue(section.name);
    setIsRenaming(false);
  };

  return (
    <div className="mb-10">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        {isEditMode && dragHandleProps && (
          <div
            {...dragHandleProps}
            className="flex items-center justify-center p-1.5 rounded-lg hover:bg-white/50 cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripVertical className="w-5 h-5 text-gray-500" />
          </div>
        )}

        {/* Section name / rename input */}
        {isEditMode && isRenaming ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={renamingValue}
              onChange={(e) => setRenamingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') handleRenameCancel();
              }}
              autoFocus
              className="text-xl font-semibold text-gray-800 tracking-tight bg-white/80 border border-[#f1889b]/40 rounded-lg px-2 py-0.5 flex-1 outline-none focus:ring-2 focus:ring-[#f1889b]/30"
            />
            <button onClick={handleRenameSubmit} className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 transition-colors">
              <Check className="w-4 h-4 text-white" />
            </button>
            <button onClick={handleRenameCancel} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (isEditMode) {
                setRenamingValue(section.name);
                setIsRenaming(true);
              } else {
                onToggleCollapse?.();
              }
            }}
            className={`flex items-center gap-1.5 flex-1 text-left group ${isEditMode ? 'cursor-text' : 'cursor-pointer'}`}
          >
            <h2 className={`text-xl font-semibold text-gray-800 tracking-tight ${isEditMode ? 'underline decoration-dashed decoration-gray-300 underline-offset-2' : ''}`}>
              {section.name}
            </h2>
            {!isEditMode && (
              <ChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
              />
            )}
          </button>
        )}
      </div>

      {/* Content — hidden when collapsed */}
      {!isCollapsed && (
        <>
          {viewMode === 'list' ? (
            isEditMode ? (
              <Droppable droppableId={section.id} direction="vertical" type="APP">
                {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm"
                    >
                      {apps.map((app, i) => (
                        <Draggable key={app.id} draggableId={app.id} index={i}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{ ...provided.draggableProps.style }}
                              className={snapshot.isDragging ? 'opacity-80 z-50 shadow-xl bg-white rounded-lg' : ''}
                            >
                              <AppListRow
                                app={app}
                                isFavorited={favorites.includes(app.id)}
                                onToggleFavorite={onToggleFavorite}
                                onOpenApp={onOpenApp}
                                isLast={i === apps.length - 1}
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
                  />
                ))}
              </div>
            )
          ) : isEditMode ? (
            <Droppable droppableId={section.id} direction="horizontal" type="APP">
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