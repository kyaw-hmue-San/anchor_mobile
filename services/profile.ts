import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from "./firebase";

const PROFILE_NAME_KEY = "anchor:profile:name";
const PROFILE_PHOTO_KEY = "anchor:profile:photo";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const SUPABASE_PROFILE_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_PROFILE_BUCKET?.trim() || "snapshots";

function isSupabaseConfigured() {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

function resolveSupabaseBucketName(rawBucket: string) {
  const raw = rawBucket.replace(/^\/+|\/+$/g, "");
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
    if (!response.ok) {
      throw new Error(`Image read failed with status ${response.status}`);
    }
    return await response.blob();
  } catch {
    return await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onerror = () => reject(new Error("Could not read the selected image. Please try another photo."));
      xhr.onload = () => resolve(xhr.response as Blob);
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  }
}

async function uploadToFirebase(storage: NonNullable<ReturnType<typeof getFirebaseStorage>>, objectPath: string, blob: Blob) {
  const objectRef = ref(storage, objectPath);
  await uploadBytes(objectRef, blob);
  return await getDownloadURL(objectRef);
}

async function uploadToSupabase(objectPath: string, blob: Blob) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const bucket = resolveSupabaseBucketName(SUPABASE_PROFILE_BUCKET);
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
      "x-upsert": "true",
      "Content-Type": blob.type || "image/jpeg",
    },
    body: blob,
  });

  if (!response.ok) {
    const raw = await response.text();
    let reason = raw;
    try {
      const parsed = JSON.parse(raw) as { message?: string; error?: string };
      reason = parsed.message || parsed.error || raw;
    } catch {
      // Keep raw text when JSON parse fails.
    }

    throw new Error(
      `Supabase profile upload failed (${response.status}): ${reason || "Unknown error"}. ` +
      `Check bucket '${bucket}' and INSERT policy for anon role.`
    );
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
}

export async function getProfileName() {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const userId = auth?.currentUser?.uid;

  if (db && userId) {
    const profileSnap = await getDoc(doc(db, "users", userId));
    if (profileSnap.exists()) {
      const data = profileSnap.data() as { displayName?: string };
      if (data.displayName?.trim()) {
        await AsyncStorage.setItem(PROFILE_NAME_KEY, data.displayName.trim());
        return data.displayName.trim();
      }
    }
  }

  const value = await AsyncStorage.getItem(PROFILE_NAME_KEY);
  if (value?.trim()) return value.trim();

  const fallback = auth?.currentUser?.displayName?.trim() || auth?.currentUser?.email?.split("@")[0] || "";
  return fallback;
}

export async function saveProfileName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Display name cannot be empty");
  await AsyncStorage.setItem(PROFILE_NAME_KEY, trimmed);

  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!db || !user?.uid) return;

  await setDoc(
    doc(db, "users", user.uid),
    {
      id: user.uid,
      email: user.email ?? null,
      displayName: trimmed,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getProfilePhotoUrl() {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  const userId = user?.uid;

  if (db && userId) {
    const profileSnap = await getDoc(doc(db, "users", userId));
    if (profileSnap.exists()) {
      const data = profileSnap.data() as { photoURL?: string };
      if (data.photoURL?.trim()) {
        await AsyncStorage.setItem(PROFILE_PHOTO_KEY, data.photoURL.trim());
        return data.photoURL.trim();
      }
    }
  }

  const cached = await AsyncStorage.getItem(PROFILE_PHOTO_KEY);
  if (cached?.trim()) return cached.trim();

  const fallback = user?.photoURL?.trim() || "";
  return fallback;
}

export async function saveProfilePhoto(localUri: string) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const storage = getFirebaseStorage();
  const user = auth?.currentUser;

  if (!user?.uid) throw new Error("Not signed in");
  if (!db) throw new Error("Firebase database is unavailable");
  if (!localUri?.trim()) throw new Error("Invalid image");

  const objectPath = `users/${user.uid}/private/snapshots/profile-${Date.now()}.jpg`;
  const blob = await uriToBlob(localUri);

  const providers: Array<"supabase" | "firebase"> = [];
  if (Platform.OS === "web" && isSupabaseConfigured()) {
    providers.push("supabase");
  }
  if (storage) {
    providers.push("firebase");
  }
  if (isSupabaseConfigured() && !providers.includes("supabase")) {
    providers.push("supabase");
  }

  if (!providers.length) {
    throw new Error("No upload provider available. Configure Firebase Storage or Supabase credentials.");
  }

  let photoURL = "";
  const uploadErrors: string[] = [];

  for (const provider of providers) {
    try {
      if (provider === "firebase" && storage) {
        photoURL = await uploadToFirebase(storage, objectPath, blob);
      } else if (provider === "supabase") {
        photoURL = await uploadToSupabase(objectPath, blob);
      }

      if (photoURL) break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      uploadErrors.push(`${provider}: ${message}`);
    }
  }

  if (!photoURL) {
    throw new Error(`Profile photo upload failed via all providers. ${uploadErrors.join(" | ")}`);
  }

  const closeableBlob = blob as unknown as { close?: () => void };
  if (typeof closeableBlob.close === "function") {
    closeableBlob.close();
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      id: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await AsyncStorage.setItem(PROFILE_PHOTO_KEY, photoURL);
  return photoURL;
}

export async function clearProfilePhoto() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const user = auth?.currentUser;

  await AsyncStorage.removeItem(PROFILE_PHOTO_KEY);

  if (!user?.uid || !db) return;

  await setDoc(
    doc(db, "users", user.uid),
    {
      id: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
