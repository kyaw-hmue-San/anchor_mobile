export type MoodOption = "joyful" | "calm" | "neutral" | "anxious" | "low";

export interface User {
  id: string;
  displayName: string;
  partnerCode: string;
}

export interface MoodEntry {
  date: string; // ISO date yyyy-mm-dd
  mood: MoodOption;
  isPartner?: boolean;
  updatedAt: number;
}

export interface Snapshot {
  id: string;
  uri: string;
  createdAt: number; // epoch ms
}

export type EventCategory = "call" | "date" | "gift" | "trip" | "other";

export interface Event {
  id: string;
  title: string;
  dateTime: string; // ISO string
  category: EventCategory;
  note?: string;
  guardianAlertEnabled?: boolean;
}

export type MemoryType = "snapshot" | "note";

export interface Memory {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  type: MemoryType;
  snapshotUri?: string;
  eventId?: string;
}
