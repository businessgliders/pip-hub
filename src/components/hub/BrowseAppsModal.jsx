import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, Check, Loader2, Globe, Sparkles, ExternalLink, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ConfirmationModal from './ConfirmationModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BrowseAppsModal({ sections, userApps, hiddenApps = [], onClose, onAddApp, onUnhideApp }) {
  const [ownerApps, setOwnerApps] = useState([]);
  const [ownerSections, setOwnerSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingAppId, setAddingAppId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAppData, setNewAppData] = useState({
    name: '',
    url: '',
    description: '',
    section_id: '',
    icon_url: '',
    is_new: true,
    open_in_new_tab: true,
    is_global: false
  });
  const [isFetchingIcon, setIsFetchingIcon] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [user, setUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const fetchOwnerApps = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const allApps = await base44.entities.App.list('order');
        const allSections = await base44.entities.Section.list('order');
        
        // Only get apps from the primary owner account
        const ownerCreatedApps = allApps.filter(app => 
          app.created_by === 'info@pilatesinpinkstudio.com'
        );
        
        // Remove duplicates, keeping the first occurrence
        const uniqueApps = ownerCreatedApps.filter((app, index, self) => 
          index === self.findIndex(a => a.name === app.name && a.url === app.url)
        );
        
        setOwnerApps(uniqueApps);
        
        // Only keep sections created by the owner
        const ownerCreatedSections = allSections.filter(s => 
          s.created_by === 'info@pilatesinpinkstudio.com'
        );
        setOwnerSections(ownerCreatedSections);
      } catch (err) {
        console.error('Failed to fetch owner apps:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerApps();
  }, []);

  const isAppAlreadyAdded = (ownerApp) => {
    return userApps.some(userApp => 
      userApp.name === ownerApp.name && userApp.url === ownerApp.url
    );
  };

  const isAppHidden = (ownerApp) => {
    // Check if this app is hidden for the current user
    return hiddenApps.some(hidden => hidden.app_id === ownerApp.id);
  };

  const handleAddApp = async (ownerApp) => {
    setAddingAppId(ownerApp.id);
    
    setConfirmAction({
      type: 'add',
      message: `Add "${ownerApp.name}" to your apps?`,
      action: async () => {
        try {
          // Find the section this app belongs to in owner's account
          const ownerSection = ownerSections.find(s => s.id === ownerApp.section_id);
          let targetSectionId = ownerApp.section_id;
          
          // Check if user already has this section
          const userSection = sections.find(s => s.name === ownerSection?.name);
          
          if (!userSection && ownerSection) {
            // Create the section for the user
            const newSection = await base44.entities.Section.create({
              name: ownerSection.name,
              order: ownerSection.order
            });
            targetSectionId = newSection.id;
          } else if (userSection) {
            targetSectionId = userSection.id;
          }

          await onAddApp({
            name: ownerApp.name,
            url: ownerApp.url,
            description: ownerApp.description,
            icon_url: ownerApp.icon_url,
            section_id: targetSectionId,
            is_new: true,
            open_in_new_tab: ownerApp.open_in_new_tab,
            is_global: false
          });
        } finally {
          setAddingAppId(null);
        }
      }
    });
  };

  const autoFetchFavicon = async (url) => {
    if (!url) return;
    setIsFetchingIcon(true);
    try {
      const domain = new URL(url).origin;
      const faviconUrl = `${domain}/favicon.ico`;
      setNewAppData(prev => ({ ...prev, icon_url: faviconUrl }));
    } catch (e) {
      console.error('Invalid URL');
    }
    setIsFetchingIcon(false);
  };

  const handleUrlBlur = () => {
    if (newAppData.url && !newAppData.icon_url) {
      autoFetchFavicon(newAppData.url);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    try {
      const maxOrder = Math.max(...sections.map(s => s.order || 0), 0);
      const newSection = await base44.entities.Section.create({ 
        name: newSectionName, 
        order: maxOrder + 1 
      });
      setNewAppData({ ...newAppData, section_id: newSection.id });
      setIsCreatingSection(false);
      setNewSectionName('');
      // Refresh sections in parent
      window.location.reload();
    } catch (err) {
      console.error('Failed to create section:', err);
    }
  };

  const handleCreateApp = async (e) => {
    e.preventDefault();
    if (!newAppData.name || !newAppData.url || !newAppData.section_id) return;
    
    setConfirmAction({
      type: 'add',
      message: `Add "${newAppData.name}" to your apps?`,
      action: async () => {
        await onAddApp({
          ...newAppData,
          is_new: true
        });
        setNewAppData({
          name: '',
          url: '',
          description: '',
          section_id: '',
          icon_url: '',
          is_new: true,
          open_in_new_tab: true,
          is_global: false
        });
      }
    });
  };

  // Group apps by section and filter by search
  const groupedApps = useMemo(() => {
    const filtered = ownerApps.filter(app =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const groups = {};
    filtered.forEach(app => {
      const section = ownerSections.find(s => s.id === app.section_id);
      const sectionName = section?.name || 'Uncategorized';
      if (!groups[sectionName]) {
        groups[sectionName] = [];
      }
      groups[sectionName].push(app);
    });
    
    return groups;
  }, [ownerApps, ownerSections, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-5xl rounded-3xl backdrop-blur-xl bg-white/90 border border-white/60 shadow-2xl p-4 md:p-8 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Add Apps</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Browse Available Apps Column */}
          <div className="border-r border-gray-200 pr-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Browse Available Apps</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#f1889b]" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search apps..."
                    className="pl-10 bg-white/60 border-gray-200"
                  />
                </div>

                <div className="space-y-6 max-h-[500px] overflow-y-auto">
                  {Object.entries(groupedApps).map(([sectionName, apps]) => (
                    <div key={sectionName}>
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">{sectionName}</h4>
                      <div className="space-y-2">
                        {apps.map((ownerApp) => {
                          const alreadyAdded = isAppAlreadyAdded(ownerApp);
                          const isHidden = isAppHidden(ownerApp);
                          return (
                            <div
                              key={ownerApp.id}
                              className="flex items-center justify-between p-3 rounded-lg backdrop-blur-md bg-white/60 border border-white/80 hover:bg-white/80 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f1889b]/20 to-[#f7b1bd]/20 border border-[#f1889b]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {ownerApp.icon_url ? (
                                    <img src={ownerApp.icon_url} alt={ownerApp.name} className="w-6 h-6 object-contain" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-800 truncate">{ownerApp.name}</h4>
                                    {ownerApp.is_global && (
                                      <Globe className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="Global App" />
                                    )}
                                  </div>
                                  {ownerApp.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{ownerApp.description}</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => isHidden ? onUnhideApp(ownerApp.id) : handleAddApp(ownerApp)}
                                disabled={alreadyAdded || addingAppId === ownerApp.id}
                                size="sm"
                                variant={alreadyAdded ? "outline" : "default"}
                                className={`ml-3 flex-shrink-0 ${alreadyAdded ? "cursor-not-allowed" : "bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white"}`}
                              >
                                {addingAppId === ownerApp.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : alreadyAdded ? (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                  </>
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Custom App Column */}
          <div className="pl-0 md:pl-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Add Custom App</h3>
            <form onSubmit={handleCreateApp} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 font-medium">App Name</Label>
                <Input
                  id="name"
                  value={newAppData.name}
                  onChange={(e) => setNewAppData({ ...newAppData, name: e.target.value })}
                  placeholder="My App"
                  className="mt-1.5 bg-white/60 border-gray-200"
                  required
                />
              </div>

              <div>
                <Label htmlFor="url" className="text-gray-700 font-medium">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={newAppData.url}
                  onChange={(e) => setNewAppData({ ...newAppData, url: e.target.value })}
                  onBlur={handleUrlBlur}
                  placeholder="https://example.com"
                  className="mt-1.5 bg-white/60 border-gray-200"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={newAppData.description}
                  onChange={(e) => setNewAppData({ ...newAppData, description: e.target.value })}
                  placeholder="App description"
                  className="mt-1.5 bg-white/60 border-gray-200 h-20"
                />
              </div>

              <div>
                <Label htmlFor="section" className="text-gray-700 font-medium">Section</Label>
                {isCreatingSection ? (
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      placeholder="New section name"
                      className="bg-white/60 border-gray-200"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                    />
                    <Button
                      type="button"
                      onClick={handleCreateSection}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsCreatingSection(false);
                        setNewSectionName('');
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={newAppData.section_id}
                    onValueChange={(value) => {
                      if (value === 'create_new') {
                        setIsCreatingSection(true);
                      } else {
                        setNewAppData({ ...newAppData, section_id: value });
                      }
                    }}
                    required
                  >
                    <SelectTrigger className="mt-1.5 bg-white/60 border-gray-200">
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.filter(s => s.name !== 'All Users').map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="create_new" className="text-[#f1889b] font-medium">
                        <Plus className="w-4 h-4 inline mr-2" />
                        Create New Section
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="icon_url" className="text-gray-700 font-medium flex items-center gap-2">
                  Icon URL
                  {isFetchingIcon && <Loader2 className="w-3 h-3 animate-spin text-[#f1889b]" />}
                </Label>
                <Input
                  id="icon_url"
                  value={newAppData.icon_url}
                  onChange={(e) => setNewAppData({ ...newAppData, icon_url: e.target.value })}
                  placeholder="Auto-fetched from URL"
                  className="mt-1.5 bg-white/60 border-gray-200"
                />
              </div>

              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Options</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewAppData({ ...newAppData, is_new: !newAppData.is_new })}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      newAppData.is_new 
                        ? 'border-[#f1889b] bg-[#f1889b]/10' 
                        : 'border-gray-200 bg-white/60 hover:border-gray-300'
                    }`}
                  >
                    <Sparkles className={`w-5 h-5 ${newAppData.is_new ? 'text-[#f1889b]' : 'text-gray-400'}`} />
                    <span className="text-xs text-gray-700 text-center">New Badge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAppData({ ...newAppData, open_in_new_tab: !newAppData.open_in_new_tab })}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      newAppData.open_in_new_tab 
                        ? 'border-[#f1889b] bg-[#f1889b]/10' 
                        : 'border-gray-200 bg-white/60 hover:border-gray-300'
                    }`}
                  >
                    <ExternalLink className={`w-5 h-5 ${newAppData.open_in_new_tab ? 'text-[#f1889b]' : 'text-gray-400'}`} />
                    <span className="text-xs text-gray-700 text-center">New Tab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAppData({ ...newAppData, is_global: !newAppData.is_global })}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      newAppData.is_global 
                        ? 'border-[#f1889b] bg-[#f1889b]/10' 
                        : 'border-gray-200 bg-white/60 hover:border-gray-300'
                    }`}
                  >
                    <Globe className={`w-5 h-5 ${newAppData.is_global ? 'text-[#f1889b]' : 'text-gray-400'}`} />
                    <span className="text-xs text-gray-700 text-center">Global</span>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create App
              </Button>
            </form>
          </div>
        </div>
      </div>

      {confirmAction && (
        <ConfirmationModal
          type={confirmAction.type}
          message={confirmAction.message}
          onConfirm={confirmAction.action}
          onCancel={() => {
            setConfirmAction(null);
            setAddingAppId(null);
          }}
        />
      )}
    </div>
  );
}