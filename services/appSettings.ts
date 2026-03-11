import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppSettings, defaultSettings } from "../features/settings/types";

export const APP_SETTINGS_KEY = "app_settings";

const NOTIFICATION_KEYS: (keyof AppSettings)[] = [
  "messageNotifications",
  "locationUpdates",
  "sound",
  "countdownReminders",
  "guardianAlerts",
];

function safeParseSettings(raw: string | null): Partial<AppSettings> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function normalizeAppSettings(settings: AppSettings): AppSettings {
  if (settings.enableNotifications) return settings;

  const next = { ...settings };
  NOTIFICATION_KEYS.forEach(key => {
    next[key] = false;
  });

  return next;
}

export async function getAppSettings(): Promise<AppSettings> {
  const stored = await AsyncStorage.getItem(APP_SETTINGS_KEY);
  const merged = { ...defaultSettings, ...safeParseSettings(stored) };
  return normalizeAppSettings(merged);
}

export async function saveAppSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized = normalizeAppSettings(settings);
  await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function clearAppSettings() {
  await AsyncStorage.removeItem(APP_SETTINGS_KEY);
}
