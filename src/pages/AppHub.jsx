import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Plus, Shield, Search, Sparkles, LayoutGrid, List, Grid3X3, LogOut, Pencil, Check, X } from 'lucide-react';
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
import FavoritesSection from '../components/hub/FavoritesSection.jsx';
import MacDock from '../components/hub/MacDock.jsx';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import WidgetsContainer from '../components/hub/WidgetsContainer';
import LaunchpadView from '../components/hub/launchpad/LaunchpadView';
import MobileMoreSheet from '../components/hub/MobileMoreSheet';

// Track desktop breakpoint (lg: 1024px). On tablet/mobile, favorites are surfaced
// separately (FavoritesSection / loose launchpad icons), so they're hidden from
// their folders/sections to avoid duplication.
function useIsLgUp() {
  const [isLg, setIsLg] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  useEffect(() => {
    const onResize = () => setIsLg(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isLg;
}

export default function AppHub() {
  const isLgUp = useIsLgUp();
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
        const [customWallpaper, setCustomWallpaper] = useState(null);
        const [showUserSelection, setShowUserSelection] = useState(false);
        const [showBrowseApps, setShowBrowseApps] = useState(false);
  const [viewMode, setViewMode] = useState(window.innerWidth >= 1024 ? 'launchpad' : 'list'); // 'list' | 'launchpad'
  const [collapsedSections, setCollapsedSections] = useState([]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
        const queryClient = useQueryClient();

  // When AppHub is mounted inside SplitView (either via direct render or via ?splitview=1 in an iframe),
  // clicking an app should open in the parent's right panel instead of the standard AppViewerModal.
  const isInSplitView = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/splitview') ||
    new URLSearchParams(window.location.search).get('splitview') === '1'
  );
  const openApp = (app) => {
    if (!app) return;
    if (isInSplitView && app.url) {
      // Same-window dispatch (when rendered directly inside SplitView)
      window.dispatchEvent(new CustomEvent('splitview:open-url', { detail: { url: app.url } }));
      // Parent-window dispatch (when rendered inside an iframe by SplitView)
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'splitview:open-url', url: app.url }, '*');
      }
      return;
    }
    setViewingApp(app);
  };

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.selectedGradient) {
        setSelectedGradient(u.selectedGradient);
      }
      if (u?.customWallpaper) {
        setCustomWallpaper(u.customWallpaper);
      }
      if (u?.viewMode) {
        // Migrate old 'grid' preference to 'launchpad'
        setViewMode(u.viewMode === 'grid' ? 'launchpad' : u.viewMode);
      }
      if (u?.collapsedSections) {
        setCollapsedSections(u.collapsedSections);
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

  const { data: userWidgets = [] } = useQuery({
    queryKey: ['userWidgets', user?.email],
    queryFn: () => user ? base44.entities.UserWidget.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const createWidgetMutation = useMutation({
    mutationFn: (widgetData) => base44.entities.UserWidget.create({ ...widgetData, order: userWidgets.length }),
    onSuccess: () => queryClient.invalidateQueries(['userWidgets']),
  });

  const updateWidgetMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserWidget.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['userWidgets']),
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: (id) => base44.entities.UserWidget.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['userWidgets']),
  });

  const handleReorderWidgets = async (sourceIndex, destinationIndex, gridWidgets) => {
    const reordered = Array.from(gridWidgets);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, removed);
    
    const updatedWidgets = userWidgets.map(w => {
      const newOrder = reordered.findIndex(rw => rw.id === w.id);
      if (newOrder !== -1) {
        return { ...w, order: newOrder };
      }
      return w;
    });
    queryClient.setQueryData(['userWidgets', user?.email], updatedWidgets);
    
    await Promise.all(
      reordered.map((w, idx) => base44.entities.UserWidget.update(w.id, { order: idx }))
    );
  };

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

  const favorites = preferences
    .filter(p => p.is_favorited)
    .sort((a, b) => (a.custom_order ?? 0) - (b.custom_order ?? 0))
    .map(p => p.app_id);

  // Sort favorited apps by custom_order if set
  const favoritedApps = apps
    .filter(app => favorites.includes(app.id))
    .sort((a, b) => {
      const prefA = preferences.find(p => p.app_id === a.id);
      const prefB = preferences.find(p => p.app_id === b.id);
      return (prefA?.custom_order ?? 0) - (prefB?.custom_order ?? 0);
    });

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

  const handleWallpaperChange = async (wallpaperUrl) => {
    setCustomWallpaper(wallpaperUrl);
    await base44.auth.updateMe({ customWallpaper: wallpaperUrl });
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

  const handleReorderFavorites = async (sourceIndex, destinationIndex) => {
    const reordered = Array.from(favoritedApps);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, removed);
    // Optimistically update preferences cache
    const updatedPrefs = preferences.map(p => {
      const idx = reordered.findIndex(a => a.id === p.app_id);
      if (idx !== -1) return { ...p, custom_order: idx + 1 };
      return p;
    });
    queryClient.setQueryData(['preferences', user?.email], updatedPrefs);
    await Promise.all(
      reordered.map((app, idx) => {
        const pref = preferences.find(p => p.app_id === app.id);
        if (pref) return base44.entities.UserAppPreference.update(pref.id, { custom_order: idx + 1 });
        return Promise.resolve();
      })
    );
  };

  const handleRenameSection = async (sectionId, newName) => {
    updateSectionMutation.mutate({ id: sectionId, data: { name: newName } });
  };

  const handleReorderAppsInSection = async (sectionId, sourceIndex, destinationIndex) => {
    const sectionApps = apps.filter(a => a.section_id === sectionId);
    const otherApps = apps.filter(a => a.section_id !== sectionId);
    const reordered = Array.from(sectionApps);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, removed);
    const updated = reordered.map((app, idx) => ({ ...app, order: idx + 1 }));
    queryClient.setQueryData(['apps', user?.email, 'hiddenApps'], [...otherApps, ...updated]);
    await Promise.all(updated.map(app => base44.entities.App.update(app.id, { order: app.order })));
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

  const handlePageDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'FOLDER_APP') {
      // droppableId is `folder-<sectionId>` — reorder apps inside that folder.
      const sectionId = source.droppableId.replace(/^folder-/, '');
      handleReorderAppsInSection(sectionId, source.index, destination.index);
      return;
    }

    if (type === 'LAUNCHPAD') {
      // Rebuild the items list as LaunchpadView builds it. On tablet/mobile (no MacDock),
      // favorites appear loose first; on desktop they live in the dock and are not in the list.
      const isDesktopVp = typeof window !== 'undefined' && window.innerWidth >= 1024;
      const favApps = isDesktopVp
        ? []
        : favorites.map((id) => apps.find((a) => a.id === id)).filter(Boolean);
      const folderSections = sections.filter((s) => {
        const secApps = apps.filter((a) => a.section_id === s.id && (isDesktopVp || !favorites.includes(a.id)));
        return secApps.length > 0;
      });
      const items = [
        ...favApps.map((a) => ({ kind: 'app', app: a })),
        ...folderSections.map((s) => ({ kind: 'folder', section: s })),
      ];

      const draggedItem = items[source.index];
      if (!draggedItem) return;

      // Move the item locally to compute the new SAME-KIND index. This lets users drop
      // anywhere in any row — between apps, between folders, or across the boundary —
      // and we map it back to a valid in-kind reorder.
      const reordered = Array.from(items);
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);

      if (draggedItem.kind === 'app') {
        const fromAppIdx = items.filter((it, i) => it.kind === 'app' && i < source.index).length;
        const toAppIdx = reordered.filter((it, i) => it.kind === 'app' && i < destination.index).length;
        if (fromAppIdx === toAppIdx) return;
        // Reordering apps in the launchpad = reordering favorites (only favorites appear as loose apps).
        handleReorderFavorites(fromAppIdx, toAppIdx);
      } else {
        const fromFolderIdx = items.filter((it, i) => it.kind === 'folder' && i < source.index).length;
        const toFolderIdx = reordered.filter((it, i) => it.kind === 'folder' && i < destination.index).length;
        if (fromFolderIdx === toFolderIdx) return;
        const srcSec = folderSections[fromFolderIdx];
        const dstSec = folderSections[toFolderIdx];
        if (!srcSec || !dstSec) return;
        const srcIdx = sections.findIndex((s) => s.id === srcSec.id);
        const dstIdx = sections.findIndex((s) => s.id === dstSec.id);
        if (srcIdx === -1 || dstIdx === -1 || srcIdx === dstIdx) return;
        handleReorderSections(srcIdx, dstIdx);
      }
      return;
    }

    if (type === 'SECTION') {
      const visibleSections = sections.filter(s => filteredApps.some(a => a.section_id === s.id));
      const draggedSection = visibleSections[source.index];
      const targetSection = visibleSections[destination.index];
      if (draggedSection && targetSection) {
        const sourceIndex = sections.findIndex(s => s.id === draggedSection.id);
        const destinationIndex = sections.findIndex(s => s.id === targetSection.id);
        handleReorderSections(sourceIndex, destinationIndex);
      }
    } else if (type === 'FAVORITE') {
      handleReorderFavorites(source.index, destination.index);
    } else if (type === 'APP') {
      if (source.droppableId === destination.droppableId) {
        handleReorderAppsInSection(source.droppableId, source.index, destination.index);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fbe0e2] via-[#f7b1bd] to-[#fbe0e2] relative overflow-clip">
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

  // Unsplash wallpapers matched to each theme (used as fallback when no custom wallpaper)
  const themeWallpaperUrl =
    selectedGradient === 'blue'   ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80' :
    selectedGradient === 'purple' ? 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80' :
    selectedGradient === 'green'  ? 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' :
    selectedGradient === 'orange' ? 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1920&q=80' :
    selectedGradient === 'dark'   ? 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80' :
    'https://images.unsplash.com/photo-1490750967868-88df5691cc8d?w=1920&q=80';

  const wallpaperUrl = customWallpaper || themeWallpaperUrl;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientClass} relative overflow-clip`}>
      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${wallpaperUrl})`, opacity: customWallpaper ? 0.55 : 0.22 }}
      />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f1889b]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f7b1bd]/20 rounded-full blur-3xl" />

      {/* ── MOBILE / TABLET TOP BAR ── */}
      <div className="lg:hidden sticky top-0 z-30 px-4 pt-4 pb-2 bg-white/60 backdrop-blur-xl border-b border-white/40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowMobileSearch(false); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/ad4ccf659_PiPHub.png"
              alt="PiP Hub"
              className="w-9 h-9 rounded-xl shadow flex-shrink-0"
            />
            <h1 className="text-lg font-bold text-gray-800 truncate">{(user?.email === 'info@pilatesinpinkstudio.com' ? 'Front Desk' : (user?.full_name?.split(' ')[0] || 'App'))}'s Apps</h1>
          </button>
          {/* Search */}
          <button
            onClick={() => setShowMobileSearch(s => !s)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border shadow-sm transition-colors ${showMobileSearch ? 'bg-[#f1889b]/10 border-[#f1889b]/40' : 'bg-white/70 border-gray-200'}`}
            title="Search"
          >
            <Search className={`w-4 h-4 ${showMobileSearch ? 'text-[#f1889b]' : 'text-gray-600'}`} />
          </button>

          {/* Edit mode toggle */}
          <button
            onClick={() => setIsEditMode(e => !e)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border shadow-sm transition-colors ${isEditMode ? 'bg-[#f1889b]/10 border-[#f1889b]/40' : 'bg-white/70 border-gray-200'}`}
            title={isEditMode ? 'Done editing' : 'Edit'}
          >
            {isEditMode ? <Check className="w-4 h-4 text-[#f1889b]" /> : <Pencil className="w-4 h-4 text-gray-600" />}
          </button>
        </div>
        {/* Mobile search - shown when search tab active or query present */}
        {(showMobileSearch || searchQuery) && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="pl-10 pr-9 w-full bg-white/80 border-gray-200 rounded-xl h-9"
              style={{ fontSize: '16px' }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── DESKTOP HEADER ── */}
      <div className="sticky top-0 z-30 hidden lg:block">
      <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-0">
        <div className="flex md:items-center md:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/ad4ccf659_PiPHub.png"
              alt="PiP Hub"
              className="w-16 h-16 rounded-2xl shadow-lg"
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-800 tracking-tight">{(user?.email === 'info@pilatesinpinkstudio.com' ? 'Front Desk' : (user?.full_name?.split(' ')[0] || 'App'))}'s Apps</h1>
              <p className="text-gray-600 text-sm mt-1">Your workspace at a glance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps..."
                className={`pl-10 ${searchQuery ? 'pr-9' : ''} w-64 backdrop-blur-xl bg-white/60 hover:bg-white/80 focus:bg-white/80 border-transparent hover:border-white/80 focus:border-white/80 transition-colors duration-200 shadow-sm`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors z-10"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>
            {/* View toggle - combined button */}
            <div className="flex rounded-xl border border-gray-300 overflow-hidden">
              <button
                onClick={async () => {
                  setViewMode('list');
                  if (user) await base44.auth.updateMe({ viewMode: 'list' });
                }}
                className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  setViewMode('launchpad');
                  if (user) await base44.auth.updateMe({ viewMode: 'launchpad' });
                }}
                className={`px-3 py-2 border-l border-gray-300 transition-colors ${viewMode === 'launchpad' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                title="Launchpad view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => setShowBrowseApps(true)} variant="outline" size="icon" className="rounded-xl border-gray-300" title="Add Apps">
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsEditMode(e => !e)}
              variant={isEditMode ? 'default' : 'outline'}
              size="icon"
              className={`rounded-xl ${isEditMode ? 'bg-[#f1889b] hover:bg-[#f1889b]/90 text-white border-[#f1889b]' : 'border-gray-300'}`}
              title={isEditMode ? 'Done editing' : 'Edit'}
            >
              {isEditMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </Button>
            <div className="relative group">
              <Button variant="outline" size="icon" className="rounded-xl border-gray-300">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center text-xs font-semibold text-white">
                  {getInitials(user.full_name)}
                </div>
              </Button>
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40">
                <button onClick={() => setShowCustomizePanel(true)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-200">Customize</button>
                <button onClick={() => setShowUserSelection(true)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-200">Switch User</button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <DragDropContext onDragEnd={handlePageDragEnd}>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-6 pb-28 lg:pb-12">

          {/* Widgets */}
          <div className="sticky top-[80px] lg:top-[148px] z-10">
            <WidgetsContainer
              widgets={userWidgets}
              isEditMode={isEditMode}
              onUpdateWidget={(id, data) => updateWidgetMutation.mutate({ id, data })}
              onDeleteWidget={(id) => deleteWidgetMutation.mutate(id)}
              onReorderWidgets={handleReorderWidgets}
            />
          </div>

          <div className="relative z-20 -mt-2 lg:mt-8 pt-4">
            <div 
              className="absolute inset-x-[-50vw] top-[-120px] bottom-[-50vh] bg-white/30 backdrop-blur-xl pointer-events-none -z-10" 
              style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 120px)', maskImage: 'linear-gradient(to bottom, transparent, black 120px)' }} 
            />
            
          {/* Favorites — hidden in launchpad view (favorites already shown as loose icons there) */}
          {viewMode !== 'launchpad' && (() => {
            const filteredFavorites = favoritedApps.filter(app =>
              app.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filteredFavorites.length === 0) return null;
            return (
            <div className="mb-6 lg:hidden">
              <FavoritesSection
                favoritedApps={filteredFavorites}
                viewMode={viewMode}
                isEditMode={isEditMode}
                draggingAppId={draggingAppId}
                onToggleFavorite={(appId) => toggleFavoriteMutation.mutate(appId)}
                onOpenApp={openApp}
                onEditApp={handleEditApp}
                onDeleteApp={(appId) => deleteAppMutation.mutate(appId)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onReorderFavorites={handleReorderFavorites}
                isCollapsed={!searchQuery && collapsedSections.includes('__favorites__')}
                onToggleCollapse={async () => {
                  const key = '__favorites__';
                  const next = collapsedSections.includes(key)
                    ? collapsedSections.filter(id => id !== key)
                    : [...collapsedSections, key];
                  setCollapsedSections(next);
                  if (user) await base44.auth.updateMe({ collapsedSections: next });
                }}
              />
            </div>
            );
          })()}

          {/* Sections — replaced by Launchpad when viewMode === 'launchpad' */}
          {viewMode === 'launchpad' ? (
            <LaunchpadView
              apps={filteredApps}
              sections={sections}
              favorites={favorites}
              searchQuery={searchQuery}
              isEditMode={isEditMode}
              onOpenApp={openApp}
              onEditApp={handleEditApp}
              onDeleteApp={(appId) => deleteAppMutation.mutate(appId)}
              onHideApp={(appId) => hideAppMutation.mutate(appId)}
              onRenameSection={handleRenameSection}
              onToggleFavorite={(appId) => toggleFavoriteMutation.mutate(appId)}
            />
          ) : (() => {
            // On tablet/mobile, favorited apps appear in the dedicated Favorites section
            // above, so hide them from their parent folders/sections to avoid duplicates.
            // Folders still respect the user-defined sections (Customize menu) when the
            // app is unfavorited.
            const sectionAppsFor = (sectionId) =>
              filteredApps.filter(app =>
                app.section_id === sectionId && (isLgUp || !favorites.includes(app.id))
              );
            const visibleSections = sections.filter(section =>
              sectionAppsFor(section.id).length > 0
            );

            if (!isEditMode) {
              return visibleSections.map((section, index) => (
                <SectionGroup
                  key={section.id}
                  section={section}
                  sectionIndex={index}
                  totalSections={visibleSections.length}
                  apps={sectionAppsFor(section.id)}
                  favorites={favorites}
                  isCollapsed={!searchQuery && collapsedSections.includes(section.id)}
                  onToggleCollapse={async () => {
                    const next = collapsedSections.includes(section.id) 
                      ? collapsedSections.filter(id => id !== section.id)
                      : [...collapsedSections, section.id];
                    setCollapsedSections(next);
                    if (user) await base44.auth.updateMe({ collapsedSections: next });
                  }}
                  onToggleFavorite={(appId) => toggleFavoriteMutation.mutate(appId)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  draggingAppId={draggingAppId}
                  onOpenApp={openApp}
                  viewMode={viewMode}
                  isEditMode={false}
                  onEditApp={handleEditApp}
                  onDeleteApp={(appId) => deleteAppMutation.mutate(appId)}
                  onHideApp={(appId) => hideAppMutation.mutate(appId)}
                  onReorderAppsInSection={handleReorderAppsInSection}
                  onRenameSection={handleRenameSection}
                />
              ));
            }

            return (
              <Droppable droppableId="sections" type="SECTION">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {visibleSections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={snapshot.isDragging ? 'opacity-90 z-50 relative bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-[#f1889b]/50 mb-4' : ''}
                          >
                            <SectionGroup
                              dragHandleProps={provided.dragHandleProps}
                              key={section.id}
                              section={section}
                              sectionIndex={index}
                              totalSections={visibleSections.length}
                              apps={sectionAppsFor(section.id)}
                              favorites={favorites}
                              isCollapsed={collapsedSections.includes(section.id)}
                              onToggleCollapse={async () => {
                                const next = collapsedSections.includes(section.id) 
                                  ? collapsedSections.filter(id => id !== section.id)
                                  : [...collapsedSections, section.id];
                                setCollapsedSections(next);
                                if (user) await base44.auth.updateMe({ collapsedSections: next });
                              }}
                              onToggleFavorite={(appId) => toggleFavoriteMutation.mutate(appId)}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                              draggingAppId={draggingAppId}
                              onOpenApp={openApp}
                              viewMode={viewMode}
                              isEditMode={true}
                              onEditApp={handleEditApp}
                              onDeleteApp={(appId) => deleteAppMutation.mutate(appId)}
                              onHideApp={(appId) => hideAppMutation.mutate(appId)}
                              onReorderAppsInSection={handleReorderAppsInSection}
                              onRenameSection={handleRenameSection}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })()}
          </div>

          {/* Footer – desktop only */}
          <footer className="hidden lg:flex text-center text-white/60 text-sm py-6 flex-col items-center gap-3 mt-12">
            © 2026 Pilates in Pink™ • All rights reserved
          </footer>
        </div>
      </DragDropContext>

      {/* ── macOS DOCK (desktop only) ── */}
      <MacDock
        favoritedApps={favoritedApps}
        onOpenApp={openApp}
        onReorderFavorites={handleReorderFavorites}
      />

      {/* ── MOBILE / TABLET BOTTOM TAB BAR (iOS style) ── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-t border-gray-200/60"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}
      >
        <div className="flex items-center justify-around px-1 pt-2 pb-2">
          {/* Home */}
          <button
            onClick={() => {
              const now = Date.now();
              if (now - (window.__homeTapTime || 0) < 350) {
                window.location.reload();
                return;
              }
              window.__homeTapTime = now;
              setShowMobileSearch(false);
              setSearchQuery('');
            }}
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-[#f1889b]"
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/ad4ccf659_PiPHub.png"
              alt="Home"
              className="w-5 h-5 rounded-md"
            />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          {/* Add Apps */}
          <button
            onClick={() => setShowBrowseApps(true)}
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-gray-500"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Add</span>
          </button>
          {/* More — user profile avatar */}
          <button
            onClick={() => setShowMoreSheet(true)}
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-gray-500"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center text-[10px] font-semibold text-white shadow-sm">
              {getInitials(user?.full_name)}
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE MORE SHEET ── */}
      {showMoreSheet && (
        <MobileMoreSheet
          user={user}
          onClose={() => setShowMoreSheet(false)}
          onCustomize={() => setShowCustomizePanel(true)}
          onSwitchUser={() => setShowUserSelection(true)}
          onLogout={handleLogout}
        />
      )}

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
          userWidgets={userWidgets}
          selectedGradient={selectedGradient}
          onGradientChange={handleGradientChange}
          customWallpaper={customWallpaper}
          onWallpaperChange={handleWallpaperChange}
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
          onDeleteWidget={(id) => deleteWidgetMutation.mutate(id)}
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
          userWidgets={userWidgets}
          onClose={() => setShowBrowseApps(false)}
          onAddApp={(appData) => createAppMutation.mutate(appData)}
          onUnhideApp={(appId) => hideAppMutation.mutate(appId)}
          onAddWidget={(type) => createWidgetMutation.mutate({ user_email: user.email, widget_type: type })}
        />
      )}
    </div>
  );
}