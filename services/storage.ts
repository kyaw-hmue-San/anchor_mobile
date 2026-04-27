import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  ActivityItem,
  CoupleGoal,
  Event,
  Memory,
  MemoryTag,
  MoodEntry,
  MoodOption,
  MoodStreakSummary,
  PartnerPresence,
  ReminderWindow,
  SharedLocation,
  SmartReminder,
  Snapshot,
  User,
  WeeklyPlanDay,
} from "../models/types";
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from "./firebase";
import { cancelEventLocalNotifications, scheduleEventLocalNotifications } from "./localNotifications";

const SPACE_KEY = "anchor:space";

const DAY_MS = 24 * 60 * 60 * 1000;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const SUPABASE_STORAGE_BUCKET_RAW = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "snapshots";

const todayKey = () => new Date().toISOString().slice(0, 10);

type Scope = {
  db: ReturnType<typeof getFirebaseDb>;
  userId: string;
  basePath: string[];
  scopeId: string;
};

async function getScope(): Promise<Scope> {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const userId = auth?.currentUser?.uid;

  if (!db || !userId) {
    throw new Error("You must be signed in to use app data");
  }

  const spaceId = await AsyncStorage.getItem(SPACE_KEY);
  if (!spaceId) {
    throw new Error("No active shared space. Create or join a space first.");
  }

  return { db, userId, basePath: ["spaces", spaceId], scopeId: spaceId };
}

function scopeCollection(scope: Scope, collectionName: string) {
  return collection(scope.db!, `${scope.basePath.join("/")}/${collectionName}`);
}

async function getCurrentActorName(scope: Scope) {
  const auth = getFirebaseAuth();
  const explicit = auth?.currentUser?.displayName?.trim();
  if (explicit) return explicit;

  const selfDoc = await getDoc(doc(scope.db!, "users", scope.userId));
  if (selfDoc.exists()) {
    const displayName = (selfDoc.data() as { displayName?: string }).displayName?.trim();
    if (displayName) return displayName;
  }

  return auth?.currentUser?.email?.split("@")[0] || "Partner";
}

async function recordActivity(
  scope: Scope,
  type: ActivityItem["type"],
  message: string,
  targetId?: string
) {
  const actorName = await getCurrentActorName(scope);
  const activityRef = doc(scopeCollection(scope, "activity"));
  const createdAt = Date.now();

  await setDoc(activityRef, {
    id: activityRef.id,
    type,
    actorId: scope.userId,
    actorName,
    targetId: targetId ?? null,
    message,
    createdAt,
    scopeId: scope.scopeId,
    updatedAt: serverTimestamp(),
  });
}

function mapMoodFromData(data: Record<string, unknown>): MoodEntry | null {
  const date = typeof data.date === "string" ? data.date : null;
  const mood = typeof data.mood === "string" ? (data.mood as MoodOption) : null;
  const updatedAt = typeof data.updatedAt === "number" ? data.updatedAt : null;
  const isPartner = typeof data.isPartner === "boolean" ? data.isPartner : undefined;

  if (!date || !mood || !updatedAt) return null;
  return { date, mood, updatedAt, isPartner };
}

function isSupabaseStorageConfigured() {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

function getSupabaseBucketName() {
  const raw = SUPABASE_STORAGE_BUCKET_RAW.replace(/^\/+|\/+$/g, "");
  if (!raw.includes("/")) return raw;

  const publicIndex = raw.lastIndexOf("public/");
  if (publicIndex >= 0) {
    const parsed = raw.slice(publicIndex + "public/".length).split("/")[0]?.trim();
    if (parsed) return parsed;
  }

  return raw.split("/").pop()?.trim() || "snapshots";
}

async function uriToBlob(uri: string): Promise<Blob> {
  try {
    const response = await fetch(uri);
    return await response.blob();
  } catch {
    return await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onerror = () => reject(new Error("Could not read image data."));
      xhr.onload = () => resolve(xhr.response as Blob);
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  }
}

async function uploadSnapshotToSupabase(blob: Blob, objectPath: string): Promise<string> {
  if (!isSupabaseStorageConfigured()) {
    throw new Error("Supabase Storage is not configured.");
  }

  const bucket = getSupabaseBucketName();
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`;
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
      "x-upsert": "true",
      "Content-Type": blob.type || "image/jpeg",
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    const raw = await uploadResponse.text();
    let reason = raw;
    try {
      const parsed = JSON.parse(raw) as { message?: string; error?: string };
      reason = parsed.message || parsed.error || raw;
    } catch {
      // Keep raw response text if it is not valid JSON.
    }

    throw new Error(
      `Supabase upload failed (${uploadResponse.status}): ${reason || "Unknown error"}. ` +
      `Check that bucket '${bucket}' exists and allows INSERT for your anon/public upload flow.`
    );
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
}

async function uploadSnapshotToFirebase(storage: NonNullable<ReturnType<typeof getFirebaseStorage>>, blob: Blob, objectPath: string) {
  const snapshotRef = ref(storage, objectPath);
  await uploadBytes(snapshotRef, blob);
  return await getDownloadURL(snapshotRef);
}

export async function saveUser(user: User) {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const userId = auth?.currentUser?.uid;
  if (!db || !userId) throw new Error("You must be signed in");

  await setDoc(
    doc(db, "users", userId),
    {
      id: user.id,
      displayName: user.displayName,
      partnerCode: user.partnerCode,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUser(): Promise<User | null> {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const userId = auth?.currentUser?.uid;
  if (!db || !userId) return null;

  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;

  const data = snap.data() as Partial<User>;
  if (!data.id || !data.displayName || !data.partnerCode) return null;

  return {
    id: data.id,
    displayName: data.displayName,
    partnerCode: data.partnerCode,
  };
}

export async function setMood(mood: MoodOption, isPartner = false) {
  if (isPartner) return;
  const scope = await getScope();
  const date = todayKey();
  const entry: MoodEntry = { date, mood, isPartner, updatedAt: Date.now() };
  const moodId = `${date}_${scope.userId}`;
  await setDoc(doc(scopeCollection(scope, "moods"), moodId), {
    ...entry,
    userId: scope.userId,
    scopeId: scope.scopeId,
  });

  await recordActivity(scope, "mood-updated", `Updated mood to ${mood}.`, moodId);
}

export async function getMood(date: string = todayKey(), isPartner = false): Promise<MoodEntry | null> {
  const scope = await getScope();

  if (!isPartner) {
    const moodId = `${date}_${scope.userId}`;
    const snap = await getDoc(doc(scopeCollection(scope, "moods"), moodId));
    if (!snap.exists()) return null;
    return mapMoodFromData(snap.data() as Record<string, unknown>);
  }

  if (scope.basePath[0] !== "spaces") return null;

  const moodQuery = query(scopeCollection(scope, "moods"), where("date", "==", date));
  const moodSnaps = await getDocs(moodQuery);
  const partnerDoc = moodSnaps.docs.find(d => (d.data() as { userId?: string }).userId !== scope.userId);
  if (!partnerDoc) return null;
  return mapMoodFromData(partnerDoc.data() as Record<string, unknown>);
}

export async function ensurePartnerMood(): Promise<MoodEntry | null> {
  return getMood(todayKey(), true);
}

export async function subscribeToPartnerMood(
  onChange: (mood: MoodEntry | null) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  const scope = await getScope();

  if (scope.basePath[0] !== "spaces") {
    onChange(null);
    return () => undefined;
  }

  const moodQuery = query(scopeCollection(scope, "moods"), where("date", "==", todayKey()));
  const unsubscribe = onSnapshot(
    moodQuery,
    snapshot => {
      const partnerDoc = snapshot.docs.find(d => (d.data() as { userId?: string }).userId !== scope.userId);
      if (!partnerDoc) {
        onChange(null);
        return;
      }

      onChange(mapMoodFromData(partnerDoc.data() as Record<string, unknown>));
    },
    error => {
      if (onError) {
        onError(error instanceof Error ? error : new Error("Partner mood subscription failed."));
      }
    }
  );

  return unsubscribe;
}

export async function saveSnapshot(uri: string): Promise<Snapshot> {
  const scope = await getScope();
  const id = `${todayKey()}_${scope.userId}`;
  const createdAt = Date.now();

  let uploadedUri = uri;
  const snapshotPath = `${scope.basePath.join("/")}/snapshots/${id}-${createdAt}.jpg`;
  const storage = getFirebaseStorage();
  let blob: Blob | null = null;

  try {
    blob = await uriToBlob(uri);

    const providers: Array<"supabase" | "firebase"> = [];

    // On web, try Supabase first to avoid Firebase CORS preflight issues.
    if (Platform.OS === "web" && isSupabaseStorageConfigured()) {
      providers.push("supabase");
    }
    if (storage) {
      providers.push("firebase");
    }
    if (isSupabaseStorageConfigured() && !providers.includes("supabase")) {
      providers.push("supabase");
    }

    const uploadErrors: string[] = [];
    for (const provider of providers) {
      try {
        if (provider === "supabase") {
          uploadedUri = await uploadSnapshotToSupabase(blob, snapshotPath);
        } else if (storage) {
          uploadedUri = await uploadSnapshotToFirebase(storage, blob, snapshotPath);
        }
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        uploadErrors.push(`${provider}: ${message}`);
      }
    }

    if (providers.length > 0 && uploadedUri === uri) {
      throw new Error(`Snapshot upload failed via all providers. ${uploadErrors.join(" | ")}`);
    }
  } catch (error) {
    throw error;
  } finally {
    const closeableBlob = blob as unknown as { close?: () => void } | null;
    if (closeableBlob && typeof closeableBlob.close === "function") {
      closeableBlob.close();
    }
  }

  const snapshot: Snapshot = { id, uri: uploadedUri, createdAt };
  await setDoc(doc(scopeCollection(scope, "snapshots"), id), {
    ...snapshot,
    userId: scope.userId,
    scopeId: scope.scopeId,
    updatedAt: serverTimestamp(),
  });

  await recordActivity(scope, "snapshot-saved", "Saved a daily snapshot.", id);

  return snapshot;
}

export async function getTodaySnapshot(): Promise<Snapshot | null> {
  const scope = await getScope();
  const id = `${todayKey()}_${scope.userId}`;
  const snapDoc = await getDoc(doc(scopeCollection(scope, "snapshots"), id));
  if (!snapDoc.exists()) return null;

  const data = snapDoc.data() as Partial<Snapshot>;
  const snap: Snapshot | null =
    typeof data.id === "string" && typeof data.uri === "string" && typeof data.createdAt === "number"
      ? { id: data.id, uri: data.uri, createdAt: data.createdAt }
      : null;

  if (!snap) return null;
  const isExpired = Date.now() - snap.createdAt > DAY_MS;
  const isToday = snap.id.startsWith(todayKey());
  if (isExpired || !isToday) {
    await deleteDoc(doc(scopeCollection(scope, "snapshots"), id));
    return null;
  }
  return snap;
}

export async function getPartnerSnapshot(): Promise<Snapshot | null> {
  const scope = await getScope();
  if (scope.basePath[0] !== "spaces") return null;

  const snapshotsSnap = await getDocs(scopeCollection(scope, "snapshots"));
  const latest = snapshotsSnap.docs
    .map(docSnap => docSnap.data() as Partial<Snapshot> & { userId?: string })
    .filter(
      item =>
        typeof item.userId === "string" &&
        item.userId !== scope.userId &&
        typeof item.id === "string" &&
        typeof item.uri === "string" &&
        typeof item.createdAt === "number" &&
        Date.now() - item.createdAt <= DAY_MS
    )
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];

  if (!latest || typeof latest.id !== "string" || typeof latest.uri !== "string" || typeof latest.createdAt !== "number") {
    return null;
  }

  return {
    id: latest.id,
    uri: latest.uri,
    createdAt: latest.createdAt,
  };
}

export async function subscribeToPartnerSnapshot(
  onChange: (snapshot: Snapshot | null) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  const scope = await getScope();

  if (scope.basePath[0] !== "spaces") {
    onChange(null);
    return () => undefined;
  }

  const unsubscribe = onSnapshot(
    scopeCollection(scope, "snapshots"),
    snapshot => {
      const latest = snapshot.docs
        .map(docSnap => docSnap.data() as Partial<Snapshot> & { userId?: string })
        .filter(
          item =>
            typeof item.userId === "string" &&
            item.userId !== scope.userId &&
            typeof item.id === "string" &&
            typeof item.uri === "string" &&
            typeof item.createdAt === "number" &&
            Date.now() - item.createdAt <= DAY_MS
        )
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];

      if (!latest || typeof latest.id !== "string" || typeof latest.uri !== "string" || typeof latest.createdAt !== "number") {
        onChange(null);
        return;
      }

      onChange({
        id: latest.id,
        uri: latest.uri,
        createdAt: latest.createdAt,
      });
    },
    error => {
      if (onError) {
        onError(error instanceof Error ? error : new Error("Partner snapshot subscription failed."));
      }
    }
  );

  return unsubscribe;
}

export async function listEvents(): Promise<Event[]> {
  const scope = await getScope();
  const snaps = await getDocs(scopeCollection(scope, "events"));
  const events = snaps.docs
    .map(docSnap => docSnap.data() as Event)
    .filter(event => typeof event.id === "string" && typeof event.title === "string" && typeof event.dateTime === "string");

  return [...events].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
}

export async function subscribeToEvents(
  onChange: (events: Event[]) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  const scope = await getScope();

  const unsubscribe = onSnapshot(
    scopeCollection(scope, "events"),
    snapshot => {
      const events = snapshot.docs
        .map(docSnap => docSnap.data() as Event)
        .filter(event => typeof event.id === "string" && typeof event.title === "string" && typeof event.dateTime === "string")
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

      onChange(events);
    },
    error => {
      if (onError) {
        onError(error instanceof Error ? error : new Error("Events subscription failed."));
      }
    }
  );

  return unsubscribe;
}

export async function saveEvent(event: Event) {
  const scope = await getScope();
  const eventId = event.id?.trim() || doc(scopeCollection(scope, "events")).id;
  const updatedAt = Date.now();
  const reminderWindows: ReminderWindow[] = event.reminderWindows?.length ? event.reminderWindows : [30, 120, 1440];

  await setDoc(doc(scopeCollection(scope, "events"), eventId), {
    ...event,
    id: eventId,
    reminderWindows,
    updatedAt,
    userId: scope.userId,
    scopeId: scope.scopeId,
    serverUpdatedAt: serverTimestamp(),
  });

  await recordActivity(scope, "event-saved", `Saved event: ${event.title || "Untitled"}.`, eventId);

  await scheduleEventLocalNotifications({
    ...event,
    id: eventId,
    reminderWindows,
  });

  return eventId;
}

export async function confirmEvent(eventId: string) {
  const scope = await getScope();
  const eventRef = doc(scopeCollection(scope, "events"), eventId);
  const snap = await getDoc(eventRef);
  if (!snap.exists()) throw new Error("Event not found");

  const data = snap.data() as Event;
  await setDoc(
    eventRef,
    {
      ...data,
      id: eventId,
      confirmedAt: Date.now(),
      userId: scope.userId,
      scopeId: scope.scopeId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteEvent(id: string) {
  const scope = await getScope();
  await deleteDoc(doc(scopeCollection(scope, "events"), id));
  await cancelEventLocalNotifications(id);
}

export async function subscribeToPartnerEventActivity(
  onChange: (updatedAt: number | null) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  const scope = await getScope();

  if (scope.basePath[0] !== "spaces") {
    onChange(null);
    return () => undefined;
  }

  const unsubscribe = onSnapshot(
    scopeCollection(scope, "events"),
    snapshot => {
      const latest = snapshot.docs
        .map(docSnap => docSnap.data() as { userId?: string; updatedAt?: number })
        .filter(item => item.userId && item.userId !== scope.userId)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];

      onChange(typeof latest?.updatedAt === "number" ? latest.updatedAt : null);
    },
    error => {
      if (onError) {
        onError(error instanceof Error ? error : new Error("Partner event activity subscription failed."));
      }
    }
  );

  return unsubscribe;
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

export async function listSmartReminders(): Promise<SmartReminder[]> {
  const events = await listEvents();
  const now = Date.now();

  const reminders = events.flatMap(event => {
    const eventTime = new Date(event.dateTime).getTime();
    if (Number.isNaN(eventTime) || eventTime <= now) return [];

    const windows = event.reminderWindows?.length ? event.reminderWindows : [30, 120, 1440];
    return windows
      .map(windowMinutes => {
        const dueAt = eventTime - windowMinutes * 60 * 1000;
        if (dueAt > now) return null;
        const requiresGuardianFollowup =
          !!event.guardianAlertEnabled &&
          !event.confirmedAt &&
          (event.category === "trip" || event.category === "date") &&
          eventTime - now <= 2 * 60 * 60 * 1000;

        return {
          event,
          windowMinutes: windowMinutes as ReminderWindow,
          dueAt,
          requiresGuardianFollowup,
        } satisfies SmartReminder;
      })
      .filter((item): item is SmartReminder => !!item);
  });

  return reminders.sort((a, b) => b.dueAt - a.dueAt);
}

export async function listMemories(): Promise<Memory[]> {
  const scope = await getScope();
  const snaps = await getDocs(scopeCollection(scope, "memories"));
  return snaps.docs
    .map(docSnap => docSnap.data() as Memory)
    .filter(memory => typeof memory.id === "string" && typeof memory.title === "string")
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveMemory(memory: Memory) {
  const scope = await getScope();
  await setDoc(doc(scopeCollection(scope, "memories"), memory.id), {
    ...memory,
    userId: scope.userId,
    scopeId: scope.scopeId,
    updatedAt: serverTimestamp(),
  });
}

export async function addMemoryFromSnapshot(snapshot: Snapshot) {
  const memory: Memory = {
    id: `snap-${snapshot.id}`,
    title: "Daily Snapshot",
    description: "Saved from today",
    createdAt: snapshot.createdAt,
    type: "snapshot",
    snapshotUri: snapshot.uri,
    tag: "trip",
  };
  await saveMemory(memory);
}

export async function addNoteMemory(title: string, description: string, tag: MemoryTag = "anniversary") {
  const scope = await getScope();
  const createdAt = Date.now();
  const memory: Memory = {
    id: doc(scopeCollection(scope, "memories")).id,
    title,
    description,
    createdAt,
    type: "note",
    tag,
  };
  await saveMemory(memory);
}

export async function getPartnerPresenceSummary(): Promise<PartnerPresence> {
  const scope = await getScope();
  if (scope.basePath[0] !== "spaces") {
    return { moodUpdatedAt: null, snapshotSavedAt: null, eventUpdatedAt: null };
  }

  const [moodsSnap, snapshotsSnap, eventsSnap] = await Promise.all([
    getDocs(scopeCollection(scope, "moods")),
    getDocs(scopeCollection(scope, "snapshots")),
    getDocs(scopeCollection(scope, "events")),
  ]);

  const partnerMood = moodsSnap.docs
    .map(docSnap => docSnap.data() as { userId?: string; updatedAt?: number })
    .filter(item => item.userId && item.userId !== scope.userId)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];

  const partnerSnapshot = snapshotsSnap.docs
    .map(docSnap => docSnap.data() as { userId?: string; createdAt?: number })
    .filter(item => item.userId && item.userId !== scope.userId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];

  const partnerEvent = eventsSnap.docs
    .map(docSnap => docSnap.data() as { userId?: string; updatedAt?: number })
    .filter(item => item.userId && item.userId !== scope.userId)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];

  return {
    moodUpdatedAt: partnerMood?.updatedAt ?? null,
    snapshotSavedAt: partnerSnapshot?.createdAt ?? null,
    eventUpdatedAt: partnerEvent?.updatedAt ?? null,
  };
}

export async function getMoodStreakSummary(): Promise<MoodStreakSummary> {
  const scope = await getScope();
  const moods = await getDocs(scopeCollection(scope, "moods"));
  const myDays = moods.docs
    .map(docSnap => docSnap.data() as { userId?: string; date?: string })
    .filter(item => item.userId === scope.userId && typeof item.date === "string")
    .map(item => item.date as string);

  const unique = Array.from(new Set(myDays));
  const today = todayKey();
  const sevenDaysAgo = Date.now() - 6 * DAY_MS;
  const weeklyCheckins = unique.filter(day => {
    const t = new Date(`${day}T00:00:00`).getTime();
    return !Number.isNaN(t) && t >= sevenDaysAgo;
  }).length;

  let streakDays = 0;
  let cursor = new Date(`${today}T00:00:00`).getTime();
  const set = new Set(unique);

  while (true) {
    const key = new Date(cursor).toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streakDays += 1;
    cursor -= DAY_MS;
  }

  const missedToday = !set.has(today);
  return { streakDays, weeklyCheckins, missedToday };
}

export async function getWeeklyPlan(): Promise<WeeklyPlanDay[]> {
  const events = await listEvents();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const days: WeeklyPlanDay[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(now.getTime() + offset * DAY_MS);
    const dayKey = day.toISOString().slice(0, 10);

    const dayEvents = events.filter(evt => {
      const ts = new Date(evt.dateTime).getTime();
      if (Number.isNaN(ts)) return false;
      const evtKey = new Date(ts).toISOString().slice(0, 10);
      return evtKey === dayKey;
    });

    const conflicts: Array<{ firstEventId: string; secondEventId: string }> = [];
    const sorted = [...dayEvents].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const first = sorted[i];
      const second = sorted[i + 1];
      const delta = Math.abs(new Date(second.dateTime).getTime() - new Date(first.dateTime).getTime());
      if (delta <= 60 * 60 * 1000) {
        conflicts.push({ firstEventId: first.id, secondEventId: second.id });
      }
    }

    const hasEvening = sorted.some(evt => {
      const h = new Date(evt.dateTime).getHours();
      return h >= 18 && h <= 21;
    });
    const hasMorning = sorted.some(evt => {
      const h = new Date(evt.dateTime).getHours();
      return h >= 8 && h <= 11;
    });

    const suggestedBlocks: string[] = [];
    if (!hasMorning) suggestedBlocks.push("08:30 - 09:30 Focus call");
    if (!hasEvening) suggestedBlocks.push("19:00 - 20:00 Quality time");

    days.push({ date: dayKey, events: sorted, suggestedBlocks, conflicts });
  }

  return days;
}

export async function listActivityFeed(limit = 20): Promise<ActivityItem[]> {
  const scope = await getScope();
  const snap = await getDocs(scopeCollection(scope, "activity"));
  const items = snap.docs
    .map(docSnap => docSnap.data() as ActivityItem)
    .filter(item => typeof item.id === "string" && typeof item.createdAt === "number")
    .sort((a, b) => b.createdAt - a.createdAt);

  return items.slice(0, Math.max(1, limit));
}

export async function listCoupleGoals(): Promise<CoupleGoal[]> {
  const scope = await getScope();
  const snap = await getDocs(scopeCollection(scope, "goals"));
  return snap.docs
    .map(docSnap => docSnap.data() as CoupleGoal)
    .filter(item => typeof item.id === "string" && typeof item.title === "string")
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function upsertCoupleGoal(goal: Omit<CoupleGoal, "id" | "createdAt" | "updatedAt" | "completed"> & { id?: string }) {
  const scope = await getScope();
  const goalId = goal.id?.trim() || doc(scopeCollection(scope, "goals")).id;
  const now = Date.now();
  const next: CoupleGoal = {
    id: goalId,
    title: goal.title,
    type: goal.type,
    target: Math.max(1, goal.target),
    progress: Math.max(0, goal.progress),
    completed: goal.progress >= goal.target,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(
    doc(scopeCollection(scope, "goals"), goalId),
    {
      ...next,
      userId: scope.userId,
      scopeId: scope.scopeId,
      serverUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return goalId;
}

export async function updateGoalProgress(goalId: string, progress: number) {
  const scope = await getScope();
  const ref = doc(scopeCollection(scope, "goals"), goalId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Goal not found");
  const goal = snap.data() as CoupleGoal;
  const nextProgress = Math.max(0, progress);

  await setDoc(
    ref,
    {
      ...goal,
      progress: nextProgress,
      completed: nextProgress >= goal.target,
      updatedAt: Date.now(),
      userId: scope.userId,
      scopeId: scope.scopeId,
      serverUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getPartnerDisplayName(): Promise<string | null> {
  const scope = await getScope();
  if (scope.basePath[0] !== "spaces") return null;

  const membersSnap = await getDocs(collection(scope.db!, `${scope.basePath.join("/")}/members`));
  const partner = membersSnap.docs
    .map(docSnap => docSnap.data() as { userId?: string; displayName?: string; email?: string })
    .find(member => typeof member.userId === "string" && member.userId !== scope.userId);

  if (!partner) return null;

  if (typeof partner.displayName === "string" && partner.displayName.trim()) {
    return partner.displayName.trim();
  }

  if (typeof partner.email === "string" && partner.email.includes("@")) {
    return partner.email.split("@")[0] || null;
  }

  return "Partner";
}

export async function saveMyLocation(latitude: number, longitude: number, accuracy?: number | null) {
  const scope = await getScope();
  const now = Date.now();
  const ref = doc(scopeCollection(scope, "locations"), scope.userId);

  await setDoc(
    ref,
    {
      userId: scope.userId,
      latitude,
      longitude,
      accuracy: accuracy ?? null,
      updatedAt: now,
      scopeId: scope.scopeId,
      serverUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getPartnerLocation(): Promise<SharedLocation | null> {
  const scope = await getScope();
  const locationsSnap = await getDocs(scopeCollection(scope, "locations"));

  const partner = locationsSnap.docs
    .map(docSnap => docSnap.data() as Partial<SharedLocation>)
    .find(item => typeof item.userId === "string" && item.userId !== scope.userId);

  if (!partner) return null;
  if (typeof partner.latitude !== "number" || typeof partner.longitude !== "number" || typeof partner.updatedAt !== "number") {
    return null;
  }

  return {
    userId: partner.userId as string,
    latitude: partner.latitude,
    longitude: partner.longitude,
    accuracy: typeof partner.accuracy === "number" ? partner.accuracy : null,
    updatedAt: partner.updatedAt,
  };
}

export async function subscribeToPartnerLocation(
  onChange: (location: SharedLocation | null) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  const scope = await getScope();

  if (scope.basePath[0] !== "spaces") {
    onChange(null);
    return () => undefined;
  }

  const unsubscribe = onSnapshot(
    scopeCollection(scope, "locations"),
    snapshot => {
      const partner = snapshot.docs
        .map(docSnap => docSnap.data() as Partial<SharedLocation>)
        .find(item => typeof item.userId === "string" && item.userId !== scope.userId);

      if (!partner) {
        onChange(null);
        return;
      }

      if (typeof partner.latitude !== "number" || typeof partner.longitude !== "number" || typeof partner.updatedAt !== "number") {
        onChange(null);
        return;
      }

      onChange({
        userId: partner.userId as string,
        latitude: partner.latitude,
        longitude: partner.longitude,
        accuracy: typeof partner.accuracy === "number" ? partner.accuracy : null,
        updatedAt: partner.updatedAt,
      });
    },
    error => {
      if (onError) {
        onError(error instanceof Error ? error : new Error("Partner location subscription failed."));
      }
    }
  );

  return unsubscribe;
}

export async function resetAll() {
  const auth = getFirebaseAuth();
  const userId = auth?.currentUser?.uid;

  if (userId) {
    const scope = await getScope();
    const collectionNames = ["moods", "events", "memories", "snapshots"];

    await Promise.all(
      collectionNames.map(async name => {
        const docs = await getDocs(scopeCollection(scope, name));
        await Promise.all(docs.docs.map(item => deleteDoc(item.ref)));
      })
    );
  }

  await AsyncStorage.multiRemove([SPACE_KEY]);
}
