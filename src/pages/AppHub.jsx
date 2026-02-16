import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Plus, Shield, Search, Sparkles, LayoutGrid, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppCard from '../components/hub/AppCard';
import SectionGroup from '../components/hub/SectionGroup';
import AddAppModal from '../components/hub/AddAppModal';
import EditAppModal from '../components/hub/EditAppModal';
import AdminPanel from '../components/hub/AdminPanel';
import SectionManagementPanel from '../components/hub/SectionManagementPanel';
import AppViewerModal from '../components/hub/AppViewerModal';
import PasswordPrompt from '../components/hub/PasswordPrompt';
import CustomizePanel from '../components/hub/CustomizePanel';

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
        const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.selectedGradient) {
        setSelectedGradient(u.selectedGradient);
      }
    }).catch(() => setUser(null));
  }, []);

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => base44.entities.Section.list('order'),
  });

  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => base44.entities.App.list('order'),
  });

  const { data: preferences = [] } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: () => user ? base44.entities.UserAppPreference.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const createAppMutation = useMutation({
    mutationFn: async (appData) => {
      // Set order to be last
      const maxOrder = apps.reduce((max, app) => Math.max(max, app.order || 0), 0);
      return base44.entities.App.create({ ...appData, order: maxOrder + 1 });
    },
    onSuccess: () => queryClient.invalidateQueries(['apps']),
  });

  const deleteAppMutation = useMutation({
    mutationFn: (appId) => base44.entities.App.delete(appId),
    onSuccess: () => queryClient.invalidateQueries(['apps']),
  });

  const updateAppMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.App.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['apps']),
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
      setShowPasswordPrompt(true);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleGradientChange = async (gradientId) => {
    setSelectedGradient(gradientId);
    await base44.auth.updateMe({ selectedGradient: gradientId });
  };

  const isOwner = user?.email === 'owner@pilatesinpink.com';

  const handleAdminSuccess = () => {
    setIsAdminMode(true);
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
    // In a full implementation, you'd update the app's section here
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
      order: index + 1
    }));
    
    // Update cache optimistically
    queryClient.setQueryData(['sections'], updatedSections);
    
    // Update all sections with new order
    await Promise.all(
      updatedSections.map(section =>
        base44.entities.Section.update(section.id, { order: section.order })
      )
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      selectedGradient === 'blue' ? 'from-[#e0f2fe] via-[#bae6fd] to-[#e0f2fe]' :
      selectedGradient === 'purple' ? 'from-[#f3e8ff] via-[#ddd6fe] to-[#f3e8ff]' :
      selectedGradient === 'green' ? 'from-[#dcfce7] via-[#bbf7d0] to-[#dcfce7]' :
      selectedGradient === 'orange' ? 'from-[#fed7aa] via-[#fdba74] to-[#fed7aa]' :
      'from-[#fbe0e2] via-[#f7b1bd] to-[#fbe0e2]'
    } relative overflow-hidden`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f1889b]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f7b1bd]/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-4 mx-auto md:mx-0">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/617f126bf_Pilatesinpinklogojusticon1.png"
              alt="Pilates in Pink"
              className="w-16 h-16 rounded-2xl shadow-lg"
            />
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-800 tracking-tight">App Hub</h1>
              <p className="text-gray-600 text-sm mt-1">Your workspace at a glance</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-2">
            {/* Search - Expanded when admin mode is off, collapsible on mobile when admin mode is on */}
            {!isAdminMode ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search apps..."
                  className="pl-10 w-48 md:w-64 backdrop-blur-xl bg-white/60 border-white/80"
                />
              </div>
            ) : (
              <>
                {showSearch ? (
                  <div className="relative md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search apps..."
                      className="pl-10 w-48 md:w-64 backdrop-blur-xl bg-white/60 border-white/80"
                      autoFocus
                      onBlur={() => !searchQuery && setShowSearch(false)}
                    />
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowSearch(true)}
                    variant="outline"
                    size="icon"
                    className="md:hidden rounded-xl"
                    title="Search"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Desktop search - always visible */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search apps..."
                    className="pl-10 w-64 backdrop-blur-xl bg-white/60 border-white/80"
                  />
                </div>
              </>
            )}

            {isAdminMode && (
              <>
                <Button
                  onClick={() => setShowAddModal(true)}
                  size="icon"
                  className="md:w-auto md:px-4 bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white rounded-xl"
                  title="Add App"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline md:ml-2">Add App</span>
                </Button>
                <Button
                  onClick={() => setShowAdminPanel(true)}
                  variant="outline"
                  size="icon"
                  className="md:w-auto md:px-4 rounded-xl border-[#f1889b]/30"
                  title="Manage Apps"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden md:inline md:ml-2">Manage Apps</span>
                </Button>
                <Button
                  onClick={() => setShowSectionPanel(true)}
                  variant="outline"
                  size="icon"
                  className="md:w-auto md:px-4 rounded-xl border-[#f1889b]/30"
                  title="Manage Sections"
                >
                  <Ruler className="w-4 h-4" />
                  <span className="hidden md:inline md:ml-2">Manage Sections</span>
                </Button>
              </>
            )}

            {user && !isOwner ? (
              <Button
                onClick={() => setShowCustomizePanel(true)}
                variant="outline"
                size="icon"
                className="md:w-auto md:px-4 rounded-xl border-gray-300"
                title="Customize"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden md:inline md:ml-2">Customize</span>
              </Button>
            ) : (
              <Button
                onClick={handleToggleAdmin}
                variant={isAdminMode ? "default" : "outline"}
                size="icon"
                className={
                  isAdminMode
                    ? "md:w-auto md:px-4 bg-gradient-to-r from-[#b67651] to-[#b67651]/80 hover:from-[#b67651]/90 hover:to-[#b67651]/70 text-white rounded-xl"
                    : "md:w-auto md:px-4 rounded-xl border-gray-300"
                }
                title={isAdminMode ? 'Exit Admin' : 'Admin'}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden md:inline md:ml-2">{isAdminMode ? 'Exit Admin' : 'Admin'}</span>
              </Button>
            )}

            {user ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="icon"
                className="md:w-auto md:px-4 rounded-xl border-gray-300"
                title="Logout"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center text-xs font-semibold text-white">
                  {getInitials(user.full_name)}
                </div>
                <span className="hidden md:inline md:ml-2">Logout</span>
              </Button>
            ) : (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                variant="outline"
                size="icon"
                className="md:w-auto md:px-4 rounded-xl border-gray-300"
                title="Login"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden md:inline md:ml-2">Login</span>
              </Button>
            )}
            </div>
        </div>

        {/* Favorites Section */}
        {favoritedApps.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-[#f1889b]" />
              <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Favorites</h2>
            </div>
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
            />
          );
        })}
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
    </div>
  );
}