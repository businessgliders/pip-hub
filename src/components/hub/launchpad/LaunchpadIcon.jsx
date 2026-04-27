import React from 'react';

// A single app icon styled like macOS Launchpad / iOS springboard.
export default function LaunchpadIcon({ app, onOpen }) {
  const isNewApp = () => {
    if (!app?.is_new) return false;
    const created = new Date(app.created_date);
    return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  };

  const handleClick = () => {
    if (app.open_in_new_tab) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } else {
      onOpen?.(app);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group flex flex-col items-center gap-2 w-20 sm:w-24 focus:outline-none"
    >
      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center overflow-hidden shadow-xl group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
          {app.icon_url ? (
            <img src={app.icon_url} alt={app.name} className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
          )}
        </div>
        {isNewApp() && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-semibold text-white bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] rounded-full shadow-md">
            New
          </span>
        )}
      </div>
      <span className="text-xs sm:text-sm text-white font-medium text-center truncate w-full drop-shadow-md">
        {app.name}
      </span>
    </button>
  );
}