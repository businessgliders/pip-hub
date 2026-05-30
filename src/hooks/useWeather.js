import { useEffect, useState } from 'react';

// Maps Open-Meteo weather codes to a short description
const WEATHER_CODES = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Rain Showers',
  81: 'Rain Showers',
  82: 'Heavy Showers',
  85: 'Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

const DEFAULT_LOCATION = { lat: 43.7315, lon: -79.7624, city: 'Brampton, ON' };

async function fetchWeather(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius`
  );
  const data = await res.json();
  return {
    temp: Math.round(data.current.temperature_2m),
    condition: WEATHER_CODES[data.current.weather_code] || 'Unknown',
  };
}

export default function useWeather() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const w = await fetchWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
        if (!cancelled) setWeather({ ...w, city: DEFAULT_LOCATION.city });
      } catch {
        if (!cancelled) setWeather(null);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return weather;
}