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

const THEME_STORAGE_KEY = "customer_theme";

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mode defaults to "light" for customer storefront
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    }
    return "light";
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

  // Compute resolved theme
  const resolvedTheme: ResolvedTheme = mode === "system" ? systemTheme : mode;
  const isDark = resolvedTheme === "dark";

  // Apply .dark class to <html> and persist setting to localStorage
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

  // Harmonized dynamic MUI Theme mapped to semantic design tokens
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedTheme,
          primary: {
            main: isDark ? "#14b8a6" : "#0d9488",
            light: isDark ? "#2dd4bf" : "#14b8a6",
            dark: isDark ? "#0d9488" : "#0f766e",
            contrastText: "#ffffff",
          },
          secondary: {
            main: isDark ? "#1a2540" : "#f1f5f9",
          },
          background: {
            default: isDark ? "#06090f" : "#f1f5f9",
            paper: isDark ? "#141c30" : "#ffffff",
          },
          text: {
            primary: isDark ? "#f1f5f9" : "#0f172a",
            secondary: isDark ? "#a1afc4" : "#64748b",
          },
          divider: isDark ? "#1e2d4a" : "#e2e8f0",
          error: {
            main: isDark ? "#f87171" : "#ef4444",
          },
          success: {
            main: isDark ? "#34d399" : "#10b981",
          },
          warning: {
            main: isDark ? "#fbbf24" : "#f59e0b",
          },
          info: {
            main: isDark ? "#60a5fa" : "#3b82f6",
          },
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
          borderRadius: 14,
        },
        components: {
          MuiBackdrop: {
            styleOverrides: {
              root: {
                backgroundColor: isDark ? "rgba(0, 0, 0, 0.72)" : "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                backgroundColor: isDark ? "#141c30" : "#ffffff",
                color: isDark ? "#f1f5f9" : "#0f172a",
                borderRadius: "1.25rem",
                border: isDark ? "1px solid #1e2d4a" : "1px solid #e2e8f0",
                boxShadow: isDark
                  ? "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)"
                  : "0 25px 50px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.03)",
                backgroundImage: "none",
                margin: "16px",
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                color: isDark ? "#f1f5f9" : "#0f172a",
                fontWeight: 700,
                padding: "18px 22px 14px",
              },
            },
          },
          MuiDialogContent: {
            styleOverrides: {
              root: {
                color: isDark ? "#f1f5f9" : "#0f172a",
                padding: "16px 22px",
              },
            },
          },
          MuiDialogActions: {
            styleOverrides: {
              root: {
                padding: "14px 22px 18px",
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: "0.75rem",
                backgroundColor: isDark ? "rgba(13, 19, 34, 0.6)" : "#ffffff",
                color: isDark ? "#f1f5f9" : "#0f172a",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark ? "#1e2d4a" : "#cbd5e1",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark ? "#334b75" : "#94a3b8",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark ? "#14b8a6" : "#0d9488",
                  borderWidth: "1.5px",
                },
                "&.Mui-disabled": {
                  backgroundColor: isDark ? "rgba(22, 32, 51, 0.4)" : "#f8fafc",
                },
              },
              input: {
                fontSize: "0.875rem",
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                color: isDark ? "#a1afc4" : "#64748b",
                fontSize: "0.875rem",
                "&.Mui-focused": {
                  color: isDark ? "#14b8a6" : "#0d9488",
                },
              },
            },
          },
          MuiTooltip: {
            defaultProps: {
              arrow: true,
            },
            styleOverrides: {
              tooltip: {
                backgroundColor: isDark ? "#1e293b" : "#0f172a",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "8px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                padding: "6px 10px",
              },
              arrow: {
                color: isDark ? "#1e293b" : "#0f172a",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "0.75rem",
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                backgroundColor: isDark ? "#141c30" : "#ffffff",
                color: isDark ? "#f1f5f9" : "#0f172a",
                borderRadius: "12px",
                border: isDark ? "1px solid #1e2d4a" : "1px solid #e2e8f0",
                boxShadow: isDark
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
                  backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                },
                "&.Mui-selected": {
                  backgroundColor: isDark ? "rgba(20, 184, 166, 0.15)" : "rgba(13, 148, 136, 0.1)",
                  color: isDark ? "#14b8a6" : "#0d9488",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: isDark ? "rgba(20, 184, 166, 0.22)" : "rgba(13, 148, 136, 0.15)",
                  },
                },
              },
            },
          },
        },
      }),
    [resolvedTheme, isDark]
  );

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: resolvedTheme,
        resolvedTheme,
        isDark,
        systemTheme,
        toggleTheme,
        setTheme,
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
