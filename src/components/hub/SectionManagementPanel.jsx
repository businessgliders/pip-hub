import React, { useState } from 'react';
import { Trash2, Edit, GripVertical, Plus, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function SectionManagementPanel({ sections, onCreateSection, onUpdateSection, onDeleteSection, onReorderSections, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const handleStartEdit = (section) => {
    setEditingId(section.id);
    setEditingName(section.name);
  };

  const handleSaveEdit = () => {
    if (editingName.trim()) {
      onUpdateSection(editingId, { name: editingName });
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      const maxOrder = Math.max(...sections.map(s => s.order || 0), 0);
      onCreateSection({ name: newSectionName, order: maxOrder + 1 });
      setNewSectionName('');
      setIsAdding(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const reorderedSections = Array.from(sections);
    const [removed] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, removed);
    
    // Update order values and save immediately
    const updates = reorderedSections.map((section, index) => ({
      id: section.id,
      order: index + 1
    }));
    
    // Call updates for each section
    for (const update of updates) {
      await onUpdateSection(update.id, { order: update.order });
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/20 backdrop-blur-sm p-6">
      <div className="max-w-3xl mx-auto mt-20 mb-20">
        <div className="rounded-3xl backdrop-blur-xl bg-white/95 border border-white/60 shadow-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">Manage Sections</h2>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Close
            </Button>
          </div>

          <Button
            onClick={() => setIsAdding(true)}
            className="w-full mb-6 bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Section
          </Button>

          {isAdding && (
            <div className="mb-6 p-4 rounded-xl backdrop-blur-md bg-white/60 border border-white/80">
              <div className="flex gap-2">
                <Input
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Section name"
                  className="flex-1 bg-white/60"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                />
                <Button
                  onClick={handleAddSection}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    setIsAdding(false);
                    setNewSectionName('');
                  }}
                  size="sm"
                  variant="outline"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 rounded-xl backdrop-blur-md bg-white/60 border border-white/80 hover:bg-white/80 transition-colors group ${
                            snapshot.isDragging ? 'shadow-xl scale-[1.02]' : ''
                          }`}
                        >
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing" />
                          </div>

                          {editingId === section.id ? (
                            <div className="flex-1 flex gap-2">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 bg-white/60"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                autoFocus
                              />
                              <Button
                                onClick={handleSaveEdit}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingName('');
                                }}
                                size="sm"
                                variant="outline"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">{section.name}</h3>
                                <p className="text-xs text-gray-500">Order: {section.order}</p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-blue-50"
                                  onClick={() => handleStartEdit(section)}
                                >
                                  <Edit className="w-4 h-4 text-blue-500" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-red-50"
                                  onClick={() => onDeleteSection(section.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}