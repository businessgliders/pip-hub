import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/4517e6743_617f126bf_Pilatesinpinklogojusticon1.png';

function DockIcon({ app, index, hoveredIndex, launchingAppId, onHover, onLaunch, provided, snapshot }) {
  const dist = hoveredIndex === null ? 99 : Math.abs(index - hoveredIndex);
  const scale = dist === 0 ? 1.45 : dist === 1 ? 1.2 : dist === 2 ? 1.08 : 1;
  const translateY = scale > 1.3 ? '-12px' : scale > 1.1 ? '-6px' : '0px';
  const isLaunching = launchingAppId === app.id;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        transform: snapshot.isDragging
          ? provided.draggableProps.style?.transform
          : `scale(${scale}) translateY(${translateY})`,
        transition: snapshot.isDragging ? 'none' : 'transform 0.15s ease',
        transformOrigin: 'bottom center',
        zIndex: scale > 1 ? 10 : 1,
      }}
      className="flex flex-col items-center gap-1 cursor-pointer select-none px-1"
      onMouseEnter={() => onHover(index)}
      onClick={() => !snapshot.isDragging && onLaunch(app)}
      title={app.name}
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
      <div className="w-1 h-1 rounded-full bg-gray-600/70" />
    </div>
  );
}

export default function MacDock({ favoritedApps, onOpenApp, onReorderFavorites }) {
  const [launchingAppId, setLaunchingAppId] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleLaunch = (app) => {
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

  const handleDragEnd = (result) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    onReorderFavorites(result.source.index, result.destination.index);
  };

  if (!favoritedApps || favoritedApps.length === 0) return null;

  const mid = Math.ceil(favoritedApps.length / 2);
  const leftApps = favoritedApps.slice(0, mid);
  const rightApps = favoritedApps.slice(mid);

  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-end justify-center">
      <div
        className="relative flex items-end px-5 py-3 rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.45)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dock" direction="horizontal">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex items-end gap-1">
                {/* Left half */}
                {leftApps.map((app, index) => (
                  <Draggable key={app.id} draggableId={`dock-${app.id}`} index={index}>
                    {(provided, snapshot) => (
                      <DockIcon
                        app={app}
                        index={index}
                        hoveredIndex={hoveredIndex}
                        launchingAppId={launchingAppId}
                        onHover={setHoveredIndex}
                        onLaunch={handleLaunch}
                        provided={provided}
                        snapshot={snapshot}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Divider */}
        {rightApps.length > 0 && (
          <div className="w-px h-10 bg-white/40 mx-3 self-center" />
        )}

        {/* Centre Logo */}
        <div
          className="flex flex-col items-center gap-1 cursor-pointer select-none px-2"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Home"
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg bg-white/60">
            <img src={LOGO_URL} alt="Pilates in Pink" className="w-full h-full object-contain p-1" draggable={false} />
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-600/70" />
        </div>

        {/* Divider */}
        {rightApps.length > 0 && (
          <div className="w-px h-10 bg-white/40 mx-3 self-center" />
        )}

        {/* Right half */}
        {rightApps.length > 0 && (
          <DragDropContext onDragEnd={(result) => {
            if (!result.destination) return;
            onReorderFavorites(mid + result.source.index, mid + result.destination.index);
          }}>
            <Droppable droppableId="dock-right" direction="horizontal">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex items-end gap-1">
                  {rightApps.map((app, index) => (
                    <Draggable key={app.id} draggableId={`dock-r-${app.id}`} index={index}>
                      {(provided, snapshot) => (
                        <DockIcon
                          app={app}
                          index={mid + index}
                          hoveredIndex={hoveredIndex}
                          launchingAppId={launchingAppId}
                          onHover={setHoveredIndex}
                          onLaunch={handleLaunch}
                          provided={provided}
                          snapshot={snapshot}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
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