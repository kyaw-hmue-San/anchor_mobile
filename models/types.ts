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

export type MemoryTag = "trip" | "anniversary" | "apology" | "gift";

export type ReminderWindow = 30 | 120 | 1440;

export interface Event {
  id: string;
  title: string;
  dateTime: string; // ISO string
  category: EventCategory;
  note?: string;
  guardianAlertEnabled?: boolean;
  confirmedAt?: number | null;
  reminderWindows?: ReminderWindow[];
  updatedAt?: number;
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
  tag?: MemoryTag;
}

export type CoupleGoalType = "dates-per-month" | "calls-per-week" | "custom";

export interface CoupleGoal {
  id: string;
  title: string;
  type: CoupleGoalType;
  target: number;
  progress: number;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ActivityType = "mood-updated" | "snapshot-saved" | "event-saved";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  targetId?: string;
  message: string;
  createdAt: number;
}

export interface PartnerPresence {
  moodUpdatedAt: number | null;
  snapshotSavedAt: number | null;
  eventUpdatedAt: number | null;
}

export interface MoodStreakSummary {
  streakDays: number;
  weeklyCheckins: number;
  missedToday: boolean;
}

export interface WeeklyPlanDay {
  date: string;
  events: Event[];
  suggestedBlocks: string[];
  conflicts: Array<{ firstEventId: string; secondEventId: string }>;
}

export interface SmartReminder {
  event: Event;
  windowMinutes: ReminderWindow;
  dueAt: number;
  requiresGuardianFollowup: boolean;
}

export interface SafetyContact {
  id: string;
  name: string;
  phone: string;
}

export interface SafetyCircle {
  contacts: SafetyContact[];
  escalationSeconds: number;
  templates: string[];
}
