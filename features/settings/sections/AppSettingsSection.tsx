import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ToggleRow } from "../components/ToggleRow";
import { AppSettings } from "../types";
import { useAppTheme } from "../../../context/ThemeContext";

type Props = {
  settings: AppSettings;
  toggle: (key: keyof AppSettings) => void | Promise<void>;
  saving?: boolean;
};

type Group = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: { key: keyof AppSettings; label: string; subtitle: string }[];
};

const groups: Group[] = [
  {
    title: "Appearance",
    icon: "moon-outline",
    items: [{ key: "darkMode", label: "Dark Mode", subtitle: "Use dark colors across the app" }],
  },
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

const notificationDependent: (keyof AppSettings)[] = [
  "messageNotifications",
  "locationUpdates",
  "sound",
  "countdownReminders",
  "guardianAlerts",
];

export function AppSettingsSection({ settings, toggle, saving = false }: Props) {
  const { colors, isDark } = useAppTheme();

  return (
    <>
      {groups.map(group => (
        <View key={group.title} style={[styles.sectionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.sectionHeader, { backgroundColor: isDark ? "#1E1B4B" : "#F3E8FF" }] }>
            <Ionicons name={group.icon} size={18} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{group.title}</Text>
          </View>
          {group.items.map(item => {
            const disabled = saving || (!settings.enableNotifications && notificationDependent.includes(item.key));
            return (
              <ToggleRow
                key={item.key}
                label={item.label}
                subtitle={item.subtitle}
                value={settings[item.key]}
                onPress={() => toggle(item.key)}
                disabled={disabled}
              />
            );
          })}
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
