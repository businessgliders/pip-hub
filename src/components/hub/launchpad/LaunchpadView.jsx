import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import LaunchpadIcon from './LaunchpadIcon';
import { LaunchpadFolderTile, LaunchpadFolderExpanded } from './LaunchpadFolder';

// Desktop breakpoint matches MacDock visibility (md: 768px)
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 768
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

// macOS Launchpad-style INLINE view: rendered in place of sections, paginated grid,
// sections-as-folders, supports search (driven by parent's searchQuery) and edit mode.
export default function LaunchpadView({
  apps,
  sections,
  favorites = [],
  searchQuery = '',
  isEditMode = false,
  onOpenApp,
  onEditApp,
  onDeleteApp,
  onHideApp,
  onRenameSection,
  onToggleFavorite,
}) {
  const [openFolderId, setOpenFolderId] = useState(null);
  const [page, setPage] = useState(0);
  const isDesktop = useIsDesktop();

  // Esc to close any open folder
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && openFolderId) setOpenFolderId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openFolderId]);

  // Build the items list:
  // - When searching: a flat list of matching apps (no folders).
  // - Otherwise: favorites first (loose), then each section as a folder tile.
  const trimmedSearch = searchQuery.trim().toLowerCase();
  const items = useMemo(() => {
    if (trimmedSearch) {
      return apps
        .filter((a) => a.name.toLowerCase().includes(trimmedSearch))
        .map((a) => ({ kind: 'app', app: a, key: `app-${a.id}` }));
    }

    const list = [];
    // On desktop, favorites are shown in the MacDock — hide loose icons here to avoid duplication.
    if (!isDesktop) {
      const favApps = favorites
        .map((id) => apps.find((a) => a.id === id))
        .filter(Boolean);
      favApps.forEach((a) => list.push({ kind: 'app', app: a, key: `fav-${a.id}` }));
    }

    sections.forEach((s) => {
      const sectionApps = apps.filter((a) => a.section_id === s.id);
      if (sectionApps.length === 0) return;
      list.push({ kind: 'folder', section: s, apps: sectionApps, key: `folder-${s.id}` });
    });

    return list;
  }, [apps, sections, favorites, trimmedSearch, isDesktop]);

  // Pagination — 28 tiles per page (7 cols × 4 rows on desktop)
  const PAGE_SIZE = 28;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => { setPage(0); }, [trimmedSearch]);

  const openFolder = items.find(
    (it) => it.kind === 'folder' && it.section.id === openFolderId
  );

  return (
    <div className="relative">
      {/* Wiggle keyframes for edit-mode jiggle */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
      `}</style>

      <div className="relative min-h-[400px] pt-0 pb-6 sm:py-6 mt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`page-${safePage}-${trimmedSearch}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
          >
            {pagedItems.length === 0 ? (
              <div className="text-center text-gray-600 py-12">No apps found</div>
            ) : (
              <Droppable droppableId="launchpad" direction="horizontal" type="LAUNCHPAD" isDropDisabled={!isEditMode || !!trimmedSearch}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-x-2 sm:gap-x-4 gap-y-5 sm:gap-y-7 justify-items-center"
                  >
                    {pagedItems.map((it, idx) => (
                      <Draggable
                        key={it.key}
                        draggableId={it.key}
                        index={idx}
                        isDragDisabled={!isEditMode || !!trimmedSearch}
                      >
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            style={prov.draggableProps.style}
                            className={snap.isDragging ? 'z-50' : ''}
                          >
                            {it.kind === 'app' ? (
                              <LaunchpadIcon
                                app={it.app}
                                onOpen={onOpenApp}
                                isEditMode={isEditMode}
                                onEdit={onEditApp}
                                onDelete={onDeleteApp}
                                onHide={onHideApp}
                                isFavorited={favorites.includes(it.app.id)}
                                onToggleFavorite={onToggleFavorite}
                              />
                            ) : (
                              <LaunchpadFolderTile
                                section={it.section}
                                apps={it.apps}
                                onOpen={() => setOpenFolderId(it.section.id)}
                                isEditMode={isEditMode}
                                onRename={onRenameSection}
                              />
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && !trimmedSearch && (
          <>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/60 backdrop-blur-md border border-white/70 text-gray-700 disabled:opacity-30 hover:bg-white/80 transition-colors flex items-center justify-center shadow-sm"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage === totalPages - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/60 backdrop-blur-md border border-white/70 text-gray-700 disabled:opacity-30 hover:bg-white/80 transition-colors flex items-center justify-center shadow-sm"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`rounded-full transition-all ${
                    safePage === i ? 'w-6 h-2 bg-gray-700' : 'w-2 h-2 bg-gray-400/60 hover:bg-gray-500'
                  }`}
                  aria-label={`Page ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Expanded folder */}
        <AnimatePresence>
          {openFolder && (
            <LaunchpadFolderExpanded
              section={openFolder.section}
              apps={openFolder.apps}
              isEditMode={isEditMode}
              onClose={() => setOpenFolderId(null)}
              onOpenApp={(app) => {
                if (isEditMode) return;
                setOpenFolderId(null);
                onOpenApp(app);
              }}
              onEditApp={onEditApp}
              onDeleteApp={onDeleteApp}
              onHideApp={onHideApp}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}