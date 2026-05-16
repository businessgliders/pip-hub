import React from 'react';

export default function CustomizeTile({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center text-center p-6 md:p-8 rounded-2xl bg-white/90 hover:bg-white border border-white/80 hover:border-[#f1889b]/40 shadow-sm hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 md:w-14 md:h-14 mb-3 rounded-xl bg-gradient-to-br from-[#f1889b]/15 to-[#f7b1bd]/15 flex items-center justify-center group-hover:scale-105 transition-transform">
        <Icon className="w-6 h-6 md:w-7 md:h-7 text-[#f1889b]" />
      </div>
      <h3 className="font-semibold text-gray-800 text-base mb-1">{title}</h3>
      {description && (
        <p className="text-xs md:text-sm text-gray-500">{description}</p>
      )}
    </button>
  );
}