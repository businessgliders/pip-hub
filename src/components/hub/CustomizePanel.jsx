import React, { useState } from 'react';
import { X, GripVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const GRADIENT_OPTIONS = [
  { id: 'default', name: 'Default Pink', gradient: 'from-[#fbe0e2] via-[#f7b1bd] to-[#fbe0e2]' },
  { id: 'blue', name: 'Calm Blue', gradient: 'from-[#e0f2fe] via-[#bae6fd] to-[#e0f2fe]' },
  { id: 'purple', name: 'Royal Purple', gradient: 'from-[#f3e8ff] via-[#ddd6fe] to-[#f3e8ff]' },
  { id: 'green', name: 'Fresh Green', gradient: 'from-[#dcfce7] via-[#bbf7d0] to-[#dcfce7]' },
  { id: 'orange', name: 'Warm Orange', gradient: 'from-[#fed7aa] via-[#fdba74] to-[#fed7aa]' },
];

export default function CustomizePanel({ apps, sections, selectedGradient, onGradientChange, onReorderApps, onDeleteApp, onHideApp, onEditApp, onManageSections, onClose, isOwner, hiddenApps = [] }) {
  const getSection = (sectionId) => sections.find(s => s.id === sectionId);

  const groupedApps = sections.map(section => ({
    section,
    apps: apps.filter(app => app.section_id === section.id)
  })).filter(group => group.apps.length > 0);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onReorderApps(result.source.index, result.destination.index);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/20 backdrop-blur-sm p-2 md:p-6">
      <div className="max-w-4xl mx-auto mt-4 md:mt-20 mb-4 md:mb-20">
        <div className="rounded-3xl backdrop-blur-xl bg-white/95 border border-white/60 shadow-2xl p-4 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">Customize</h2>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Close
            </Button>
          </div>

          {/* Background Gradient Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Background Theme</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GRADIENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onGradientChange(option.id)}
                  className={`p-4 rounded-xl transition-all border-2 ${
                    selectedGradient === option.id
                      ? 'border-[#f1889b] scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-20 rounded-lg bg-gradient-to-br ${option.gradient} mb-2`} />
                  <p className="text-sm font-medium text-gray-700 text-center">{option.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Manage Sections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">All Apps</h3>
              <Button
                onClick={onManageSections}
                variant="outline"
                size="sm"
                className="rounded-lg"
              >
                Manage Sections
              </Button>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="apps">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-6"
                  >
                    {groupedApps.map(({ section, apps: sectionApps }) => (
                      <div key={section.id}>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2 px-2">{section.name}</h4>
                        <div className="space-y-2">
                          {sectionApps.map((app, index) => {
                            const globalIndex = apps.findIndex(a => a.id === app.id);
                            return (
                              <Draggable key={app.id} draggableId={app.id} index={globalIndex}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 p-3 rounded-lg backdrop-blur-md bg-white/60 border border-white/80 hover:bg-white/80 transition-colors group ${
                                      snapshot.isDragging ? 'shadow-lg scale-[1.01]' : ''
                                    }`}
                                  >
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing" />
                                    </div>
                                    
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f1889b]/20 to-[#f7b1bd]/20 border border-[#f1889b]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                      {app.icon_url ? (
                                        <img src={app.icon_url} alt={app.name} className="w-6 h-6 object-contain" />
                                      ) : (
                                        <div className="w-6 h-6 rounded bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-gray-800 text-sm truncate">{app.name}</h5>
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-blue-50"
                                        onClick={() => onEditApp(app)}
                                      >
                                        <Edit className="w-4 h-4 text-blue-500" />
                                      </Button>
                                      {isOwner ? (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 hover:bg-red-50"
                                          onClick={() => onDeleteApp(app.id)}
                                          title="Delete App"
                                        >
                                          <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 hover:bg-gray-50"
                                          onClick={() => onHideApp(app.id)}
                                          title="Hide App"
                                        >
                                          <EyeOff className="w-4 h-4 text-gray-500" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
    </div>
  );
}