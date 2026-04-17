import React, { useState, useRef, useEffect } from 'react';
import { X, GripVertical, Edit, Trash2, EyeOff, Plus, Check, ChevronUp, ChevronDown, Image, RefreshCw, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import ConfirmationModal from './ConfirmationModal';

const GRADIENT_OPTIONS = [
  { id: 'default', name: 'Pink', gradient: 'from-[#fbe0e2] via-[#f7b1bd] to-[#fbe0e2]' },
  { id: 'blue', name: 'Blue', gradient: 'from-[#e0f2fe] via-[#bae6fd] to-[#e0f2fe]' },
  { id: 'purple', name: 'Purple', gradient: 'from-[#f3e8ff] via-[#ddd6fe] to-[#f3e8ff]' },
  { id: 'green', name: 'Green', gradient: 'from-[#dcfce7] via-[#bbf7d0] to-[#dcfce7]' },
  { id: 'orange', name: 'Orange', gradient: 'from-[#fed7aa] via-[#fdba74] to-[#fed7aa]' },
  { id: 'dark', name: 'Dark', gradient: 'from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]' },
];

const THEME_WALLPAPERS = {
  default: [
    'https://images.unsplash.com/photo-1490750967868-88df5691cc8d?w=1920&q=80', // pink flowers
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1920&q=80', // pink roses
    'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1920&q=80', // soft pink petals
    'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=1920&q=80', // pink cherry blossoms
    'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1920&q=80', // pink sky
  ],
  blue: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80', // blue ocean
    'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80', // blue sea
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80', // blue night sky
    'https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=1920&q=80', // blue water
    'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=1920&q=80', // blue abstract
  ],
  purple: [
    'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80', // purple galaxy
    'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1920&q=80', // purple nebula
    'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=1920&q=80', // purple night
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1920&q=80', // purple lavender
    'https://images.unsplash.com/photo-1550159930-40066082a4fc?w=1920&q=80', // purple flowers
  ],
  green: [
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80', // green forest
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=80', // green hills
    'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=1920&q=80', // green trees
    'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1920&q=80', // green leaves
    'https://images.unsplash.com/photo-1511497584788-876760111969?w=1920&q=80', // green nature
  ],
  orange: [
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1920&q=80', // orange sunset
    'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1920&q=80', // warm sunset
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920&q=80', // orange sky
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80', // warm mountain
    'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=1920&q=80', // orange landscape
  ],
  dark: [
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80', // dark starry sky
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80', // dark mountains
    'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1920&q=80', // dark ocean
    'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=1920&q=80', // dark night
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80', // dark landscape
  ],
};

export default function CustomizePanel({ apps, sections, selectedGradient, onGradientChange, customWallpaper, onWallpaperChange, onReorderApps, onReorderSections, onDeleteApp, onHideApp, onEditApp, onManageSections, onClose, isOwner, hiddenApps = [] }) {
  const [activeTab, setActiveTab] = useState('apps');
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const [uploadedWallpapers, setUploadedWallpapers] = useState([]);
  const fileInputRef = useRef(null);

  // Load saved uploaded wallpapers from user profile
  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.uploadedWallpapers) setUploadedWallpapers(u.uploadedWallpapers);
    });
  }, []);
  const [renamingSectionId, setRenamingSectionId] = useState(null);
  const [renamingSectionName, setRenamingSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [localApps, setLocalApps] = useState(apps);
  const [localSections, setLocalSections] = useState(sections);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  const getSection = (sectionId) => sections.find(s => s.id === sectionId);

  const handleRandomWallpaper = () => {
    const pool = THEME_WALLPAPERS[selectedGradient] || THEME_WALLPAPERS.default;
    const url = pool[Math.floor(Math.random() * pool.length)];
    onWallpaperChange(url);
  };

  const handleUploadWallpaper = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingWallpaper(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...uploadedWallpapers, file_url];
    setUploadedWallpapers(updated);
    await base44.auth.updateMe({ uploadedWallpapers: updated });
    onWallpaperChange(file_url);
    setIsUploadingWallpaper(false);
    // reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteUploadedWallpaper = async (url) => {
    const updated = uploadedWallpapers.filter(w => w !== url);
    setUploadedWallpapers(updated);
    await base44.auth.updateMe({ uploadedWallpapers: updated });
    // If the deleted one was active, clear it
    if (customWallpaper === url) onWallpaperChange(null);
  };

  const groupedApps = localSections.map(section => ({
    section,
    apps: localApps.filter(app => app.section_id === section.id)
  })).filter(group => group.apps.length > 0);

  const handleDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setHasChanges(true);

    if (type === 'SECTION' || source.droppableId === 'sections') {
      const reordered = Array.from(localSections);
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);
      setLocalSections(reordered);
    } else {
      const sourceSectionId = source.droppableId;
      const destSectionId = destination.droppableId;
      
      const sourceApps = localApps.filter(app => app.section_id === sourceSectionId);
      const destApps = sourceSectionId === destSectionId ? sourceApps : localApps.filter(app => app.section_id === destSectionId);
      const otherApps = localApps.filter(app => app.section_id !== sourceSectionId && app.section_id !== destSectionId);
      
      if (sourceSectionId === destSectionId) {
        const reordered = Array.from(sourceApps);
        const [removed] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, removed);
        setLocalApps([...otherApps, ...reordered]);
      } else {
        const sourceReordered = Array.from(sourceApps);
        const destReordered = Array.from(destApps);
        const [removed] = sourceReordered.splice(source.index, 1);
        removed.section_id = destSectionId;
        destReordered.splice(destination.index, 0, removed);
        setLocalApps([...otherApps, ...sourceReordered, ...destReordered]);
      }
    }
  };

  const moveApp = (sectionId, fromIndex, toIndex) => {
    const sectionApps = localApps.filter(app => app.section_id === sectionId);
    const otherApps = localApps.filter(app => app.section_id !== sectionId);
    const reordered = Array.from(sectionApps);
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    setLocalApps([...otherApps, ...reordered]);
    setHasChanges(true);
  };

  const handleSave = () => {
    setConfirmAction({
      type: 'save',
      message: 'Save your changes?',
      action: async () => {
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
      }
    });
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
          <div className="mb-6">
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

          {/* Wallpaper Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Wallpaper</h3>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {/* Random from Unsplash tile */}
              <div className="relative group">
                <button
                  onClick={handleRandomWallpaper}
                  className="w-full p-1 rounded-lg border-2 border-gray-200 hover:border-[#f1889b] transition-all"
                >
                  <div className="w-full h-12 rounded bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center mt-1 truncate">Random</p>
                </button>
              </div>

              {/* Upload Image tile */}
              <div className="relative group">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingWallpaper}
                  className="w-full p-1 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#f1889b] transition-all"
                >
                  <div className="w-full h-12 rounded bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center">
                    <Upload className={`w-5 h-5 text-pink-500 ${isUploadingWallpaper ? 'animate-pulse opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center mt-1 truncate">
                    {isUploadingWallpaper ? 'Uploading…' : 'Upload'}
                  </p>
                </button>
              </div>

              {/* Uploaded wallpaper tiles */}
              {uploadedWallpapers.map((url) => (
                <div key={url} className="relative group">
                  <button
                    onClick={() => onWallpaperChange(url)}
                    className={`w-full p-1 rounded-lg border-2 transition-all ${
                      customWallpaper === url ? 'border-[#f1889b] scale-105' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={url} alt="Uploaded wallpaper" className="w-full h-12 object-cover rounded" />
                    <p className="text-xs font-medium text-gray-700 text-center mt-1 truncate">Custom</p>
                  </button>
                  <button
                    onClick={() => handleDeleteUploadedWallpaper(url)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="Delete"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}


            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadWallpaper} />
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
                    <Droppable key={section.id} droppableId={section.id} type="APP">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          <h4 className="text-sm font-semibold text-gray-600 mb-2 px-2">{section.name}</h4>
                          <div className="space-y-2">
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
                                    className={`flex items-center gap-3 p-3 rounded-lg border group ${
                                      snapshot.isDragging 
                                        ? 'shadow-2xl scale-105 bg-white border-[#f1889b] z-50' 
                                        : 'bg-white/60 border-white/80 hover:bg-white/80 transition-all'
                                    }`}
                                  >
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing" />
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
                                          onClick={() => setConfirmAction({
                                            type: 'delete',
                                            message: `Delete "${app.name}"?`,
                                            action: () => onDeleteApp(app.id)
                                          })}
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
                        </div>
                      )}
                    </Droppable>
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

      {confirmAction && (
        <ConfirmationModal
          type={confirmAction.type}
          message={confirmAction.message}
          onConfirm={confirmAction.action}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}