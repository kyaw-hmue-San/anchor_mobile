import AsyncStorage from "@react-native-async-storage/async-storage";
import { Event, Memory, MoodEntry, MoodOption, Snapshot, User } from "../models/types";

const KEYS = {
  user: "anchor:user",
  moods: "anchor:moods",
  snapshot: "anchor:snapshot",
  events: "anchor:events",
  memories: "anchor:memories",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const todayKey = () => new Date().toISOString().slice(0, 10);

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function saveUser(user: User) {
  await setJson(KEYS.user, user);
}

export async function getUser(): Promise<User | null> {
  return getJson<User | null>(KEYS.user, null);
}

export async function setMood(mood: MoodOption, isPartner = false) {
  const moods = await getJson<Record<string, MoodEntry>>(KEYS.moods, {});
  const date = todayKey();
  const entry: MoodEntry = { date, mood, isPartner, updatedAt: Date.now() };
  moods[isPartner ? `partner-${date}` : date] = entry;
  await setJson(KEYS.moods, moods);
}

export async function getMood(date: string = todayKey(), isPartner = false): Promise<MoodEntry | null> {
  const moods = await getJson<Record<string, MoodEntry>>(KEYS.moods, {});
  const key = isPartner ? `partner-${date}` : date;
  return moods[key] ?? null;
}

export async function ensurePartnerMood(): Promise<MoodEntry | null> {
  const existing = await getMood(todayKey(), true);
  if (existing) return existing;
  const fallback: MoodOption[] = ["joyful", "calm", "neutral", "anxious", "low"];
  const pick = fallback[Math.floor(Math.random() * fallback.length)];
  await setMood(pick, true);
  return getMood(todayKey(), true);
}

export async function saveSnapshot(uri: string): Promise<Snapshot> {
  const snapshot: Snapshot = { id: todayKey(), uri, createdAt: Date.now() };
  await setJson(KEYS.snapshot, snapshot);
  return snapshot;
}

export async function getTodaySnapshot(): Promise<Snapshot | null> {
  const snap = await getJson<Snapshot | null>(KEYS.snapshot, null);
  if (!snap) return null;
  const isExpired = Date.now() - snap.createdAt > DAY_MS;
  const isToday = snap.id === todayKey();
  if (isExpired || !isToday) {
    await AsyncStorage.removeItem(KEYS.snapshot);
    return null;
  }
  return snap;
}

export async function listEvents(): Promise<Event[]> {
  const events = await getJson<Event[]>(KEYS.events, []);
  return [...events].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
}

export async function saveEvent(event: Event) {
  const events = await listEvents();
  const idx = events.findIndex(e => e.id === event.id);
  if (idx >= 0) {
    events[idx] = event;
  } else {
    events.push(event);
  }
  await setJson(KEYS.events, events);
}

export async function deleteEvent(id: string) {
  const events = await listEvents();
  await setJson(KEYS.events, events.filter(e => e.id !== id));
}

export async function eventsWithinNext24h(): Promise<Event[]> {
  const events = await listEvents();
  const now = Date.now();
  const next = now + DAY_MS;
  return events.filter(e => {
    const t = new Date(e.dateTime).getTime();
    return e.guardianAlertEnabled && t >= now && t <= next;
  });
}

export async function listMemories(): Promise<Memory[]> {
  return getJson<Memory[]>(KEYS.memories, []);
}

export async function saveMemory(memory: Memory) {
  const memories = await listMemories();
  const idx = memories.findIndex(m => m.id === memory.id);
  if (idx >= 0) {
    memories[idx] = memory;
  } else {
    memories.push(memory);
  }
  await setJson(KEYS.memories, memories);
}

export async function addMemoryFromSnapshot(snapshot: Snapshot) {
  const memory: Memory = {
    id: `snap-${snapshot.id}`,
    title: "Daily Snapshot",
    description: "Saved from today",
    createdAt: snapshot.createdAt,
    type: "snapshot",
    snapshotUri: snapshot.uri,
  };
  await saveMemory(memory);
}

export async function addNoteMemory(title: string, description: string) {
  const memory: Memory = {
    id: `note-${Date.now()}`,
    title,
    description,
    createdAt: Date.now(),
    type: "note",
  };
  await saveMemory(memory);
}

export async function resetAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
