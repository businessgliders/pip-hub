import React from 'react';
import { CloudSun, MapPin } from 'lucide-react';

export default function WeatherWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-gray-800">
      <CloudSun className="w-10 h-10 mb-2 text-[#f1889b]" />
      <div className="text-3xl font-bold tracking-tight">22°C</div>
      <div className="flex items-center gap-1 text-sm font-medium text-gray-500 mt-1">
        <MapPin className="w-3 h-3" /> Brampton, Ontario, Canada
      </div>
      <div className="text-xs text-gray-400 mt-1">Partly Cloudy</div>
    </div>
  );
}