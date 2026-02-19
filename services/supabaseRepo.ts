import { supabase } from "./supabaseClient";
import { Event as LocalEvent, MoodOption, Snapshot } from "../models/types";

export type Space = { id: string; name: string; owner_id: string; created_at: string };
export type SpaceMember = { space_id: string; user_id: string; role: "owner" | "member"; joined_at: string };
export type PairingCode = { code: string; space_id: string; expires_at: string; used: boolean; created_at: string };
export type RemoteEvent = LocalEvent & { space_id: string; creator_id: string; created_at: string };
export type MoodRow = { id: string; space_id: string; user_id: string; mood: MoodOption; created_at: string };
export type AlertRow = { id: string; space_id: string; trigger_user_id: string; message: string; created_at: string; resolved_at: string | null };
export type SnapshotRow = { id: string; space_id: string; user_id: string; uri: string; created_at: string };
export type LocationRow = { id: string; space_id: string; user_id: string; lat: number; lng: number; accuracy: number | null; created_at: string };

// ---------- Auth ----------
export async function signInWithEmailOtp(email: string) {
  return supabase.auth.signInWithOtp({ email });
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function signOut() {
  return supabase.auth.signOut();
}

// ---------- Spaces / Pairing ----------
export async function createSpace(name: string, ownerId: string) {
  const { data, error } = await supabase
    .from("spaces")
    .insert({ name, owner_id: ownerId })
    .select()
    .single<Space>();
  if (error || !data) return { space: null as Space | null, error };
  const { error: memberError } = await supabase
    .from("space_members")
    .upsert({ space_id: data.id, user_id: ownerId, role: "owner" });
  return { space: data, error: memberError ?? null };
}

export async function listSpacesForUser(userId: string) {
  const { data, error } = await supabase
    .from("space_members")
    .select("spaces(*)")
    .eq("user_id", userId);
  const spaces = (data ?? []).map(row => (row as any).spaces as Space);
  return { spaces, error };
}

export async function generatePairingCode(spaceId: string, ttlMinutes = 15) {
  const expires = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from("pairing_codes")
    .insert({ space_id: spaceId, expires_at: expires })
    .select()
    .single<PairingCode>();
  return { code: data?.code, error };
}

export async function joinSpaceWithCode(code: string, userId: string) {
  const { data, error } = await supabase.rpc("redeem_pairing_code", { p_code: code });
  if (error || !data) return { spaceId: null as string | null, error };
  const spaceId = data as string;
  const { error: memberError } = await supabase
    .from("space_members")
    .upsert({ space_id: spaceId, user_id: userId, role: "member" });
  return { spaceId, error: memberError ?? null };
}

// ---------- Events ----------
export async function listEvents(spaceId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("space_id", spaceId)
    .order("dateTime", { ascending: true });
  return { events: (data as RemoteEvent[]) ?? [], error };
}

export async function upsertEvent(spaceId: string, creatorId: string, event: LocalEvent) {
  const payload = { ...event, space_id: spaceId, creator_id: creatorId };
  const { data, error } = await supabase.from("events").upsert(payload).select().single<RemoteEvent>();
  return { event: data, error };
}

export async function deleteEvent(spaceId: string, id: string) {
  return supabase.from("events").delete().eq("space_id", spaceId).eq("id", id);
}

export function subscribeEvents(spaceId: string, cb: (event: RemoteEvent) => void) {
  const channel = supabase
    .channel(`events-${spaceId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "events", filter: `space_id=eq.${spaceId}` }, payload => {
      cb(payload.new as RemoteEvent);
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "events", filter: `space_id=eq.${spaceId}` }, payload => {
      cb(payload.new as RemoteEvent);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

// ---------- Moods ----------
export async function postMood(spaceId: string, userId: string, mood: MoodOption) {
  const { data, error } = await supabase.from("moods").insert({ space_id: spaceId, user_id: userId, mood }).select().single<MoodRow>();
  return { mood: data, error };
}

export async function listMoods(spaceId: string) {
  const { data, error } = await supabase
    .from("moods")
    .select("*")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false });
  return { moods: (data as MoodRow[]) ?? [], error };
}

export function subscribeMoods(spaceId: string, cb: (mood: MoodRow) => void) {
  const channel = supabase
    .channel(`moods-${spaceId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "moods", filter: `space_id=eq.${spaceId}` }, payload => {
      cb(payload.new as MoodRow);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

// ---------- Alerts ----------
export async function triggerAlert(spaceId: string, triggerUserId: string, message: string) {
  const { data, error } = await supabase
    .from("alerts")
    .insert({ space_id: spaceId, trigger_user_id: triggerUserId, message })
    .select()
    .single<AlertRow>();
  return { alert: data, error };
}

export function subscribeAlerts(spaceId: string, cb: (alert: AlertRow) => void) {
  const channel = supabase
    .channel(`alerts-${spaceId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `space_id=eq.${spaceId}` }, payload => {
      cb(payload.new as AlertRow);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

// ---------- Locations (optional) ----------
export async function sendLocation(spaceId: string, userId: string, lat: number, lng: number, accuracy?: number) {
  return supabase.from("locations").insert({ space_id: spaceId, user_id: userId, lat, lng, accuracy: accuracy ?? null });
}

// ---------- Snapshots / Storage ----------
export async function uploadSnapshot(spaceId: string, userId: string, fileUri: string) {
  const filename = `snap-${spaceId}-${userId}-${Date.now()}.jpg`;
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const { error: uploadError } = await supabase.storage.from("snapshots").upload(filename, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: true,
  });
  if (uploadError) return { uri: null as string | null, error: uploadError };
  const { data: publicData } = supabase.storage.from("snapshots").getPublicUrl(filename);
  const publicUrl = publicData?.publicUrl ?? null;
  if (!publicUrl) return { uri: null, error: new Error("Failed to get public URL") };
  const { error: insertError } = await supabase.from("snapshots").insert({ space_id: spaceId, user_id: userId, uri: publicUrl });
  return { uri: publicUrl, error: insertError };
}

export async function listSnapshots(spaceId: string) {
  const { data, error } = await supabase
    .from("snapshots")
    .select("*")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false });
  return { snapshots: (data as SnapshotRow[]) ?? [], error };
}
