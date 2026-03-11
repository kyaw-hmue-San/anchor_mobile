import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteUser } from "firebase/auth";
import { collection, collectionGroup, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";
import { clearQuickPin } from "./quickPin";

const LOCAL_PREFIX = "anchor:";
const APP_SETTINGS_KEY = "app_settings";

async function removeDocsFromCollectionPath(path: string) {
  const db = getFirebaseDb();
  if (!db) return;
  const snap = await getDocs(collection(db, path));
  await Promise.all(snap.docs.map(item => deleteDoc(item.ref)));
}

export async function clearLocalCache() {
  const allKeys = await AsyncStorage.getAllKeys();
  const scopedKeys = allKeys.filter(key => key.startsWith(LOCAL_PREFIX) || key === APP_SETTINGS_KEY);
  if (scopedKeys.length) {
    await AsyncStorage.multiRemove(scopedKeys);
  }
}

export async function deleteCurrentAccountData() {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const userId = auth?.currentUser?.uid;
  if (!db || !userId) throw new Error("You must be signed in.");

  const privatePaths = ["moods", "events", "memories", "snapshots", "activity", "goals"];
  await Promise.all(privatePaths.map(name => removeDocsFromCollectionPath(`users/${userId}/private/${name}`)));

  const memberSnap = await getDocs(query(collectionGroup(db, "members"), where("userId", "==", userId)));
  const spaceIds = memberSnap.docs.map(item => item.ref.parent.parent?.id).filter((id): id is string => !!id);

  await Promise.all(memberSnap.docs.map(item => deleteDoc(item.ref)));

  const scopedCollections = ["moods", "events", "memories", "snapshots", "activity", "goals"];
  await Promise.all(
    spaceIds.flatMap(spaceId =>
      scopedCollections.map(async collectionName => {
        const scoped = await getDocs(query(collection(db, `spaces/${spaceId}/${collectionName}`), where("userId", "==", userId)));
        await Promise.all(scoped.docs.map(item => deleteDoc(item.ref)));
      })
    )
  );

  const [createdCodes, usedCodes] = await Promise.all([
    getDocs(query(collection(db, "pairing_codes"), where("createdBy", "==", userId))),
    getDocs(query(collection(db, "pairing_codes"), where("usedBy", "==", userId))),
  ]);
  const uniqueCodeRefs = new Map<string, ReturnType<typeof doc>>();
  createdCodes.docs.forEach(item => uniqueCodeRefs.set(item.ref.path, item.ref));
  usedCodes.docs.forEach(item => uniqueCodeRefs.set(item.ref.path, item.ref));
  await Promise.all(Array.from(uniqueCodeRefs.values()).map(itemRef => deleteDoc(itemRef)));

  await deleteDoc(doc(db, "users", userId));
  await clearQuickPin(userId);
  await clearLocalCache();
}

export async function deleteCurrentAccount() {
  const auth = getFirebaseAuth();
  const userId = auth?.currentUser?.uid;
  if (!auth?.currentUser || !userId) throw new Error("You must be signed in.");

  await deleteCurrentAccountData();
  await deleteUser(auth.currentUser);
}
