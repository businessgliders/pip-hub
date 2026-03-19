import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Plus, Shield, Search, Sparkles, LayoutGrid, List, Grid3X3, User, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppCard from '../components/hub/AppCard';
import AppListRow from '../components/hub/AppListRow';
import SectionGroup from '../components/hub/SectionGroup';
import AddAppModal from '../components/hub/AddAppModal';
import EditAppModal from '../components/hub/EditAppModal';
import AdminPanel from '../components/hub/AdminPanel';
import SectionManagementPanel from '../components/hub/SectionManagementPanel';
import AppViewerModal from '../components/hub/AppViewerModal';
import PasswordPrompt from '../components/hub/PasswordPrompt';
import CustomizePanel from '../components/hub/CustomizePanel';
import UserSelection from '../components/hub/UserSelection';
import BrowseAppsModal from '../components/hub/BrowseAppsModal';

export default function AppHub() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSectionPanel, setShowSectionPanel] = useState(false);
        const [draggingAppId, setDraggingAppId] = useState(null);
        const [viewingApp, setViewingApp] = useState(null);
        const [showCustomizePanel, setShowCustomizePanel] = useState(false);
        const [selectedGradient, setSelectedGradient] = useState('default');
        const [showUserSelection, setShowUserSelection] = useState(false);
        const [showBrowseApps, setShowBrowseApps] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'
  const [showMobileSearch, setShowMobileSearch] = useState(false);
        const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.selectedGradient) {
        setSelectedGradient(u.selectedGradient);
      }
      setShowUserSelection(false);
    }).catch(() => {
      setUser(null);
      setShowUserSelection(true);
    });
  }, []);

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allSections = await base44.entities.Section.list('order');
      const allApps = await base44.entities.App.list('order');
      
      // Get section IDs that contain global apps
      const globalAppSectionIds = allApps
        .filter(app => app.is_global === true)
        .map(app => app.section_id);
      
      // Show sections created by user, "All Users" section, or sections with global apps
      const visibleSections = allSections.filter(s => 
        s.created_by === user.email || 
        s.name === 'All Users' || 
        globalAppSectionIds.includes(s.id)
      );

      // Get user's custom section ordering
      const userSectionPrefs = await base44.entities.UserSectionPreference.filter({ user_email: user.email });
      
      // Apply custom ordering if exists
      return visibleSections.map(section => {
        const pref = userSectionPrefs.find(p => p.section_id === section.id);
        return {
          ...section,
          displayOrder: pref ? pref.custom_order : section.order
        };
      }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    },
    enabled: !!user,
  });

  const { data: apps = [] } = useQuery({
    queryKey: ['apps', user?.email, 'hiddenApps'],
    queryFn: async () => {
      if (!user) return [];
      const allApps = await base44.entities.App.list('order');
      const userHiddenApps = await base44.entities.HiddenApp.filter({ user_email: user.email });
      const hiddenAppIds = userHiddenApps.map(h => h.app_id);
      
      return allApps.filter(app => 
        (app.created_by === user.email || app.is_global === true) && 
        !hiddenAppIds.includes(app.id)
      );
    },
    enabled: !!user,
  });

  const { data: preferences = [] } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: () => user ? base44.entities.UserAppPreference.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: hiddenApps = [] } = useQuery({
    queryKey: ['hiddenApps', user?.email],
    queryFn: () => user ? base44.entities.HiddenApp.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const createAppMutation = useMutation({
    mutationFn: async (appData) => {
      // Set order to be last
      const maxOrder = apps.reduce((max, app) => Math.max(max, app.order || 0), 0);
      return base44.entities.App.create({ 
        ...appData, 
        order: maxOrder + 1 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['apps']);
      queryClient.invalidateQueries(['sections']);
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: (appId) => base44.entities.App.delete(appId),
    onSuccess: () => queryClient.invalidateQueries(['apps']),
  });

  const hideAppMutation = useMutation({
    mutationFn: async (appId) => {
      const existing = hiddenApps.find(h => h.app_id === appId);
      if (existing) {
        await base44.entities.HiddenApp.delete(existing.id);
      } else {
        await base44.entities.HiddenApp.create({
          user_email: user.email,
          app_id: appId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['apps']);
      queryClient.invalidateQueries(['hiddenApps']);
    },
  });

  const updateAppMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.App.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['apps']);
      queryClient.invalidateQueries(['sections']);
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: (sectionData) => base44.entities.Section.create(sectionData),
    onSuccess: () => queryClient.invalidateQueries(['sections']),
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Section.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['sections']),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId) => base44.entities.Section.delete(sectionId),
    onSuccess: () => queryClient.invalidateQueries(['sections']),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (appId) => {
      if (!user) return;
      const existing = preferences.find(p => p.app_id === appId);
      if (existing) {
        await base44.entities.UserAppPreference.update(existing.id, {
          is_favorited: !existing.is_favorited
        });
      } else {
        await base44.entities.UserAppPreference.create({
          user_email: user.email,
          app_id: appId,
          is_favorited: true,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['preferences']),
  });

  const favorites = preferences.filter(p => p.is_favorited).map(p => p.app_id);
  const favoritedApps = apps.filter(app => favorites.includes(app.id));

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleToggleAdmin = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      setShowAdminPanel(false);
    } else {
      // Only require password for owner accounts
      if (isOwner) {
        setShowPasswordPrompt(true);
      } else {
        setIsAdminMode(true);
      }
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleGradientChange = async (gradientId) => {
    setSelectedGradient(gradientId);
    await base44.auth.updateMe({ selectedGradient: gradientId });
  };

  const isOwner = user?.email === 'info@pilatesinpinkstudio.com';

  const handleAdminSuccess = () => {
    setIsAdminMode(true);
    setShowPasswordPrompt(false);
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (e, appId) => {
    setDraggingAppId(appId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingAppId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, sectionId) => {
    e.preventDefault();
  };

  const handleEditApp = (app) => {
    setEditingApp(app);
    setShowEditModal(true);
  };

  const handleReorderApps = async (sourceIndex, destinationIndex) => {
    // Reorder locally
    const reorderedApps = Array.from(apps);
    const [removed] = reorderedApps.splice(sourceIndex, 1);
    reorderedApps.splice(destinationIndex, 0, removed);
    
    // Update order values
    const updatedApps = reorderedApps.map((app, index) => ({
      ...app,
      order: index + 1
    }));
    
    // Update cache optimistically
    queryClient.setQueryData(['apps'], updatedApps);
    
    // Update all apps with new order
    await Promise.all(
      updatedApps.map(app =>
        base44.entities.App.update(app.id, { order: app.order })
      )
    );
  };

  const handleReorderSections = async (sourceIndex, destinationIndex) => {
    const reorderedSections = Array.from(sections);
    const [removed] = reorderedSections.splice(sourceIndex, 1);
    reorderedSections.splice(destinationIndex, 0, removed);
    
    // Update order values
    const updatedSections = reorderedSections.map((section, index) => ({
      ...section,
      displayOrder: index + 1
    }));
    
    // Update cache optimistically for immediate UI update
    queryClient.setQueryData(['sections', user?.email], updatedSections);
    
    // Save user's custom section order
    await Promise.all(
      updatedSections.map(async (section) => {
        // Check if preference already exists
        const existing = await base44.entities.UserSectionPreference.filter({
          user_email: user.email,
          section_id: section.id
        });
        
        if (existing.length > 0) {
          await base44.entities.UserSectionPreference.update(existing[0].id, {
            custom_order: section.displayOrder
          });
        } else {
          await base44.entities.UserSectionPreference.create({
            user_email: user.email,
            section_id: section.id,
            custom_order: section.displayOrder
          });
        }
      })
    );
    
    // Invalidate to ensure consistency
    queryClient.invalidateQueries(['sections']);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fbe0e2] via-[#f7b1bd] to-[#fbe0e2] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f1889b]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f7b1bd]/20 rounded-full blur-3xl" />
        <UserSelection onClose={() => {}} />
      </div>
    );
  }

  const gradientClass =
    selectedGradient === 'blue' ? 'from-[#e0f2fe] via-[#bae6fd] to-[#e0f2fe]' :
    selectedGradient === 'purple' ? 'from-[#f3e8ff] via-[#ddd6fe] to-[#f3e8ff]' :
    selectedGradient === 'green' ? 'from-[#dcfce7] via-[#bbf7d0] to-[#dcfce7]' :
    selectedGradient === 'orange' ? 'from-[#fed7aa] via-[#fdba74] to-[#fed7aa]' :
    selectedGradient === 'dark' ? 'from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]' :
    'from-[#fbe0e2] via-[#f7b1bd] to-[#fbe0e2]';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientClass} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f1889b]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f7b1bd]/20 rounded-full blur-3xl" />

      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden sticky top-0 z-30 px-4 pt-4 pb-2 bg-white/60 backdrop-blur-xl border-b border-white/40">
        <div className="flex items-center gap-2">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/ad4ccf659_PiPHub.png"
            alt="PiP Hub"
            className="w-9 h-9 rounded-xl shadow"
          />
          <h1 className="text-lg font-bold text-gray-800 flex-1">{user?.full_name?.split(' ')[0] || 'App'} Hub</h1>
          {/* Add Apps icon */}
          <button
            onClick={() => setShowBrowseApps(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/70 border border-gray-200 shadow-sm"
            title="Add Apps"
          >
            <Sparkles className="w-4 h-4 text-[#f1889b]" />
          </button>
          {/* Grid view toggle */}
          <button
            onClick={() => setViewMode('grid')}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border shadow-sm transition-colors ${viewMode === 'grid' ? 'bg-[#f1889b]/10 border-[#f1889b]/40' : 'bg-white/70 border-gray-200'}`}
            title="Grid view"
          >
            <Grid3X3 className={`w-4 h-4 ${viewMode === 'grid' ? 'text-[#f1889b]' : 'text-gray-600'}`} />
          </button>
          {/* List view toggle */}
          <button
            onClick={() => setViewMode('list')}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border shadow-sm transition-colors ${viewMode === 'list' ? 'bg-[#f1889b]/10 border-[#f1889b]/40' : 'bg-white/70 border-gray-200'}`}
            title="List view"
          >
            <List className={`w-4 h-4 ${viewMode === 'list' ? 'text-[#f1889b]' : 'text-gray-600'}`} />
          </button>
        </div>
        {/* Mobile search - shown when search tab active */}
        {showMobileSearch && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="pl-10 w-full bg-white/80 border-gray-200 rounded-xl h-9 text-sm"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* ── DESKTOP HEADER ── */}
      <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-0 hidden md:block">
        <div className="flex md:items-center md:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/ad4ccf659_PiPHub.png"
              alt="PiP Hub"
              className="w-16 h-16 rounded-2xl shadow-lg"
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-800 tracking-tight">{user?.full_name?.split(' ')[0] || 'App'} Hub</h1>
              <p className="text-gray-600 text-sm mt-1">Your workspace at a glance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps..."
                className="pl-10 w-64 backdrop-blur-xl bg-white/60 border-white/80"
              />
            </div>
            {/* View toggle */}
            <Button
              onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              variant="outline"
              size="icon"
              className="rounded-xl border-gray-300"
              title={viewMode === 'grid' ? 'List view' : 'Grid view'}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
            <Button onClick={() => setShowBrowseApps(true)} variant="outline" className="rounded-xl border-gray-300 px-4">
              <Sparkles className="w-4 h-4 mr-2" /> Add Apps
            </Button>
            <Button onClick={() => setShowCustomizePanel(true)} variant="outline" className="rounded-xl border-gray-300 px-4">
              <LayoutGrid className="w-4 h-4 mr-2" /> Customize
            </Button>
            <div className="relative group">
              <Button variant="outline" className="rounded-xl border-gray-300 px-4">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center text-xs font-semibold text-white mr-2">
                  {getInitials(user.full_name)}
                </div>
                Menu
              </Button>
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40">
                <button onClick={() => setShowUserSelection(true)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-200">Switch User</button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 pb-28 md:pb-12">

        {/* Favorites */}
        {favoritedApps.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#f1889b]" />
              <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Favorites</h2>
            </div>
            {viewMode === 'list' ? (
              <div className="rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm">
                {favoritedApps.map((app, i) => (
                  <AppListRow
                    key={app.id}
                    app={app}
                    isFavorited={true}
                    onToggleFavorite={() => toggleFavoriteMutation.mutate(app.id)}
                    onOpenApp={setViewingApp}
                    isLast={i === favoritedApps.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {favoritedApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isFavorited={true}
                    onToggleFavorite={() => toggleFavoriteMutation.mutate(app.id)}
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingAppId === app.id}
                    onOpenApp={setViewingApp}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sections */}
        {sections.map((section) => {
          const sectionApps = filteredApps.filter(app => app.section_id === section.id);
          if (sectionApps.length === 0) return null;
          return (
            <SectionGroup
              key={section.id}
              section={section}
              apps={sectionApps}
              favorites={favorites}
              onToggleFavorite={(appId) => toggleFavoriteMutation.mutate(appId)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              draggingAppId={draggingAppId}
              onOpenApp={setViewingApp}
              viewMode={viewMode}
            />
          );
        })}

        {/* Footer – desktop only */}
        <footer className="hidden md:flex text-center text-white/60 text-sm py-6 flex-col items-center gap-3 mt-12">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/4517e6743_617f126bf_Pilatesinpinklogojusticon1.png"
            alt="Pilates in Pink"
            className="h-16 rounded-lg"
          />
          © 2026 Pilates in Pink™ • All rights reserved
        </footer>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR (iOS style) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-t border-gray-200/60">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          <button
            onClick={() => setShowBrowseApps(true)}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-[#f1889b]"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Add Apps</span>
          </button>
          <button
            onClick={() => setShowCustomizePanel(true)}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-[#f1889b]"
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-medium">Customize</span>
          </button>
          <button
            onClick={() => setShowUserSelection(true)}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-[#f1889b]"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center text-[9px] font-bold text-white">
              {getInitials(user.full_name)}
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-gray-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddAppModal
          sections={sections}
          onClose={() => setShowAddModal(false)}
          onSave={(appData) => createAppMutation.mutate(appData)}
        />
      )}

      {showPasswordPrompt && (
        <PasswordPrompt
          onClose={() => setShowPasswordPrompt(false)}
          onSuccess={handleAdminSuccess}
        />
      )}

      {showAdminPanel && (
        <AdminPanel
          apps={apps}
          sections={sections}
          onDeleteApp={(appId) => deleteAppMutation.mutate(appId)}
          onEditApp={handleEditApp}
          onReorderApps={handleReorderApps}
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {showEditModal && editingApp && (
        <EditAppModal
          app={editingApp}
          sections={sections}
          onClose={() => {
            setShowEditModal(false);
            setEditingApp(null);
          }}
          onSave={(appData) => {
            updateAppMutation.mutate({ id: editingApp.id, data: appData });
            setShowEditModal(false);
            setEditingApp(null);
          }}
        />
      )}

      {showSectionPanel && (
        <SectionManagementPanel
          sections={sections}
          onCreateSection={(data) => createSectionMutation.mutate(data)}
          onUpdateSection={(id, data) => updateSectionMutation.mutate({ id, data })}
          onDeleteSection={(id) => deleteSectionMutation.mutate(id)}
          onReorderSections={handleReorderSections}
          onClose={() => setShowSectionPanel(false)}
        />
      )}

      {viewingApp && (
        <AppViewerModal
          app={viewingApp}
          onClose={() => setViewingApp(null)}
        />
      )}

      {showCustomizePanel && (
        <CustomizePanel
          apps={apps}
          sections={sections}
          selectedGradient={selectedGradient}
          onGradientChange={handleGradientChange}
          onReorderApps={handleReorderApps}
          onReorderSections={handleReorderSections}
          onDeleteApp={(appId) => deleteAppMutation.mutate(appId)}
          onHideApp={(appId) => hideAppMutation.mutate(appId)}
          onEditApp={handleEditApp}
          onManageSections={() => {
            setShowCustomizePanel(false);
            setShowSectionPanel(true);
          }}
          onClose={() => setShowCustomizePanel(false)}
          isOwner={isOwner}
          hiddenApps={hiddenApps}
        />
      )}

      {showUserSelection && (
        <UserSelection
          onClose={() => setShowUserSelection(false)}
          currentGradient={selectedGradient}
        />
      )}

      {showBrowseApps && (
        <BrowseAppsModal
          sections={sections}
          userApps={apps}
          hiddenApps={hiddenApps}
          onClose={() => setShowBrowseApps(false)}
          onAddApp={(appData) => createAppMutation.mutate(appData)}
          onUnhideApp={(appId) => hideAppMutation.mutate(appId)}
        />
      )}
      </div>
      );
      }