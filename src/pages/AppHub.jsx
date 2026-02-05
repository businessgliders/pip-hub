import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Plus, Shield, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SectionGroup from '../components/hub/SectionGroup';
import AddAppModal from '../components/hub/AddAppModal';
import AdminPanel from '../components/hub/AdminPanel';
import PasswordPrompt from '../components/hub/PasswordPrompt';

export default function AppHub() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [draggingAppId, setDraggingAppId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => base44.entities.Section.list('order'),
  });

  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => base44.entities.App.list(),
  });

  const { data: preferences = [] } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: () => user ? base44.entities.UserAppPreference.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const createAppMutation = useMutation({
    mutationFn: (appData) => base44.entities.App.create(appData),
    onSuccess: () => queryClient.invalidateQueries(['apps']),
  });

  const deleteAppMutation = useMutation({
    mutationFn: (appId) => base44.entities.App.delete(appId),
    onSuccess: () => queryClient.invalidateQueries(['apps']),
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

  const handleToggleAdmin = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      setShowAdminPanel(false);
    } else {
      setShowPasswordPrompt(true);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fbe0e2] via-[#f6eee7] to-[#fbe0e2] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f1889b]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f7b1bd]/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/617f126bf_Pilatesinpinklogojusticon1.png"
              alt="Pilates in Pink"
              className="w-16 h-16 rounded-2xl shadow-lg"
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-800 tracking-tight">App Hub</h1>
              <p className="text-gray-600 text-sm mt-1">Your workspace at a glance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps..."
                className="pl-10 w-64 backdrop-blur-xl bg-white/60 border-white/80"
              />
            </div>

            {isAdminMode && (
              <>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add App
                </Button>
                <Button
                  onClick={() => setShowAdminPanel(true)}
                  variant="outline"
                  className="rounded-xl border-[#f1889b]/30"
                >
                  Manage Apps
                </Button>
              </>
            )}

            <Button
              onClick={handleToggleAdmin}
              variant={isAdminMode ? "default" : "outline"}
              className={
                isAdminMode
                  ? "bg-gradient-to-r from-[#b67651] to-[#b67651]/80 hover:from-[#b67651]/90 hover:to-[#b67651]/70 text-white rounded-xl"
                  : "rounded-xl border-gray-300"
              }
            >
              <Shield className="w-4 h-4 mr-2" />
              {isAdminMode ? 'Exit Admin' : 'Admin'}
            </Button>
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
              {favoritedApps.map((app) => {
                const AppCard = require('../components/hub/AppCard').default;
                return (
                  <AppCard
                    key={app.id}
                    app={app}
                    isFavorited={true}
                    onToggleFavorite={() => toggleFavoriteMutation.mutate(app.id)}
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingAppId === app.id}
                  />
                );
              })}
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
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
}