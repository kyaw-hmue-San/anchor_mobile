import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseConfigError, getFirebaseDb, isFirebaseConfigured } from "../services/firebase";
import {
  checkSpaceMembership,
  createPairingCodeRecord,
  createSpaceRecord,
  joinSpaceWithCodeRecord,
} from "../services/spaces";

const SPACE_KEY = "anchor:space";

type SpaceMode = "couple";
type AppSession = { user: { id: string; email: string } };

function toSession(user: User | null): AppSession | null {
  if (!user?.uid || !user.email) return null;
  return { user: { id: user.uid, email: user.email } };
}

interface SpaceContextValue {
  loading: boolean;
  startupIssue: string | null;
  session: AppSession | null;
  userId: string | null;
  mode: SpaceMode;
  activeSpaceId: string | null;
  spaceMemberCount: number;
  isCoupleConnected: boolean;
  setCoupleMode: () => Promise<Error | null>;
  signIn: (email: string, password: string) => Promise<Error | null>;
  signUp: (email: string, password: string) => Promise<Error | null>;
  signOut: () => Promise<void>;
  createSpace: (name: string) => Promise<{ spaceId?: string; error?: Error | null }>;
  joinWithCode: (code: string) => Promise<{ spaceId?: string; error?: Error | null }>;
  generateCode: (spaceId: string, ttlMinutes?: number) => Promise<{ code?: string; error?: Error | null }>;
  retrySessionBootstrap: () => Promise<void>;
}

const SpaceContext = createContext<SpaceContextValue | undefined>(undefined);

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [mode, setMode] = useState<SpaceMode>("couple");
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [spaceMemberCount, setSpaceMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startupIssue, setStartupIssue] = useState<string | null>(null);
  const [bootstrapVersion, setBootstrapVersion] = useState(0);

  const userId = session?.user?.id ?? null;

  const persist = useCallback(async (spaceId: string | null) => {
    setMode("couple");
    setActiveSpaceId(spaceId);
    await AsyncStorage.setItem(SPACE_KEY, spaceId ?? "");
  }, []);

  const retrySessionBootstrap = useCallback(async () => {
    setLoading(true);
    setStartupIssue(null);
    setBootstrapVersion(prev => prev + 1);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const init = async () => {
      const storedSpace = await AsyncStorage.getItem(SPACE_KEY);
      if (!isMounted) return;
      setMode("couple");
      setActiveSpaceId(storedSpace || null);
      setStartupIssue(null);

      if (!isFirebaseConfigured()) {
        setStartupIssue(getFirebaseConfigError() || "Firebase is not configured.");
        setSession(null);
        setLoading(false);
        return;
      }

      const auth = getFirebaseAuth();
      if (!auth) {
        setStartupIssue("Auth service is unavailable right now.");
        setSession(null);
        setLoading(false);
        return;
      }

      unsubscribe = onAuthStateChanged(
        auth,
        user => {
          setSession(toSession(user));
          setStartupIssue(null);
          setLoading(false);
        },
        error => {
          const message = error instanceof Error ? error.message : "Session could not be restored.";
          const normalized = /network|offline|failed|unavailable/i.test(message)
            ? "Network looks offline. Check your internet and try again."
            : message;
          setStartupIssue(normalized);
          setSession(null);
          setLoading(false);
        }
      );
    };

    init();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [bootstrapVersion]);

  const setCoupleMode = useCallback(async () => {
    if (!activeSpaceId) return new Error("Create or join a space first");
    if (!userId) return new Error("Sign in to use couple mode");

    try {
      const isMember = await checkSpaceMembership(activeSpaceId, userId);
      if (!isMember) return new Error("You are not a member of the active space");
      await persist(activeSpaceId);
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Could not switch to couple mode");
    }
  }, [activeSpaceId, persist, userId]);

  useEffect(() => {
    if (!isFirebaseConfigured() || mode !== "couple" || !activeSpaceId) {
      setSpaceMemberCount(0);
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      setSpaceMemberCount(0);
      return;
    }

    const membersRef = collection(db, "spaces", activeSpaceId, "members");
    const unsubscribe = onSnapshot(
      membersRef,
      snapshot => {
        setSpaceMemberCount(snapshot.size);
      },
      () => {
        setSpaceMemberCount(0);
      }
    );

    return unsubscribe;
  }, [activeSpaceId, mode]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) return new Error("Email and password are required");
    const configErr = getFirebaseConfigError();
    if (configErr) return new Error(configErr);
    const auth = getFirebaseAuth();
    if (!auth) return new Error("Firebase auth is unavailable");
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Unable to sign in");
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) return new Error("Email and password are required");
    const configErr = getFirebaseConfigError();
    if (configErr) return new Error(configErr);
    const auth = getFirebaseAuth();
    if (!auth) return new Error("Firebase auth is unavailable");
    try {
      await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Unable to create account");
    }
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      if (auth) {
        await firebaseSignOut(auth);
      }
    }
    await persist(null);
  }, [persist]);

  const createSpace = useCallback(
    async (name: string) => {
      if (!userId) return { error: new Error("Not signed in") };
      try {
        const spaceId = await createSpaceRecord(userId, name);
        await persist(spaceId);
        return { spaceId };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error("Could not create space") };
      }
    },
    [persist, userId]
  );

  const joinWithCode = useCallback(
    async (code: string) => {
      if (!userId) return { error: new Error("Not signed in") };
      try {
        const spaceId = await joinSpaceWithCodeRecord(userId, code);
        await persist(spaceId);
        return { spaceId };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error("Invalid or expired pairing code") };
      }
    },
    [persist, userId]
  );

  const generateCode = useCallback(
    async (spaceId: string, ttlMinutes = 15) => {
      if (!spaceId) return { error: new Error("No active space") };
      if (!userId) return { error: new Error("Not signed in") };

      try {
        const isMember = await checkSpaceMembership(spaceId, userId);
        if (!isMember) return { error: new Error("You are not a member of this space") };

        const code = await createPairingCodeRecord(spaceId, userId, ttlMinutes);
        return { code, error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error("Could not generate code") };
      }
    },
    [userId]
  );

  const value: SpaceContextValue = {
    loading,
    startupIssue,
    session,
    userId,
    mode,
    activeSpaceId,
    spaceMemberCount,
    isCoupleConnected: mode === "couple" && !!activeSpaceId && spaceMemberCount >= 2,
    setCoupleMode,
    signIn,
    signUp,
    signOut,
    createSpace,
    joinWithCode,
    generateCode,
    retrySessionBootstrap,
  };

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}

export function useSpace() {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error("useSpace must be used within SpaceProvider");
  return ctx;
}
