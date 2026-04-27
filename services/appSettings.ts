import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { AppSettings, defaultSettings } from "../features/settings/types";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";

export const APP_SETTINGS_KEY = "app_settings";
const APP_SETTINGS_DOC_ID = "app_settings";

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

function toSettingsFromPartial(partial: Partial<AppSettings>) {
  return normalizeAppSettings({ ...defaultSettings, ...partial });
}

export async function getAppSettings(): Promise<AppSettings> {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const userId = auth?.currentUser?.uid;

  if (db && userId) {
    const settingsRef = doc(db, "users", userId, "private", APP_SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const remote = toSettingsFromPartial(settingsSnap.data() as Partial<AppSettings>);
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(remote));
      return remote;
    }
  }

  const localRaw = await AsyncStorage.getItem(APP_SETTINGS_KEY);
  const localSettings = toSettingsFromPartial(safeParseSettings(localRaw));

  if (db && userId && localRaw) {
    try {
      await setDoc(
        doc(db, "users", userId, "private", APP_SETTINGS_DOC_ID),
        {
          ...localSettings,
          updatedAt: Date.now(),
          serverUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      // Keep local settings usable even when remote sync is temporarily unavailable.
      console.warn("Could not sync app settings to Firestore:", error);
    }
  }

  return localSettings;
}

export async function saveAppSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized = normalizeAppSettings(settings);
  await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(normalized));

  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const userId = auth?.currentUser?.uid;

  if (db && userId) {
    await setDoc(
      doc(db, "users", userId, "private", APP_SETTINGS_DOC_ID),
      {
        ...normalized,
        updatedAt: Date.now(),
        serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return normalized;
}

export async function clearAppSettings() {
  await AsyncStorage.removeItem(APP_SETTINGS_KEY);
}
