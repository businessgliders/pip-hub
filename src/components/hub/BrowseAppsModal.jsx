import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl backdrop-blur-xl bg-white/90 border border-white/60 shadow-2xl p-4 md:p-8 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Browse Apps</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
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

        {loading ? (
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