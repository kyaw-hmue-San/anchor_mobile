import { collection, doc, getDoc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";
import { toFriendlyError } from "./firebaseErrors";

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function generatePairingCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createSpaceRecord(userId: string, name: string) {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  if (!db) throw new Error("Firebase database is unavailable");

  const currentUserId = auth?.currentUser?.uid;
  if (!currentUserId) throw new Error("Not signed in. Please sign in again.");
  if (currentUserId !== userId) throw new Error("Session mismatch. Please sign out and sign in again.");

  const displayName = auth?.currentUser?.displayName || auth?.currentUser?.email?.split("@")[0] || "User";
  const email = auth?.currentUser?.email || null;

  const spaceRef = doc(collection(db, "spaces"));
  const memberRef = doc(db, "spaces", spaceRef.id, "members", currentUserId);

  try {
    await runTransaction(db, async transaction => {
      transaction.set(spaceRef, {
        name: name.trim() || "Shared Space",
        ownerId: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      transaction.set(memberRef, {
        userId: currentUserId,
        role: "owner",
        displayName,
        email,
        joinedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    throw toFriendlyError(error, "Could not create space");
  }

  return {
    spaceId: spaceRef.id,
    spaceName: name.trim() || "Shared Space",
  };
}

export async function createPairingCodeRecord(spaceId: string, createdBy: string, ttlMinutes = 15) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase database is unavailable");

  const code = generatePairingCode();
  const normalized = normalizeCode(code);
  const expiresAt = Date.now() + ttlMinutes * 60_000;

  try {
    await setDoc(doc(db, "pairing_codes", normalized), {
      code: normalized,
      spaceId,
      createdBy,
      createdAt: serverTimestamp(),
      expiresAt,
      used: false,
    });
  } catch (error) {
    throw toFriendlyError(error, "Could not create pairing code");
  }

  return normalized;
}

export async function joinSpaceWithCodeRecord(userId: string, code: string) {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  if (!db) throw new Error("Firebase database is unavailable");

  const currentUserId = auth?.currentUser?.uid;
  if (!currentUserId) throw new Error("Not signed in. Please sign in again.");
  if (currentUserId !== userId) throw new Error("Session mismatch. Please sign out and sign in again.");

  const displayName = auth?.currentUser?.displayName || auth?.currentUser?.email?.split("@")[0] || "User";
  const email = auth?.currentUser?.email || null;

  const normalizedCode = normalizeCode(code);
  const codeRef = doc(db, "pairing_codes", normalizedCode);

  const spaceId = await runTransaction(db, async transaction => {
    const codeSnap = await transaction.get(codeRef);
    if (!codeSnap.exists()) throw new Error("Invalid pairing code");

    const data = codeSnap.data() as {
      spaceId?: string;
      used?: boolean;
      expiresAt?: number;
    };

    if (!data.spaceId) throw new Error("Pairing code has no target space");
    if (data.used) throw new Error("Pairing code already used");
    if (!data.expiresAt || data.expiresAt <= Date.now()) throw new Error("Pairing code expired");

    const memberRef = doc(db, "spaces", data.spaceId, "members", currentUserId);
    transaction.set(
      memberRef,
      {
        userId: currentUserId,
        role: "member",
        displayName,
        email,
        joinedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.update(codeRef, {
      used: true,
      usedBy: currentUserId,
      usedAt: serverTimestamp(),
    });

    return data.spaceId;
  }).catch(error => {
    throw toFriendlyError(error, "Could not join space");
  });

  const spaceSnap = await getDoc(doc(db, "spaces", spaceId));
  const spaceData = spaceSnap.exists() ? (spaceSnap.data() as { name?: string }) : null;

  return {
    spaceId,
    spaceName: spaceData?.name?.trim() || "Shared Space",
  };
}

export async function checkSpaceMembership(spaceId: string, userId: string) {
  const db = getFirebaseDb();
  if (!db) return false;

  const memberRef = doc(db, "spaces", spaceId, "members", userId);
  const snap = await getDoc(memberRef);
  return snap.exists();
}
