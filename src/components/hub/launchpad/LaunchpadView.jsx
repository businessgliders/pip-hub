import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import LaunchpadIcon from './LaunchpadIcon';
import { LaunchpadFolderTile, LaunchpadFolderExpanded } from './LaunchpadFolder';

// macOS Launchpad-style overlay: paginated grid, sections-as-folders, live search, Esc to close.
export default function LaunchpadView({
  apps,
  sections,
  favorites = [],
  wallpaperUrl,
  onOpenApp,
  onClose,
}) {
  const [search, setSearch] = useState('');
  const [openFolderId, setOpenFolderId] = useState(null);
  const [page, setPage] = useState(0);

  // Esc to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (openFolderId) setOpenFolderId(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openFolderId, onClose]);

  // Build the items list:
  // - When searching: a flat list of matching apps (no folders).
  // - Otherwise: favorites first (loose), then each section as a folder tile.
  const trimmedSearch = search.trim().toLowerCase();
  const items = useMemo(() => {
    if (trimmedSearch) {
      return apps
        .filter((a) => a.name.toLowerCase().includes(trimmedSearch))
        .map((a) => ({ kind: 'app', app: a, key: `app-${a.id}` }));
    }

    const list = [];
    // Favorites as loose icons
    const favApps = favorites
      .map((id) => apps.find((a) => a.id === id))
      .filter(Boolean);
    favApps.forEach((a) => list.push({ kind: 'app', app: a, key: `fav-${a.id}` }));

    // Sections as folders
    sections.forEach((s) => {
      const sectionApps = apps.filter((a) => a.section_id === s.id);
      if (sectionApps.length === 0) return;
      list.push({ kind: 'folder', section: s, apps: sectionApps, key: `folder-${s.id}` });
    });

    return list;
  }, [apps, sections, favorites, trimmedSearch]);

  // Pagination — 35 tiles per page (7 cols × 5 rows on desktop)
  const PAGE_SIZE = 35;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Reset page when searching
  useEffect(() => { setPage(0); }, [trimmedSearch]);

  const openFolder = items.find(
    (it) => it.kind === 'folder' && it.section.id === openFolderId
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] overflow-hidden"
    >
      {/* Wallpaper backdrop with strong blur */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: `url(${wallpaperUrl})`, filter: 'blur(28px) brightness(0.55)' }}
      />
      <div className="absolute inset-0 bg-black/35" />

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6">
        <div className="flex-1" />
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            autoFocus
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/60 focus:outline-none focus:bg-white/30 transition-colors"
          />
        </div>
        <div className="flex-1 flex justify-end">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-colors flex items-center justify-center"
            title="Close (Esc)"
            aria-label="Close Launchpad"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="absolute inset-0 flex items-center justify-center pt-20 pb-16 px-4 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`page-${safePage}-${trimmedSearch}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-x-4 sm:gap-x-8 gap-y-6 sm:gap-y-8 max-w-6xl"
          >
            {pagedItems.length === 0 && (
              <div className="col-span-full text-center text-white/80 py-12">
                No apps found
              </div>
            )}
            {pagedItems.map((it) =>
              it.kind === 'app' ? (
                <LaunchpadIcon key={it.key} app={it.app} onOpen={onOpenApp} />
              ) : (
                <LaunchpadFolderTile
                  key={it.key}
                  section={it.section}
                  apps={it.apps}
                  onOpen={() => setOpenFolderId(it.section.id)}
                />
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots & arrows */}
      {totalPages > 1 && !trimmedSearch && (
        <>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white disabled:opacity-30 hover:bg-white/25 transition-colors flex items-center justify-center"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white disabled:opacity-30 hover:bg-white/25 transition-colors flex items-center justify-center"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`rounded-full transition-all ${
                  safePage === i ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Expanded folder overlay */}
      <AnimatePresence>
        {openFolder && (
          <LaunchpadFolderExpanded
            section={openFolder.section}
            apps={openFolder.apps}
            onClose={() => setOpenFolderId(null)}
            onOpenApp={(app) => {
              setOpenFolderId(null);
              if (app.open_in_new_tab) {
                window.open(app.url, '_blank', 'noopener,noreferrer');
              } else {
                onOpenApp(app);
              }
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}