export type SectionKey = "spaces" | "app" | "help";

export type AppSettings = {
  darkMode: boolean;
  enableNotifications: boolean;
  messageNotifications: boolean;
  locationUpdates: boolean;
  sound: boolean;
  shareLocation: boolean;
  showOnlineStatus: boolean;
  readReceipts: boolean;
  countdownReminders: boolean;
  guardianAlerts: boolean;
};

export const defaultSettings: AppSettings = {
  darkMode: false,
  enableNotifications: true,
  messageNotifications: true,
  locationUpdates: true,
  sound: true,
  shareLocation: false,
  showOnlineStatus: true,
  readReceipts: true,
  countdownReminders: true,
  guardianAlerts: true,
};
