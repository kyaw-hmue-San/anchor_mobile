import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { getAppSettings, saveAppSettings } from "../services/appSettings";

type ThemeMode = "light" | "dark";

export type AppThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primarySoft: string;
  danger: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppThemeColors;
  setDarkModeEnabled: (enabled: boolean) => Promise<void>;
  toggleThemeMode: () => Promise<void>;
  navigationTheme: Theme;
};

const lightColors: AppThemeColors = {
  background: "#F5F3FF",
  surface: "#FFFFFF",
  surfaceAlt: "#F9F5FF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  primary: "#7C3AED",
  primarySoft: "#EDE9FE",
  danger: "#EF4444",
};

const darkColors: AppThemeColors = {
  background: "#0F172A",
  surface: "#111827",
  surfaceAlt: "#1F2937",
  text: "#F9FAFB",
  muted: "#9CA3AF",
  border: "#374151",
  primary: "#A78BFA",
  primarySoft: "#312E81",
  danger: "#F87171",
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await getAppSettings();
        setMode(settings.darkMode ? "dark" : "light");
      } catch {
        setMode("light");
      }
    };

    load();
  }, []);

  const setDarkModeEnabled = useCallback(async (enabled: boolean) => {
    const previousMode = mode;
    setMode(enabled ? "dark" : "light");
    try {
      const current = await getAppSettings();
      await saveAppSettings({ ...current, darkMode: enabled });
    } catch (error) {
      setMode(previousMode);
      throw error;
    }
  }, [mode]);

  const toggleThemeMode = useCallback(async () => {
    const nextDark = mode !== "dark";
    await setDarkModeEnabled(nextDark);
  }, [mode, setDarkModeEnabled]);

  const isDark = mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  const navigationTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [colors.background, colors.border, colors.primary, colors.surface, colors.text, isDark]);

  const value = useMemo(
    () => ({ mode, isDark, colors, setDarkModeEnabled, toggleThemeMode, navigationTheme }),
    [colors, isDark, mode, navigationTheme, setDarkModeEnabled, toggleThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}
