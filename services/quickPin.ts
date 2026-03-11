import AsyncStorage from "@react-native-async-storage/async-storage";

const QUICK_PIN_PREFIX = "anchor:quick-pin:";
const QUICK_PIN_META_PREFIX = "anchor:quick-pin-meta:";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 2 * 60 * 1000;

type QuickPinMeta = {
  failedAttempts: number;
  lockedUntil: number;
};

type QuickPinVerifyResult =
  | { ok: true }
  | { ok: false; reason: "locked"; remainingMs: number }
  | { ok: false; reason: "invalid"; attemptsLeft: number; remainingMs?: number };

function quickPinKey(userId: string) {
  return `${QUICK_PIN_PREFIX}${userId}`;
}

function quickPinMetaKey(userId: string) {
  return `${QUICK_PIN_META_PREFIX}${userId}`;
}

function parseMeta(raw: string | null): QuickPinMeta {
  if (!raw) {
    return { failedAttempts: 0, lockedUntil: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<QuickPinMeta>;
    return {
      failedAttempts: typeof parsed.failedAttempts === "number" ? parsed.failedAttempts : 0,
      lockedUntil: typeof parsed.lockedUntil === "number" ? parsed.lockedUntil : 0,
    };
  } catch {
    return { failedAttempts: 0, lockedUntil: 0 };
  }
}

async function getMeta(userId: string): Promise<QuickPinMeta> {
  if (!userId) return { failedAttempts: 0, lockedUntil: 0 };
  const raw = await AsyncStorage.getItem(quickPinMetaKey(userId));
  return parseMeta(raw);
}

async function setMeta(userId: string, meta: QuickPinMeta) {
  if (!userId) return;
  await AsyncStorage.setItem(quickPinMetaKey(userId), JSON.stringify(meta));
}

async function resetMeta(userId: string) {
  if (!userId) return;
  await AsyncStorage.removeItem(quickPinMetaKey(userId));
}

export function isQuickPinFormatValid(pin: string) {
  return /^\d{4,6}$/.test(pin.trim());
}

export async function hasQuickPin(userId: string) {
  if (!userId) return false;
  const value = await AsyncStorage.getItem(quickPinKey(userId));
  return !!value;
}

export async function saveQuickPin(userId: string, pin: string) {
  if (!userId) throw new Error("Missing user id");
  const normalized = pin.trim();
  if (!isQuickPinFormatValid(normalized)) {
    throw new Error("PIN must be 4 to 6 digits");
  }
  await AsyncStorage.setItem(quickPinKey(userId), normalized);
  await resetMeta(userId);
}

export async function verifyQuickPin(userId: string, pin: string) {
  if (!userId) return false;
  const stored = await AsyncStorage.getItem(quickPinKey(userId));
  if (!stored) return false;
  return stored === pin.trim();
}

export async function getQuickPinLockStatus(userId: string) {
  if (!userId) return { isLocked: false, remainingMs: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };

  const now = Date.now();
  const meta = await getMeta(userId);
  const remainingMs = Math.max(0, meta.lockedUntil - now);

  return {
    isLocked: remainingMs > 0,
    remainingMs,
    attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - meta.failedAttempts),
  };
}

export async function verifyQuickPinWithLockout(userId: string, pin: string): Promise<QuickPinVerifyResult> {
  if (!userId) return { ok: false, reason: "invalid", attemptsLeft: 0 };

  const now = Date.now();
  const meta = await getMeta(userId);
  const lockRemaining = Math.max(0, meta.lockedUntil - now);

  if (lockRemaining > 0) {
    return { ok: false, reason: "locked", remainingMs: lockRemaining };
  }

  const stored = await AsyncStorage.getItem(quickPinKey(userId));
  if (!stored) {
    return { ok: false, reason: "invalid", attemptsLeft: 0 };
  }

  if (stored === pin.trim()) {
    await resetMeta(userId);
    return { ok: true };
  }

  const failedAttempts = meta.failedAttempts + 1;
  const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
  const lockedUntil = shouldLock ? now + LOCKOUT_MS : 0;
  await setMeta(userId, { failedAttempts, lockedUntil });

  if (shouldLock) {
    return {
      ok: false,
      reason: "locked",
      remainingMs: LOCKOUT_MS,
    };
  }

  return {
    ok: false,
    reason: "invalid",
    attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts),
  };
}

export async function clearQuickPin(userId: string) {
  if (!userId) return;
  await AsyncStorage.multiRemove([quickPinKey(userId), quickPinMetaKey(userId)]);
}
