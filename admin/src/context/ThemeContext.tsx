import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextType {
  mode: ThemeMode;
  theme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  systemTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "admin_theme";

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mode defaults to "system" unless explicitly set by the user
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    }
    return "system";
  });

  // Track the actual OS/system theme in real-time
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
      return () => mediaQuery.removeEventListener("change", handleSystemChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemChange);
      return () => (mediaQuery as any).removeListener(handleSystemChange);
    }
  }, []);

  // Compute the active resolved theme
  const resolvedTheme: ResolvedTheme = mode === "system" ? systemTheme : mode;
  const isDark = resolvedTheme === "dark";

  // Apply .dark class to <html> root element and persist setting to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode, resolvedTheme]);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    // Cycle: system -> light -> dark -> system
    setModeState((current) => {
      if (current === "system") return "light";
      if (current === "light") return "dark";
      return "system";
    });
  }, []);

  // Harmonized dynamic MUI Theme mapped to CSS Design Tokens
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedTheme,
          primary: {
            main: resolvedTheme === "dark" ? "#14b8a6" : "#0d9488",
            light: resolvedTheme === "dark" ? "#2dd4bf" : "#14b8a6",
            dark: resolvedTheme === "dark" ? "#0d9488" : "#0f766e",
            contrastText: "#ffffff",
          },
          background: {
            default: resolvedTheme === "dark" ? "#06090f" : "#f1f5f9",
            paper: resolvedTheme === "dark" ? "#141c30" : "#ffffff",
          },
          text: {
            primary: resolvedTheme === "dark" ? "#f1f5f9" : "#0f172a",
            secondary: resolvedTheme === "dark" ? "#a1afc4" : "#64748b",
          },
          divider: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
        },
        typography: {
          fontFamily: [
            "Inter",
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            "sans-serif",
          ].join(","),
        },
        shape: {
          borderRadius: 10,
        },
        components: {
          MuiTooltip: {
            defaultProps: {
              arrow: true,
            },
            styleOverrides: {
              tooltip: {
                backgroundColor: resolvedTheme === "dark" ? "#1e293b" : "#0f172a",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "8px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                padding: "6px 10px",
              },
              arrow: {
                color: resolvedTheme === "dark" ? "#1e293b" : "#0f172a",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                fontWeight: 600,
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                backgroundColor: resolvedTheme === "dark" ? "#0f172a" : "#ffffff",
                color: resolvedTheme === "dark" ? "#f1f5f9" : "#0f172a",
                borderRadius: "12px",
                border: resolvedTheme === "dark" ? "1px solid #1e2d4a" : "1px solid #e2e8f0",
                boxShadow: resolvedTheme === "dark"
                  ? "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
                  : "0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                fontSize: "13px",
                fontWeight: 500,
                padding: "8px 14px",
                gap: "10px",
                borderRadius: "8px",
                margin: "2px 6px",
                "&:hover": {
                  backgroundColor: resolvedTheme === "dark" ? "#1a2540" : "#f1f5f9",
                },
                "&.Mui-selected": {
                  backgroundColor: resolvedTheme === "dark" ? "rgba(20, 184, 166, 0.15)" : "rgba(13, 148, 136, 0.1)",
                  color: resolvedTheme === "dark" ? "#14b8a6" : "#0d9488",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: resolvedTheme === "dark" ? "rgba(20, 184, 166, 0.22)" : "rgba(13, 148, 136, 0.15)",
                  },
                },
              },
            },
          },
        },
      }),
    [resolvedTheme]
  );

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: resolvedTheme,
        resolvedTheme,
        isDark,
        systemTheme,
        setTheme,
        toggleTheme,
      }}
    >
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
