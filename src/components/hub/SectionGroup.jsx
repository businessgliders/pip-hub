import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
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
  onRenameSection,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingValue, setRenamingValue] = useState(section.name);

  const handleDragEnd = (result) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    onReorderAppsInSection?.(section.id, result.source.index, result.destination.index);
  };

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
                setIsCollapsed(c => !c);
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