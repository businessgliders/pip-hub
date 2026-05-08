import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import LaunchpadIcon from './LaunchpadIcon';

// Folder tile shown in the main grid — preview of up to 9 mini icons.
// In edit mode the section name becomes inline-editable.
export function LaunchpadFolderTile({ section, apps, onOpen, isEditMode, onRename, isDragging = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const inputRef = useRef(null);

  useEffect(() => { setName(section.name); }, [section.name]);
  useEffect(() => { if (isEditing) inputRef.current?.focus(); }, [isEditing]);

  const previewApps = apps.slice(0, 9);

  const commitRename = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== section.name) onRename?.(section.id, trimmed);
    else setName(section.name);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-20 sm:w-24">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
        className={`group focus:outline-none ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      >
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 p-1.5 grid grid-cols-3 gap-0.5 shadow-lg transition-transform ${isEditMode && !isDragging ? 'animate-[wiggle_0.6s_ease-in-out_infinite]' : ''} ${!isEditMode ? 'group-hover:scale-105 group-active:scale-95' : ''}`}>
          {previewApps.map((app) => (
            <div
              key={app.id}
              className="w-full aspect-square rounded-md bg-white/70 flex items-center justify-center overflow-hidden"
            >
              {app.icon_url ? (
                <img src={app.icon_url} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
              )}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 9 - previewApps.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-full aspect-square" />
          ))}
        </div>
      </div>

      {isEditMode ? (
        isEditing ? (
          <div className="flex items-center gap-1 w-full">
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setName(section.name); setIsEditing(false); }
              }}
              className="text-xs sm:text-sm text-center w-full px-1 py-0.5 rounded bg-white border border-[#f1889b]/60 focus:outline-none focus:ring-2 focus:ring-[#f1889b]/40"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitRename}
              className="w-5 h-5 flex items-center justify-center rounded bg-green-500 text-white"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs sm:text-sm text-gray-800 font-medium text-center hover:bg-white/40 px-2 py-0.5 rounded transition-colors"
          >
            <span className="truncate">{section.name}</span>
            <Pencil className="w-3 h-3 text-gray-500 flex-shrink-0" />
          </button>
        )
      ) : (
        <span className="text-xs sm:text-sm text-gray-800 font-medium text-center truncate w-full">
          {section.name}
        </span>
      )}
    </div>
  );
}

// Expanded folder — inline overlay revealing all the apps inside.
// In edit mode, apps inside the folder can be reordered via drag-and-drop
// (handled by the page-level DragDropContext via the FOLDER_APP type).
export function LaunchpadFolderExpanded({ section, apps, onClose, onOpenApp, isEditMode, onEditApp, onDeleteApp, onHideApp, favorites = [], onToggleFavorite }) {
  const gridClass = "grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 max-h-[60vh] overflow-y-auto px-1 justify-items-center";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="w-full max-w-3xl rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-center text-gray-800 text-xl font-semibold mb-6">
          {section.name}
        </h3>

        {isEditMode ? (
          <Droppable droppableId={`folder-${section.id}`} type="FOLDER_APP">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className={gridClass}>
                {apps.map((app, index) => (
                  <Draggable key={app.id} draggableId={`folder-app-${app.id}`} index={index}>
                    {(prov, snap) => {
                      const child = (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          style={prov.draggableProps.style}
                          className={snap.isDragging ? 'z-[60]' : ''}
                        >
                          <LaunchpadIcon
                            app={app}
                            onOpen={() => onOpenApp(app)}
                            isEditMode={isEditMode}
                            onEdit={onEditApp}
                            onDelete={onDeleteApp}
                            onHide={onHideApp}
                            isFavorited={favorites.includes(app.id)}
                            onToggleFavorite={onToggleFavorite}
                            isDragging={snap.isDragging}
                          />
                        </div>
                      );
                      // Portal the dragged item to body to escape transformed/scrolled ancestors
                      // (the folder modal uses framer-motion scale + overflow-y-auto, which break
                      // @hello-pangea/dnd's position calculations).
                      if (snap.isDragging && typeof document !== 'undefined') {
                        return createPortal(child, document.body);
                      }
                      return child;
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ) : (
          <div className={gridClass}>
            {apps.map((app) => (
              <LaunchpadIcon
                key={app.id}
                app={app}
                onOpen={() => onOpenApp(app)}
                isEditMode={isEditMode}
                onEdit={onEditApp}
                onDelete={onDeleteApp}
                onHide={onHideApp}
                isFavorited={favorites.includes(app.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}