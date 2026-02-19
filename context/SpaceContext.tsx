import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";
import {
  createSpace as createSpaceRepo,
  joinSpaceWithCode as joinSpaceWithCodeRepo,
  generatePairingCode,
  signInWithPassword,
  signUpWithEmail,
  signOut as supabaseSignOut,
} from "../services/supabaseRepo";

const MODE_KEY = "anchor:mode";
const SPACE_KEY = "anchor:space";

type SpaceMode = "solo" | "couple";

interface SpaceContextValue {
  loading: boolean;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<SpaceMode>("solo");
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
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
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      const [[, storedMode], [, storedSpace]] = await AsyncStorage.multiGet([MODE_KEY, SPACE_KEY]);
      setMode((storedMode as SpaceMode) || "solo");
      setActiveSpaceId(storedSpace || null);
      setLoading(false);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      sub?.subscription.unsubscribe();
    };
  }, []);

  const setSoloMode = useCallback(async () => {
    await persist("solo", null);
  }, [persist]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await signInWithPassword(email, password);
    return error ?? null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await signUpWithEmail(email, password);
    return error ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    await persist("solo", null);
  }, [persist]);

  const createSpace = useCallback(
    async (name: string) => {
      if (!userId) return { error: new Error("Not signed in") };
      const { space, error } = await createSpaceRepo(name, userId);
      if (error || !space) return { error };
      await persist("couple", space.id);
      return { spaceId: space.id };
    },
    [persist, userId]
  );

  const joinWithCode = useCallback(
    async (code: string) => {
      if (!userId) return { error: new Error("Not signed in") };
      const { spaceId, error } = await joinSpaceWithCodeRepo(code, userId);
      if (error || !spaceId) return { error };
      await persist("couple", spaceId);
      return { spaceId };
    },
    [persist, userId]
  );

  const generateCode = useCallback(async (spaceId: string, ttlMinutes = 15) => {
    const { code, error } = await generatePairingCode(spaceId, ttlMinutes);
    return { code, error };
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
