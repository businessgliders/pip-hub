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

const FALLBACK = { lat: 43.7315, lon: -79.7624, city: 'Brampton, ON' };

const CACHE_KEY = 'weather_location_v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function readCachedLocation() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.lat || !parsed?.lon || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedLocation(lat, lon, city) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lon, city, ts: Date.now() }));
  } catch {}
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`
    );
    const data = await res.json();
    const r = data?.results?.[0];
    if (!r) return null;
    const region = r.admin1_code || r.admin1 || r.country_code;
    return region ? `${r.name}, ${region}` : r.name;
  } catch {
    return null;
  }
}

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

    const load = async (lat, lon, city) => {
      try {
        const w = await fetchWeather(lat, lon);
        const resolvedCity = city || (await reverseGeocode(lat, lon)) || FALLBACK.city;
        if (!cancelled) setWeather({ ...w, city: resolvedCity });
      } catch {
        if (!cancelled) setWeather(null);
      }
    };

    // Use cached location if available (avoids re-prompting on every page load).
    const cached = readCachedLocation();
    if (cached) {
      load(cached.lat, cached.lon, cached.city);
      return () => { cancelled = true; };
    }

    // Otherwise show fallback immediately, then prompt for geolocation once.
    load(FALLBACK.lat, FALLBACK.lon, FALLBACK.city);

    if (navigator.geolocation) {
      let resolved = false;
      const safety = setTimeout(() => { resolved = true; }, 6000);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(safety);
          const { latitude, longitude } = pos.coords;
          const city = (await reverseGeocode(latitude, longitude)) || FALLBACK.city;
          writeCachedLocation(latitude, longitude, city);
          load(latitude, longitude, city);
        },
        () => {
          resolved = true;
          clearTimeout(safety);
        },
        { timeout: 5000, maximumAge: 600000 }
      );
    }

    return () => { cancelled = true; };
  }, []);

  return weather;
}