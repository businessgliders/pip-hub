import React, { useState } from 'react';
import { X, GripVertical, Edit, Trash2, EyeOff, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';

const GRADIENT_OPTIONS = [
  { id: 'default', name: 'Pink', gradient: 'from-[#fbe0e2] via-[#f7b1bd] to-[#fbe0e2]' },
  { id: 'blue', name: 'Blue', gradient: 'from-[#e0f2fe] via-[#bae6fd] to-[#e0f2fe]' },
  { id: 'purple', name: 'Purple', gradient: 'from-[#f3e8ff] via-[#ddd6fe] to-[#f3e8ff]' },
  { id: 'green', name: 'Green', gradient: 'from-[#dcfce7] via-[#bbf7d0] to-[#dcfce7]' },
  { id: 'orange', name: 'Orange', gradient: 'from-[#fed7aa] via-[#fdba74] to-[#fed7aa]' },
  { id: 'dark', name: 'Dark', gradient: 'from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]' },
];

export default function CustomizePanel({ apps, sections, selectedGradient, onGradientChange, onReorderApps, onReorderSections, onDeleteApp, onHideApp, onEditApp, onManageSections, onClose, isOwner, hiddenApps = [] }) {
  const [activeTab, setActiveTab] = useState('apps');
  const [renamingSectionId, setRenamingSectionId] = useState(null);
  const [renamingSectionName, setRenamingSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [localApps, setLocalApps] = useState(apps);
  const [localSections, setLocalSections] = useState(sections);
  const [hasChanges, setHasChanges] = useState(false);
  
  const getSection = (sectionId) => sections.find(s => s.id === sectionId);

  const groupedApps = localSections.map(section => ({
    section,
    apps: localApps.filter(app => app.section_id === section.id)
  })).filter(group => group.apps.length > 0);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index && result.source.droppableId === result.destination.droppableId) return;
    
    setHasChanges(true);
    
    if (activeTab === 'apps') {
      // Only allow reordering within the same section
      if (result.source.droppableId !== result.destination.droppableId) return;
      
      const sectionId = result.source.droppableId;
      const sectionApps = localApps.filter(app => app.section_id === sectionId);
      const otherApps = localApps.filter(app => app.section_id !== sectionId);
      
      const [removed] = sectionApps.splice(result.source.index, 1);
      sectionApps.splice(result.destination.index, 0, removed);
      
      setLocalApps([...otherApps, ...sectionApps].sort((a, b) => {
        if (a.section_id === sectionId && b.section_id === sectionId) {
          return sectionApps.indexOf(a) - sectionApps.indexOf(b);
        }
        return (a.order || 0) - (b.order || 0);
      }));
    } else {
      const reordered = Array.from(localSections);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      setLocalSections(reordered);
    }
  };

  const handleSave = async () => {
    if (activeTab === 'apps') {
      // Group apps by section and update order within each section
      const grouped = {};
      localApps.forEach(app => {
        if (!grouped[app.section_id]) grouped[app.section_id] = [];
        grouped[app.section_id].push(app);
      });
      
      const updates = [];
      Object.values(grouped).forEach(sectionApps => {
        sectionApps.forEach((app, index) => {
          updates.push(base44.entities.App.update(app.id, { order: index + 1 }));
        });
      });
      
      await Promise.all(updates);
    } else {
      await onReorderSections(0, 0); // Trigger with dummy values  
      // Update user section preferences
      const user = await base44.auth.me();
      await Promise.all(
        localSections.map(async (section, index) => {
          const existing = await base44.entities.UserSectionPreference.filter({
            user_email: user.email,
            section_id: section.id
          });
          
          if (existing.length > 0) {
            await base44.entities.UserSectionPreference.update(existing[0].id, {
              custom_order: index + 1
            });
          } else {
            await base44.entities.UserSectionPreference.create({
              user_email: user.email,
              section_id: section.id,
              custom_order: index + 1
            });
          }
        })
      );
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/20 backdrop-blur-sm p-2 md:p-6">
      <div className="max-w-4xl mx-auto mt-4 md:mt-20 mb-4 md:mb-20">
        <div className="rounded-3xl backdrop-blur-xl bg-white/95 border border-white/60 shadow-2xl p-4 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">Customize</h2>
            <div className="flex gap-2">
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  className="rounded-xl bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white"
                >
                  Save Changes
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>

          {/* Background Gradient Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Background Theme</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {GRADIENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onGradientChange(option.id)}
                  className={`p-2 rounded-lg transition-all border-2 ${
                    selectedGradient === option.id
                      ? 'border-[#f1889b] scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-12 rounded bg-gradient-to-br ${option.gradient} mb-1`} />
                  <p className="text-xs font-medium text-gray-700 text-center">{option.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('apps')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'apps'
                    ? 'text-[#f1889b] border-b-2 border-[#f1889b]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Apps
              </button>
              <button
                onClick={() => setActiveTab('sections')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'sections'
                    ? 'text-[#f1889b] border-b-2 border-[#f1889b]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sections
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            {activeTab === 'apps' ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="space-y-6">
                  {groupedApps.map(({ section, apps: sectionApps }) => (
                    <div key={section.id}>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 px-2">{section.name}</h4>
                      <Droppable droppableId={section.id}>
                        {(provided, snapshot) => (
                          <div 
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`space-y-2 min-h-[60px] rounded-lg transition-colors ${
                              snapshot.isDraggingOver ? 'bg-[#f1889b]/5' : ''
                            }`}
                          >
                            {sectionApps.map((app, index) => (
                              <Draggable key={app.id} draggableId={app.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-lg backdrop-blur-md border group ${
                                      snapshot.isDragging 
                                        ? 'shadow-2xl scale-105 bg-white border-[#f1889b] z-50' 
                                        : 'bg-white/60 border-white/80 hover:bg-white/80 transition-all'
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
                                      {isOwner || !app.is_global ? (
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
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </DragDropContext>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={() => setIsAddingSection(true)}
                  variant="outline"
                  className="w-full border-dashed border-2 border-[#f1889b]/30 hover:border-[#f1889b]/50 hover:bg-[#f1889b]/5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Section
                </Button>

                {isAddingSection && (
                  <div className="flex gap-2 p-4 rounded-lg backdrop-blur-md bg-white/60 border border-white/80">
                    <Input
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      placeholder="Section name"
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newSectionName.trim()) {
                          const maxOrder = Math.max(...sections.map(s => s.order || 0), 0);
                          base44.entities.Section.create({ name: newSectionName, order: maxOrder + 1 });
                          setNewSectionName('');
                          setIsAddingSection(false);
                        } else if (e.key === 'Escape') {
                          setIsAddingSection(false);
                          setNewSectionName('');
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newSectionName.trim()) {
                          const maxOrder = Math.max(...sections.map(s => s.order || 0), 0);
                          base44.entities.Section.create({ name: newSectionName, order: maxOrder + 1 });
                          setNewSectionName('');
                          setIsAddingSection(false);
                        }
                      }}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingSection(false);
                        setNewSectionName('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {localSections.map((section, index) => (
                          <Draggable key={section.id} draggableId={section.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                }}
                                className={`flex items-center gap-3 p-4 rounded-lg backdrop-blur-md border group ${
                                  snapshot.isDragging 
                                    ? 'shadow-2xl scale-105 bg-white border-[#f1889b] z-50' 
                                    : 'bg-white/60 border-white/80 hover:bg-white/80 transition-all'
                                }`}
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing" />
                                </div>

                                <div className="flex-1">
                                  {renamingSectionId === section.id ? (
                                    <Input
                                      value={renamingSectionName}
                                      onChange={(e) => setRenamingSectionName(e.target.value)}
                                      className="h-8"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && renamingSectionName.trim()) {
                                          base44.entities.Section.update(section.id, { name: renamingSectionName });
                                          setRenamingSectionId(null);
                                        } else if (e.key === 'Escape') {
                                          setRenamingSectionId(null);
                                        }
                                      }}
                                    />
                                  ) : (
                                    <h5 className="font-medium text-gray-800">{section.name}</h5>
                                  )}
                                </div>

                                {renamingSectionId === section.id ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        if (renamingSectionName.trim()) {
                                          base44.entities.Section.update(section.id, { name: renamingSectionName });
                                          setRenamingSectionId(null);
                                        }
                                      }}
                                      className="bg-green-500 hover:bg-green-600 h-8"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setRenamingSectionId(null)}
                                      className="h-8"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    onClick={() => {
                                      setRenamingSectionId(section.id);
                                      setRenamingSectionName(section.name);
                                    }}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Rename
                                  </Button>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}