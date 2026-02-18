import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BrowseAppsModal({ sections, userApps, onClose, onAddApp }) {
  const [ownerApps, setOwnerApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingAppId, setAddingAppId] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [showAddAppForm, setShowAddAppForm] = useState(false);
  const [newAppData, setNewAppData] = useState({
    name: '',
    url: '',
    description: '',
    section_id: '',
    icon_url: '',
    is_new: false,
    open_in_new_tab: false,
    is_global: false
  });
  const [isFetchingIcon, setIsFetchingIcon] = useState(false);

  useEffect(() => {
    const fetchOwnerApps = async () => {
      try {
        // Fetch all apps created by owner
        const allApps = await base44.entities.App.list('order');
        const ownerCreatedApps = allApps.filter(app => 
          app.created_by === 'info@pilatesinpinkstudio.com' || 
          app.created_by === 'gurpreen@pilatesinpinkstudio.com'
        );
        setOwnerApps(ownerCreatedApps);
      } catch (err) {
        console.error('Failed to fetch owner apps:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerApps();
  }, []);

  const isAppAlreadyAdded = (ownerApp) => {
    // Check if user already has this app (by name and url)
    return userApps.some(userApp => 
      userApp.name === ownerApp.name && userApp.url === ownerApp.url
    );
  };

  const handleAddApp = async (ownerApp) => {
    if (!selectedSection) {
      alert('Please select a section first');
      return;
    }

    setAddingAppId(ownerApp.id);
    try {
      // Clone the app for the current user
      await onAddApp({
        name: ownerApp.name,
        url: ownerApp.url,
        description: ownerApp.description,
        icon_url: ownerApp.icon_url,
        section_id: selectedSection,
        is_new: false,
        open_in_new_tab: ownerApp.open_in_new_tab,
        is_global: false // User's copy is not global
      });
    } catch (err) {
      console.error('Failed to add app:', err);
    } finally {
      setAddingAppId(null);
    }
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

  const handleCreateApp = async (e) => {
    e.preventDefault();
    if (!newAppData.name || !newAppData.url || !newAppData.section_id) return;
    try {
      await onAddApp(newAppData);
      setNewAppData({
        name: '',
        url: '',
        description: '',
        section_id: '',
        icon_url: '',
        is_new: false,
        open_in_new_tab: false,
        is_global: false
      });
      setShowAddAppForm(false);
    } catch (err) {
      console.error('Failed to create app:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl backdrop-blur-xl bg-white/90 border border-white/60 shadow-2xl p-4 md:p-8 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Browse Apps</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddAppForm(true)}
              size="sm"
              className="bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add App
            </Button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <Label className="text-gray-700 font-medium">Add to Section</Label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="mt-1.5 bg-white/60 border-gray-200">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {sections.filter(s => s.name !== 'All Users').map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showAddAppForm ? (
          <form onSubmit={handleCreateApp} className="space-y-5">
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
              <Select
                value={newAppData.section_id}
                onValueChange={(value) => setNewAppData({ ...newAppData, section_id: value })}
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
                </SelectContent>
              </Select>
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

            <div className="flex items-center justify-between">
              <Label htmlFor="is_new" className="text-gray-700 font-medium">Show "New" Badge</Label>
              <Switch
                id="is_new"
                checked={newAppData.is_new}
                onCheckedChange={(checked) => setNewAppData({ ...newAppData, is_new: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="open_in_new_tab" className="text-gray-700 font-medium">Open in New Tab</Label>
              <Switch
                id="open_in_new_tab"
                checked={newAppData.open_in_new_tab}
                onCheckedChange={(checked) => setNewAppData({ ...newAppData, open_in_new_tab: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_global" className="text-gray-700 font-medium">Global (Visible to All Users)</Label>
              <Switch
                id="is_global"
                checked={newAppData.is_global}
                onCheckedChange={(checked) => setNewAppData({ ...newAppData, is_global: checked })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddAppForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create App
              </Button>
            </div>
          </form>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#f1889b]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ownerApps.map((app) => {
              const alreadyAdded = isAppAlreadyAdded(app);
              const isAdding = addingAppId === app.id;

              return (
                <div
                  key={app.id}
                  className="flex items-center gap-4 p-4 rounded-xl backdrop-blur-md bg-white/60 border border-white/80 hover:bg-white/80 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#f1889b]/20 to-[#f7b1bd]/20 border border-[#f1889b]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {app.icon_url ? (
                      <img src={app.icon_url} alt={app.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{app.name}</h3>
                    {app.description && (
                      <p className="text-xs text-gray-500 truncate">{app.description}</p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    disabled={alreadyAdded || isAdding}
                    onClick={() => handleAddApp(app)}
                    className={`${
                      alreadyAdded 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white'
                    }`}
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : alreadyAdded ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && ownerApps.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No apps available to browse
          </div>
        )}
      </div>
    </div>
  );
}