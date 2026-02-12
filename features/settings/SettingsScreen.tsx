import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { getUser, resetAll, saveUser } from "../../services/storage";
import { User } from "../../models/types";

export function SettingsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const load = async () => {
      const u = await getUser();
      if (u) {
        setUser(u);
        setDisplayName(u.displayName);
        setPartnerCode(u.partnerCode);
      }
      try {
        const stored = await AsyncStorage.getItem(settingsKey);
        if (stored) {
          setSettings({ ...defaultSettings, ...JSON.parse(stored) });
        }
      } catch (err) {
        console.warn("Failed to load settings", err);
      }
    };
    load();
  }, []);

  const save = async () => {
    if (!displayName.trim()) {
      Alert.alert("Missing name", "Please enter a display name.");
      return;
    }
    setSaving(true);
    const updated: User = {
      id: user?.id ?? "local-user",
      displayName: displayName.trim(),
      partnerCode: partnerCode.trim() || "partner-demo",
    };
    await saveUser(updated);
    setUser(updated);
    setSaving(false);
    Alert.alert("Saved", "Profile updated.");
  };

  const persistSettings = async (next: AppSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(settingsKey, JSON.stringify(next));
    } catch (err) {
      console.warn("Failed to save settings", err);
    }
  };

  const toggle = (key: keyof AppSettings) => {
    const next = { ...settings, [key]: !settings[key] } as AppSettings;
    persistSettings(next);
  };

  const onReset = async () => {
    await resetAll();
    setUser(null);
    setDisplayName("");
    setPartnerCode("");
    setSettings(defaultSettings);
    await AsyncStorage.removeItem(settingsKey);
    Alert.alert("Reset complete", "All local data cleared.");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Anchor</Text>
        <Ionicons name="menu" size={22} color={palette.text} />
      </View>

      <View style={styles.headerBlock}>
        <Text style={styles.screenTitle}>Settings</Text>
      </View>

      <SettingsSection
        icon="notifications-outline"
        title="Notifications"
        items={[
          {
            label: "Enable Notifications",
            subtitle: "Get alerts for messages and events",
            value: settings.enableNotifications,
            onPress: () => toggle("enableNotifications"),
          },
          {
            label: "Message Notifications",
            subtitle: "Notify for new messages",
            value: settings.messageNotifications,
            onPress: () => toggle("messageNotifications"),
          },
          {
            label: "Location Updates",
            subtitle: "Notify when partner arrives/leaves",
            value: settings.locationUpdates,
            onPress: () => toggle("locationUpdates"),
          },
          {
            label: "Sound",
            subtitle: "Play sound for notifications",
            value: settings.sound,
            onPress: () => toggle("sound"),
          },
        ]}
      />

      <SettingsSection
        icon="location-outline"
        title="Privacy & Location"
        items={[
          {
            label: "Share Location",
            subtitle: "Allow partner to see your location",
            value: settings.shareLocation,
            onPress: () => toggle("shareLocation"),
          },
          {
            label: "Show Online Status",
            subtitle: "Display when you are active",
            value: settings.showOnlineStatus,
            onPress: () => toggle("showOnlineStatus"),
          },
          {
            label: "Read Receipts",
            subtitle: "Let partner know when you read messages",
            value: settings.readReceipts,
            onPress: () => toggle("readReceipts"),
          },
        ]}
      />

      <SettingsSection
        icon="calendar-outline"
        title="Calendar & Reminders"
        items={[
          {
            label: "Countdown Alerts",
            subtitle: "Remind before shared events",
            value: settings.countdownReminders,
            onPress: () => toggle("countdownReminders"),
          },
          {
            label: "Guardian Alerts",
            subtitle: "Escalate urgent pings to partner",
            value: settings.guardianAlerts,
            onPress: () => toggle("guardianAlerts"),
          },
        ]}
      />

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Ionicons name="person-circle-outline" size={22} color={palette.primary} />
        </View>
        <TextInput
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
          placeholderTextColor={palette.muted}
        />
        <TextInput
          placeholder="Partner code"
          value={partnerCode}
          onChangeText={setPartnerCode}
          style={styles.input}
          placeholderTextColor={palette.muted}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={save}>
          <Text style={styles.primaryButtonText}>{saving ? "Saving…" : "Save profile"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Danger Zone</Text>
          <Ionicons name="warning-outline" size={20} color={palette.danger} />
        </View>
        <TouchableOpacity style={styles.dangerButton} onPress={onReset}>
          <Text style={styles.dangerButtonText}>Reset all data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

type SettingsItem = {
  label: string;
  subtitle: string;
  value: boolean;
  onPress: () => void;
};

type SettingsSectionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  items: SettingsItem[];
};

type AppSettings = {
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

const defaultSettings: AppSettings = {
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

const settingsKey = "app_settings";

function SettingsSection({ icon, title, items }: SettingsSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={palette.text} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map(item => (
        <View key={item.label} style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
          </View>
          <Toggle value={item.value} onPress={item.onPress} />
        </View>
      ))}
    </View>
  );
}

function Toggle({ value, onPress }: { value: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}
    >
      <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
    </TouchableOpacity>
  );
}

const palette = {
  primary: "#7C3AED",
  primarySoft: "#F3E8FF",
  border: "#E5E7EB",
  card: "#FFFFFF",
  background: "#F5F3FF",
  text: "#111827",
  muted: "#6B7280",
  danger: "#EF4444",
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  muted: { color: palette.muted },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 18, fontWeight: "700", color: palette.text },
  headerBlock: { marginTop: 10 },
  screenTitle: { fontSize: 26, fontWeight: "800", color: palette.text },
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
  sectionTitle: { fontSize: 16, fontWeight: "800", color: palette.text },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E9D5FF",
    gap: 10,
  },
  itemLabel: { fontSize: 15, fontWeight: "700", color: palette.text },
  itemSubtitle: { color: palette.muted, marginTop: 2 },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 16,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  toggleOn: { backgroundColor: palette.primary },
  toggleOff: { backgroundColor: "#E5E7EB" },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  toggleThumbOn: { marginLeft: 18 },
  toggleThumbOff: { marginLeft: 0 },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: palette.text },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFF",
    color: palette.text,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "white", fontWeight: "700" },
  dangerButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerButtonText: { color: palette.danger, fontWeight: "700" },
});
