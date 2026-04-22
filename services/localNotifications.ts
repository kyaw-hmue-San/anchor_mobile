import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Event, ReminderWindow } from "../models/types";
import { getAppSettings } from "./appSettings";

const NOTIFICATION_KEY_PREFIX = "anchor:notif:event:";

function notificationStoreKey(eventId: string) {
  return `${NOTIFICATION_KEY_PREFIX}${eventId}`;
}

async function hasNotificationPermission() {
  const perms = await Notifications.getPermissionsAsync();
  return perms.granted || perms.status === "granted";
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("anchor-reminders", {
    name: "Anchor Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 200],
    lightColor: "#7C3AED",
  });
}

function buildReminderTime(eventDateTime: string, windowMinutes: ReminderWindow) {
  const eventMs = new Date(eventDateTime).getTime();
  if (Number.isNaN(eventMs)) return null;
  return eventMs - windowMinutes * 60 * 1000;
}

function contentForWindow(event: Event, windowMinutes: ReminderWindow, isGuardian: boolean) {
  if (isGuardian) {
    return {
      title: "Guardian Alert",
      body: `${event.title}: 24-hour reminder to check in and prepare a note for your partner.`,
      data: { eventId: event.id, type: "guardian-alert" },
    };
  }

  return {
    title: "Anchor Reminder",
    body: `${event.title} starts in ${windowMinutes} minutes.`,
    data: { eventId: event.id, type: "event-reminder", windowMinutes },
  };
}

export async function cancelEventLocalNotifications(eventId: string) {
  if (!eventId?.trim()) return;

  const raw = await AsyncStorage.getItem(notificationStoreKey(eventId));
  if (!raw) return;

  let ids: string[] = [];
  try {
    ids = JSON.parse(raw) as string[];
  } catch {
    ids = [];
  }

  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => null)));
  await AsyncStorage.removeItem(notificationStoreKey(eventId));
}

export async function scheduleEventLocalNotifications(event: Event) {
  if (!event.id?.trim()) return;

  await cancelEventLocalNotifications(event.id);

  const hasPerm = await hasNotificationPermission();
  if (!hasPerm) return;

  await ensureAndroidChannel();

  const settings = await getAppSettings();
  if (!settings.enableNotifications) return;

  const windows: ReminderWindow[] = event.reminderWindows?.length ? event.reminderWindows : [30, 120, 1440];
  const scheduledIds: string[] = [];

  const allowCountdown = settings.countdownReminders;
  const allowGuardian = settings.guardianAlerts && !!event.guardianAlertEnabled;

  for (const windowMinutes of windows) {
    const isGuardianWindow = windowMinutes === 1440 && allowGuardian;
    const shouldSchedule = isGuardianWindow || (allowCountdown && (!allowGuardian || windowMinutes !== 1440));

    if (!shouldSchedule) continue;

    const triggerMs = buildReminderTime(event.dateTime, windowMinutes);
    if (!triggerMs || triggerMs <= Date.now()) continue;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: contentForWindow(event, windowMinutes, isGuardianWindow),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(triggerMs) },
    });

    scheduledIds.push(identifier);
  }

  if (scheduledIds.length) {
    await AsyncStorage.setItem(notificationStoreKey(event.id), JSON.stringify(scheduledIds));
  }
}
