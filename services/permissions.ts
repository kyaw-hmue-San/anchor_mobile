import { Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

type PermissionResult = {
  granted: boolean;
  message?: string;
};

export async function ensureNotificationPermission(): Promise<PermissionResult> {
  if (Platform.OS === "web") {
    if (typeof Notification === "undefined") {
      return { granted: false, message: "Notifications are not supported in this browser." };
    }

    if (Notification.permission === "granted") {
      return { granted: true };
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return { granted: true };
    }

    return {
      granted: false,
      message: "Notification permission was denied. Enable it in browser or device settings.",
    };
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.status === "granted") {
    return { granted: true };
  }

  const requested = await Notifications.requestPermissionsAsync();
  if (requested.granted || requested.status === "granted") {
    return { granted: true };
  }

  return {
    granted: false,
    message: "Notification permission was denied. Enable it in device settings.",
  };
}

export async function ensureLocationPermission(): Promise<PermissionResult> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.granted || existing.status === "granted") {
    return { granted: true };
  }

  const requested = await Location.requestForegroundPermissionsAsync();
  if (requested.granted || requested.status === "granted") {
    return { granted: true };
  }

  return {
    granted: false,
    message: "Location permission was denied. Enable it in device settings.",
  };
}
