import React, { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, CloudDrizzle } from 'lucide-react';
import useWeather from '@/hooks/useWeather';

const getWeatherIcon = (condition) => {
  if (!condition) return Sun;
  const c = condition.toLowerCase();
  if (c.includes('thunder')) return CloudLightning;
  if (c.includes('snow')) return CloudSnow;
  if (c.includes('drizzle')) return CloudDrizzle;
  if (c.includes('rain') || c.includes('shower')) return CloudRain;
  if (c.includes('fog')) return CloudFog;
  if (c.includes('cloud') || c.includes('overcast')) return Cloud;
  return Sun;
};

export default function MobileDateWeather() {
  const weather = useWeather();
  const [now, setNow] = useState(new Date());
  const [isTabletUp, setIsTabletUp] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 768
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onResize = () => setIsTabletUp(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLine = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const timeLine = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const Icon = getWeatherIcon(weather?.condition);

  if (isTabletUp) {
    // Desktop: time centered with date and weather on sides
    return (
      <div className="flex items-center justify-between gap-6 flex-1">
        {/* Left: Date */}
        <div className="flex flex-col min-w-0">
          <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-[#f1889b]">
            {weekday}
          </div>
          <div className="text-sm font-bold text-gray-800 leading-tight truncate">
            {dateLine}
          </div>
        </div>

        {/* Center: Time */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-gray-800 leading-tight">
            {timeLine}
          </div>
        </div>

        {/* Right: Weather */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-br from-[#fbe0e2]/80 to-white/60 border border-white/60 shadow-sm flex-shrink-0">
          <Icon className="w-5 h-5 text-[#f1889b]" strokeWidth={2.2} />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-gray-800">
              {weather ? `${weather.temp}°` : '—'}
            </span>
            <span className="text-[9px] text-gray-500 truncate max-w-[80px]">
              {weather?.condition || 'Loading'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Mobile: date with weather below on left, time on right
  return (
    <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
      <div className="flex flex-col min-w-0 gap-1.5">
        <div>
          <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-[#f1889b]">
            {weekday}
          </div>
          <div className="text-sm font-bold text-gray-800 leading-tight truncate">
            {dateLine}
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-br from-[#fbe0e2]/80 to-white/60 border border-white/60 shadow-sm flex-shrink-0">
          <Icon className="w-5 h-5 text-[#f1889b]" strokeWidth={2.2} />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-gray-800">
              {weather ? `${weather.temp}°` : '—'}
            </span>
            <span className="text-[9px] text-gray-500 truncate max-w-[80px]">
              {weather?.condition || 'Loading'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div className="text-lg font-bold text-gray-800 leading-tight">
          {timeLine}
        </div>
      </div>
    </div>
  );
}