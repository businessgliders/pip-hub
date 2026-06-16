import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ dark: false, toggle: () => {} });

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