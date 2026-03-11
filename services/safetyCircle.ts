import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { SafetyCircle } from "../models/types";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";

const STORAGE_KEY = "anchor:safety:circle";

const defaultTemplates = [
  "I need help right now. Please call me.",
  "Please check my location and stay on call with me.",
  "Emergency. Contact me as soon as possible.",
];

export const defaultSafetyCircle: SafetyCircle = {
  contacts: [],
  escalationSeconds: 60,
  templates: defaultTemplates,
};

export async function getSafetyCircle(): Promise<SafetyCircle> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const userId = auth?.currentUser?.uid;

  if (db && userId) {
    const snap = await getDoc(doc(db, "users", userId, "private", "safety_circle"));
    if (snap.exists()) {
      const data = snap.data() as Partial<SafetyCircle>;
      const resolved: SafetyCircle = {
        contacts: Array.isArray(data.contacts) ? data.contacts : [],
        escalationSeconds: typeof data.escalationSeconds === "number" ? data.escalationSeconds : 60,
        templates: Array.isArray(data.templates) && data.templates.length ? data.templates : defaultTemplates,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
      return resolved;
    }
  }

  const local = await AsyncStorage.getItem(STORAGE_KEY);
  if (!local) return defaultSafetyCircle;

  try {
    const parsed = JSON.parse(local) as SafetyCircle;
    return {
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      escalationSeconds: typeof parsed.escalationSeconds === "number" ? parsed.escalationSeconds : 60,
      templates: Array.isArray(parsed.templates) && parsed.templates.length ? parsed.templates : defaultTemplates,
    };
  } catch {
    return defaultSafetyCircle;
  }
}

export async function saveSafetyCircle(circle: SafetyCircle): Promise<SafetyCircle> {
  const next: SafetyCircle = {
    contacts: Array.isArray(circle.contacts) ? circle.contacts : [],
    escalationSeconds: Math.max(15, Math.min(600, Math.floor(circle.escalationSeconds || 60))),
    templates: Array.isArray(circle.templates) && circle.templates.length ? circle.templates : defaultTemplates,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const userId = auth?.currentUser?.uid;

  if (db && userId) {
    await setDoc(
      doc(db, "users", userId, "private", "safety_circle"),
      {
        ...next,
        updatedAt: Date.now(),
        serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return next;
}
