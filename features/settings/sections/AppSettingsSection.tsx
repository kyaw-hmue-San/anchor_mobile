import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ToggleRow } from "../components/ToggleRow";
import { AppSettings } from "../types";

type Props = {
  settings: AppSettings;
  toggle: (key: keyof AppSettings) => void;
};

type Group = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: { key: keyof AppSettings; label: string; subtitle: string }[];
};

const groups: Group[] = [
  {
    title: "Notifications",
    icon: "notifications-outline",
    items: [
      { key: "enableNotifications", label: "Enable Notifications", subtitle: "Get alerts for messages and events" },
      { key: "messageNotifications", label: "Message Notifications", subtitle: "Notify for new messages" },
      { key: "locationUpdates", label: "Location Updates", subtitle: "Notify when partner arrives/leaves" },
      { key: "sound", label: "Sound", subtitle: "Play sound for notifications" },
    ],
  },
  {
    title: "Privacy & Location",
    icon: "location-outline",
    items: [
      { key: "shareLocation", label: "Share Location", subtitle: "Allow partner to see your location" },
      { key: "showOnlineStatus", label: "Show Online Status", subtitle: "Display when you are active" },
      { key: "readReceipts", label: "Read Receipts", subtitle: "Let partner know when you read messages" },
    ],
  },
  {
    title: "Calendar & Reminders",
    icon: "calendar-outline",
    items: [
      { key: "countdownReminders", label: "Countdown Alerts", subtitle: "Remind before shared events" },
      { key: "guardianAlerts", label: "Guardian Alerts", subtitle: "Escalate urgent pings to partner" },
    ],
  },
];

export function AppSettingsSection({ settings, toggle }: Props) {
  return (
    <>
      {groups.map(group => (
        <View key={group.title} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name={group.icon} size={18} color="#111827" />
            <Text style={styles.sectionTitle}>{group.title}</Text>
          </View>
          {group.items.map(item => (
            <ToggleRow
              key={item.key}
              label={item.label}
              subtitle={item.subtitle}
              value={settings[item.key]}
              onPress={() => toggle(item.key)}
            />
          ))}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "#F9F5FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F3E8FF",
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
});
