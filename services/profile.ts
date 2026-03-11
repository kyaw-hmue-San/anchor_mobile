import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from "./firebase";

const PROFILE_NAME_KEY = "anchor:profile:name";
const PROFILE_PHOTO_KEY = "anchor:profile:photo";

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
  if (!storage) throw new Error("Firebase storage is unavailable");
  if (!db) throw new Error("Firebase database is unavailable");
  if (!localUri?.trim()) throw new Error("Invalid image");

  const blob = await fetch(localUri).then(res => res.blob());
  const objectPath = `users/${user.uid}/private/snapshots/profile-${Date.now()}.jpg`;
  const objectRef = ref(storage, objectPath);
  await uploadBytes(objectRef, blob);
  const photoURL = await getDownloadURL(objectRef);

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
