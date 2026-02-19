import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MODE_KEY = "anchor:mode";
const SPACE_KEY = "anchor:space";
const SESSION_KEY = "anchor:session";

type SpaceMode = "solo" | "couple";
type MockSession = { user: { id: string; email: string } };
type PairingCode = { code: string; spaceId: string; expiresAt: number; used: boolean };

interface SpaceContextValue {
  loading: boolean;
  session: MockSession | null;
  userId: string | null;
  mode: SpaceMode;
  activeSpaceId: string | null;
  setSoloMode: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<Error | null>;
  signUp: (email: string, password: string) => Promise<Error | null>;
  signOut: () => Promise<void>;
  createSpace: (name: string) => Promise<{ spaceId?: string; error?: Error | null }>;
  joinWithCode: (code: string) => Promise<{ spaceId?: string; error?: Error | null }>;
  generateCode: (spaceId: string, ttlMinutes?: number) => Promise<{ code?: string; error?: Error | null }>;
}

const SpaceContext = createContext<SpaceContextValue | undefined>(undefined);

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MockSession | null>(null);
  const [mode, setMode] = useState<SpaceMode>("solo");
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [pairingCodes, setPairingCodes] = useState<PairingCode[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id ?? null;

  const persist = useCallback(async (nextMode: SpaceMode, spaceId: string | null) => {
    setMode(nextMode);
    setActiveSpaceId(spaceId);
    await AsyncStorage.multiSet([
      [MODE_KEY, nextMode],
      [SPACE_KEY, spaceId ?? ""],
    ]);
  }, []);

  useEffect(() => {
    const init = async () => {
      const [[, storedMode], [, storedSpace], [, storedSession]] = await AsyncStorage.multiGet([MODE_KEY, SPACE_KEY, SESSION_KEY]);
      setMode((storedMode as SpaceMode) || "solo");
      setActiveSpaceId(storedSpace || null);
      if (storedSession) {
        try {
          setSession(JSON.parse(storedSession) as MockSession);
        } catch {
          setSession(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const setSoloMode = useCallback(async () => {
    await persist("solo", null);
  }, [persist]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) return new Error("Email and password are required");
    const nextSession: MockSession = {
      user: { id: `user-${Date.now()}`, email: email.trim().toLowerCase() },
    };
    setSession(nextSession);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) return new Error("Email and password are required");
    return null;
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    await AsyncStorage.removeItem(SESSION_KEY);
    await persist("solo", null);
  }, [persist]);

  const createSpace = useCallback(
    async (name: string) => {
      if (!userId) return { error: new Error("Not signed in") };
      const spaceId = `space-${Date.now()}`;
      await persist("couple", spaceId);
      return { spaceId };
    },
    [persist, userId]
  );

  const joinWithCode = useCallback(
    async (code: string) => {
      if (!userId) return { error: new Error("Not signed in") };
      const found = pairingCodes.find(item => item.code === code && !item.used && item.expiresAt > Date.now());
      if (!found) return { error: new Error("Invalid or expired pairing code") };
      setPairingCodes(prev => prev.map(item => (item.code === code ? { ...item, used: true } : item)));
      await persist("couple", found.spaceId);
      return { spaceId: found.spaceId };
    },
    [pairingCodes, persist, userId]
  );

  const generateCode = useCallback(async (spaceId: string, ttlMinutes = 15) => {
    if (!spaceId) return { error: new Error("No active space") };
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const next: PairingCode = {
      code,
      spaceId,
      expiresAt: Date.now() + ttlMinutes * 60_000,
      used: false,
    };
    setPairingCodes(prev => [next, ...prev].slice(0, 20));
    return { code, error: null };
  }, []);

  const value: SpaceContextValue = {
    loading,
    session,
    userId,
    mode,
    activeSpaceId,
    setSoloMode,
    signIn,
    signUp,
    signOut,
    createSpace,
    joinWithCode,
    generateCode,
  };

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}

export function useSpace() {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error("useSpace must be used within SpaceProvider");
  return ctx;
}
