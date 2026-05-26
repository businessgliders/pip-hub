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

    // Always load fallback immediately so the UI shows weather quickly,
    // then upgrade to precise location if geolocation succeeds.
    load(FALLBACK.lat, FALLBACK.lon, FALLBACK.city);

    if (navigator.geolocation) {
      let resolved = false;
      const safety = setTimeout(() => { resolved = true; }, 6000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(safety);
          load(pos.coords.latitude, pos.coords.longitude);
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