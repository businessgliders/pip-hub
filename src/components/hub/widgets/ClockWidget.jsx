import React, { useState, useEffect } from 'react';
import { CloudSun } from 'lucide-react';
import useWeather from '@/hooks/useWeather';

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());
  const weather = useWeather();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full w-full p-1.5">
      <div className="flex items-center justify-between h-full w-full px-4 md:px-8 rounded-[1rem] border-[1.5px] border-white/60 overflow-hidden">
        
        <svg width="0" height="0" className="absolute">
          <linearGradient id="weather-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#fbbf24" offset="0%" />
            <stop stopColor="#f472b6" offset="50%" />
            <stop stopColor="#a78bfa" offset="100%" />
          </linearGradient>
        </svg>

        <div className="flex flex-col items-start justify-center min-w-0 pr-2">
          <div className="text-2xl sm:text-4xl md:text-[2.75rem] font-light tracking-tight text-gray-900 leading-none truncate w-full">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs sm:text-base font-normal text-gray-800 mt-2 truncate w-full">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="flex flex-col items-end sm:items-center justify-center flex-shrink-0">
          <div className="flex items-center gap-1 sm:gap-3">
            <CloudSun className="w-6 h-6 sm:w-10 sm:h-10" stroke="url(#weather-gradient)" strokeWidth={1.5} />
            <div className="text-2xl sm:text-4xl md:text-[2.75rem] font-light tracking-tight text-gray-900 leading-none">
              {weather ? `${weather.temp}°C` : '—'}
            </div>
          </div>
          <div className="flex flex-col items-end sm:items-center mt-2">
            <div className="text-xs sm:text-base font-medium text-gray-900 leading-snug">
              {weather?.city || 'Loading...'}
            </div>
            <div className="text-[10px] sm:text-sm font-normal text-gray-700 leading-snug">
              {weather?.condition || ''}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}