// Admin day/night theme. The scope classes go on <html> (not a wrapper div)
// so dialogs, drawers and the command palette, which portal to <body>,
// follow the same theme. Removed again when the admin unmounts.
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const KEY = "solix_admin_theme";
const ThemeContext = createContext({ theme: "dark", toggle: () => {} });

const readTheme = () => {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
};

export const AdminThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("admin-ui");
    root.classList.toggle("dark", theme === "dark");
    return () => root.classList.remove("admin-ui", "dark");
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode: theme still switches for this visit */
      }
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
};

export const useAdminTheme = () => useContext(ThemeContext);

// Chart ink that reads on either ground; recharts takes literal colors.
export const useChartInk = () => {
  const { theme } = useAdminTheme();
  return theme === "dark"
    ? { ink: "hsl(210 22% 70%)", grid: "rgba(255,255,255,0.06)", cursor: "rgba(255,255,255,0.22)", ring: "#0b1424" }
    : { ink: "hsl(210 30% 38%)", grid: "rgba(13,25,45,0.07)", cursor: "rgba(13,25,45,0.25)", ring: "#ffffff" };
};
