import React, { useState, useEffect } from 'react';
import { CloudSun } from 'lucide-react';

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full w-full p-1.5">
      <div className="flex items-center justify-between h-full w-full px-8 rounded-[1rem] border-[1.5px] border-white/60">
        
        <svg width="0" height="0" className="absolute">
          <linearGradient id="weather-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#fbbf24" offset="0%" />
            <stop stopColor="#f472b6" offset="50%" />
            <stop stopColor="#a78bfa" offset="100%" />
          </linearGradient>
        </svg>

        <div className="flex flex-col items-start justify-center">
          <div className="text-4xl md:text-[2.75rem] font-light tracking-tight text-gray-900 leading-none">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-base font-normal text-gray-800 mt-2">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-3">
            <CloudSun className="w-10 h-10" stroke="url(#weather-gradient)" strokeWidth={1.5} />
            <div className="text-4xl md:text-[2.75rem] font-light tracking-tight text-gray-900 leading-none">
              22°C
            </div>
          </div>
          <div className="flex flex-col items-center mt-2">
            <div className="text-base font-medium text-gray-900 leading-snug">
              Brampton, ON
            </div>
            <div className="text-sm font-normal text-gray-700 leading-snug">
              Partly Cloudy
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}