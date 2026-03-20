import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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

  const getScale = (index) => {
    if (hoveredIndex === null) return 1;
    const dist = Math.abs(index - hoveredIndex);
    if (dist === 0) return 1.45;
    if (dist === 1) return 1.2;
    if (dist === 2) return 1.08;
    return 1;
  };

  if (!favoritedApps || favoritedApps.length === 0) return null;

  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-end justify-center">
      {/* Glass dock background */}
      <div
        className="relative flex items-end px-4 py-3 rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.45)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dock" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex items-end gap-2"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {favoritedApps.slice(0, Math.ceil(favoritedApps.length / 2)).map((app, index) => {
                  const isLaunching = launchingAppId === app.id;
                  const scale = getScale(index);

                  return (
                    <Draggable key={app.id} draggableId={`dock-${app.id}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging
                              ? provided.draggableProps.style?.transform
                              : `scale(${scale}) translateY(${scale > 1.3 ? '-10px' : scale > 1.1 ? '-5px' : '0px'})`,
                            transition: snapshot.isDragging ? 'none' : 'transform 0.15s ease',
                            transformOrigin: 'bottom center',
                            zIndex: scale > 1 ? 10 : 1,
                          }}
                          className="flex flex-col items-center gap-1 cursor-pointer select-none"
                          onMouseEnter={() => setHoveredIndex(index)}
                          onClick={() => !snapshot.isDragging && handleLaunch(app)}
                          title={app.name}
                        >
                          {/* App Icon */}
                          <div
                            className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg"
                            style={{
                              animation: isLaunching ? 'dockBounce 0.7s ease' : 'none',
                              background: 'linear-gradient(135deg, rgba(241,136,155,0.3), rgba(247,177,189,0.3))',
                            }}
                          >
                            {app.icon_url ? (
                              <img
                                src={app.icon_url}
                                alt={app.name}
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center">
                                <span className="text-white font-bold text-xl">
                                  {app.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Running dot */}
                          <div className="w-1 h-1 rounded-full bg-gray-600/70" />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
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