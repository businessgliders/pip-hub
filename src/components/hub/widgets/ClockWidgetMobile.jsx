import React, { useState, useEffect } from 'react';
import { CloudSun } from 'lucide-react';
import useWeather from '@/hooks/useWeather';

export default function ClockWidgetMobile() {
  const [time, setTime] = useState(new Date());
  const weather = useWeather();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full w-full p-1.5">
      <div className="flex flex-col items-center justify-center h-full w-full px-3 rounded-[1rem] border-[1.5px] border-white/60 overflow-hidden">

        <svg width="0" height="0" className="absolute">
          <linearGradient id="weather-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#fbbf24" offset="0%" />
            <stop stopColor="#f472b6" offset="50%" />
            <stop stopColor="#a78bfa" offset="100%" />
          </linearGradient>
        </svg>

        <div className="text-2xl font-light tracking-tight text-gray-900 leading-none">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-[10px] font-normal text-gray-700 mt-1 truncate w-full text-center">
          {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <CloudSun className="w-4 h-4" stroke="url(#weather-gradient-mobile)" strokeWidth={1.5} />
          <div className="text-sm font-light text-gray-900 leading-none">
            {weather ? `${weather.temp}°C` : '—'}
          </div>
        </div>
        <div className="text-[9px] font-medium text-gray-700 leading-snug mt-0.5 truncate w-full text-center">
          {weather?.city || 'Loading...'}
        </div>

      </div>
    </div>
  );
}