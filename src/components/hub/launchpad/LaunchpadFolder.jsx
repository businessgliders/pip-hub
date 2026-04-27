import React from 'react';
import { motion } from 'framer-motion';
import LaunchpadIcon from './LaunchpadIcon';

// Folder tile shown in the main grid — preview of up to 9 mini icons.
export function LaunchpadFolderTile({ section, apps, onOpen }) {
  const previewApps = apps.slice(0, 9);
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col items-center gap-2 w-24 sm:w-28 focus:outline-none"
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 p-2 grid grid-cols-3 gap-1 shadow-lg group-hover:scale-105 group-active:scale-95 transition-transform">
        {previewApps.map((app) => (
          <div
            key={app.id}
            className="w-full aspect-square rounded-md bg-white/30 flex items-center justify-center overflow-hidden"
          >
            {app.icon_url ? (
              <img src={app.icon_url} alt="" className="w-full h-full object-contain p-0.5" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
            )}
          </div>
        ))}
        {Array.from({ length: Math.max(0, 9 - previewApps.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-full aspect-square" />
        ))}
      </div>
      <span className="text-xs sm:text-sm text-white font-medium text-center truncate w-full drop-shadow-md">
        {section.name}
      </span>
    </button>
  );
}

// Expanded folder — inline overlay revealing all the apps inside.
export function LaunchpadFolderExpanded({ section, apps, onClose, onOpenApp }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-30 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="w-full max-w-3xl rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-center text-white text-xl font-semibold mb-6 drop-shadow">
          {section.name}
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 sm:gap-6 max-h-[60vh] overflow-y-auto px-1">
          {apps.map((app) => (
            <LaunchpadIcon key={app.id} app={app} onOpen={() => onOpenApp(app)} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}