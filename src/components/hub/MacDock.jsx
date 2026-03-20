import React, { useState, useRef } from 'react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/4517e6743_617f126bf_Pilatesinpinklogojusticon1.png';

export default function MacDock({ favoritedApps, onOpenApp, onReorderFavorites }) {
  const [launchingAppId, setLaunchingAppId] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const iconRefs = useRef([]);

  const handleLaunch = (app) => {
    if (dragging) return;
    setLaunchingAppId(app.id);
    setTimeout(() => {
      setLaunchingAppId(null);
      if (app.open_in_new_tab) {
        window.open(app.url, '_blank', 'noopener,noreferrer');
      } else {
        onOpenApp(app);
      }
    }, 700);
  };

  const getScale = (index) => {
    if (hoveredIndex === null || dragging) return 1;
    const dist = Math.abs(index - hoveredIndex);
    if (dist === 0) return 1.45;
    if (dist === 1) return 1.2;
    if (dist === 2) return 1.08;
    return 1;
  };

  // Native drag handlers for smooth macOS-style reorder
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    setDragging(true);
    setHoveredIndex(null);
    // Make the ghost drag image invisible
    const ghost = document.createElement('div');
    ghost.style.width = '1px';
    ghost.style.height = '1px';
    ghost.style.opacity = '0';
    ghost.style.position = 'fixed';
    ghost.style.top = '-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (index !== dragOverIndex) setDragOverIndex(index);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragPos({ x: e.clientX - rect.width / 2, y: e.clientY - rect.height / 2 });
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      onReorderFavorites(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    setDragging(false);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    setDragging(false);
  };

  // Build display order: shift items to show where dragged icon will land
  const getDisplayApps = () => {
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      return favoritedApps.map((app, i) => ({ app, originalIndex: i }));
    }
    const arr = favoritedApps.map((app, i) => ({ app, originalIndex: i }));
    const [removed] = arr.splice(dragIndex, 1);
    arr.splice(dragOverIndex, 0, removed);
    return arr;
  };

  if (!favoritedApps || favoritedApps.length === 0) return null;

  const displayApps = getDisplayApps();

  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-end justify-center select-none">
      <div
        ref={containerRef}
        className="flex items-end px-5 py-3 rounded-3xl gap-3"
        style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.45)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
        onMouseLeave={() => !dragging && setHoveredIndex(null)}
      >
        {/* Pilates Logo — first position */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Home"
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg bg-white/60">
            <img src={LOGO_URL} alt="Pilates in Pink" className="w-full h-full object-contain p-1" draggable={false} />
          </div>
        </div>

        {/* Favorite Apps */}
        {displayApps.map(({ app, originalIndex }, displayIdx) => {
          const isLaunching = launchingAppId === app.id;
          const isDragSource = originalIndex === dragIndex;
          const scale = getScale(displayIdx);
          const translateY = scale > 1.3 ? -12 : scale > 1.1 ? -6 : 0;

          return (
            <div
              key={app.id}
              ref={el => iconRefs.current[originalIndex] = el}
              draggable
              onDragStart={(e) => handleDragStart(e, originalIndex)}
              onDragOver={(e) => handleDragOver(e, displayIdx)}
              onDrop={(e) => handleDrop(e, displayIdx)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => !dragging && setHoveredIndex(displayIdx)}
              onClick={() => handleLaunch(app)}
              title={app.name}
              style={{
                transform: `scale(${isDragSource && dragging ? 1.1 : scale}) translateY(${isDragSource && dragging ? -16 : translateY}px)`,
                transition: dragging ? 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)' : 'transform 0.15s ease',
                transformOrigin: 'bottom center',
                zIndex: isDragSource && dragging ? 50 : scale > 1 ? 10 : 1,
                opacity: 1,
                cursor: dragging ? 'grabbing' : 'pointer',
                filter: isDragSource && dragging ? 'drop-shadow(0 12px 20px rgba(0,0,0,0.35))' : 'none',
              }}
              className="flex items-center"
            >
              <div
                className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg"
                style={{
                  animation: isLaunching ? 'dockBounce 0.7s ease' : 'none',
                  background: 'linear-gradient(135deg, rgba(241,136,155,0.3), rgba(247,177,189,0.3))',
                }}
              >
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{app.name.charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes dockBounce {
          0%   { transform: translateY(0); }
          20%  { transform: translateY(-28px); }
          40%  { transform: translateY(0); }
          60%  { transform: translateY(-14px); }
          80%  { transform: translateY(0); }
          90%  { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}