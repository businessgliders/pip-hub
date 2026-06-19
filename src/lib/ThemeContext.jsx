import React, { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const ThemeContext = createContext({ dark: false, toggle: () => {} });

// These users default to dark theme (until they manually pick a theme).
const DARK_DEFAULT_USERS = ["gurpreen@pilatesinpinkstudio.com", "sahil@pilatesinpinkstudio.com"];

// Day = 9am–5pm in Toronto (EST/EDT). Outside that range -> night (dark mode).
function isNightInToronto() {
  try {
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Toronto",
      hour: "numeric",
      hour12: false,
    }).format(new Date());
    const hour = parseInt(hourStr, 10) % 24;
    return hour < 9 || hour >= 17;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }) {
  // Auto theme based on time of day, unless the user has manually overridden it.
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("pip-theme");
      if (saved === "dark") return true;
      if (saved === "light") return false;
    } catch {
      // ignore
    }
    return isNightInToronto();
  });

  // Re-evaluate the time-based theme periodically (only when not manually set).
  useEffect(() => {
    const apply = () => {
      try {
        if (localStorage.getItem("pip-theme")) return; // user override wins
      } catch {
        // ignore
      }
      setDark(isNightInToronto());
    };
    apply();
    const id = setInterval(apply, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // For specific users, default to dark theme unless they've manually chosen one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (localStorage.getItem("pip-theme")) return; // user override wins
        const user = await base44.auth.me();
        if (cancelled) return;
        if (user?.email && DARK_DEFAULT_USERS.includes(user.email.toLowerCase())) {
          setDark(true);
        }
      } catch {
        // not logged in / ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  // Manual toggle persists the user's choice (overrides the time-based default).
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      try {
        localStorage.setItem("pip-theme", next ? "dark" : "light");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}