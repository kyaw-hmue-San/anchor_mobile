import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { useSpace } from "../../context/SpaceContext";
import { resetAll } from "../../services/storage";

export function SettingsScreen({ route }: SettingsScreenProps) {
  const initialSection = (route?.params?.initialSection as SectionKey | undefined) ?? "spaces";
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const {
    loading: spaceLoading,
    userId,
    mode,
    activeSpaceId,
    setSoloMode,
    createSpace,
    joinWithCode,
    generateCode,
  } = useSpace();
  const [spaceName, setSpaceName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [section, setSection] = useState<SectionKey>(initialSection);

  useEffect(() => {
    const load = async () => {
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

  useEffect(() => {
    const next = route?.params?.initialSection as SectionKey | undefined;
    if (next && next !== section) {
      setSection(next);
    }
  }, [route?.params?.initialSection, section]);

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
    setSettings(defaultSettings);
    await AsyncStorage.removeItem(settingsKey);
    Alert.alert("Reset complete", "All local data cleared.");
  };

  const handleCreateSpace = async () => {
    const name = spaceName.trim() || "Shared Space";
    const { spaceId, error } = await createSpace(name);
    if (error || !spaceId) {
      Alert.alert("Create space failed", error?.message ?? "Unknown error");
    } else {
      setSpaceName("");
      setStatusMsg(`Active space: ${spaceId}`);
    }
  };

  const handleJoinSpace = async () => {
    if (!joinCode.trim()) {
      Alert.alert("Missing code", "Enter a pairing code to join.");
      return;
    }
    const { spaceId, error } = await joinWithCode(joinCode.trim());
    if (error || !spaceId) {
      Alert.alert("Join failed", error?.message ?? "Invalid code");
    } else {
      setJoinCode("");
      setStatusMsg(`Joined space: ${spaceId}`);
    }
  };

  const handleGenerateCode = async () => {
    if (!activeSpaceId) {
      Alert.alert("No active space", "Create or join a space first.");
      return;
    }
    const { code, error } = await generateCode(activeSpaceId);
    if (error || !code) {
      Alert.alert("Code error", error?.message ?? "Could not generate code");
    } else {
      setLastCode(code);
      setStatusMsg(`Share this code: ${code}`);
    }
  };

  const sectionNav: SectionNavItem[] = [
    { key: "spaces", label: "Spaces & Couple", subtitle: "Pairing, mode" },
    { key: "app", label: "App Settings", subtitle: "Alerts & privacy" },
    { key: "help", label: "Help & FAQ", subtitle: "Reset & support" },
  ];

  const renderSection = () => {
    switch (section) {
      case "app":
        return (
          <>
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
          </>
        );
      case "help":
        return (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Help & Danger Zone</Text>
              <Ionicons name="warning-outline" size={20} color={palette.danger} />
            </View>
            <Text style={styles.muted}>Need a fresh start? This clears local data only.</Text>
            <TouchableOpacity style={styles.dangerButton} onPress={onReset}>
              <Text style={styles.dangerButtonText}>Reset all data</Text>
            </TouchableOpacity>
          </View>
        );
      case "spaces":
      default:
        return (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Spaces</Text>
                <Ionicons name="link-outline" size={20} color={palette.primary} />
              </View>
              <Text style={styles.muted}>Mode: {mode === "couple" ? "Couple (shared space)" : "Solo (local only)"}</Text>
              <Text style={styles.muted}>Active space: {activeSpaceId ?? "None"}</Text>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === "solo" && styles.modeButtonActive]}
                  onPress={() => setSoloMode()}
                  disabled={spaceLoading}
                >
                  <Text style={[styles.modeButtonText, mode === "solo" && styles.modeButtonTextActive]}>Solo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, mode === "couple" && styles.modeButtonActive]}
                  onPress={() => {
                    if (activeSpaceId) {
                      setStatusMsg(`Couple mode ready in space ${activeSpaceId}`);
                    } else {
                      Alert.alert("Couple mode", "Create or join a space first.");
                    }
                  }}
                  disabled={spaceLoading}
                >
                  <Text style={[styles.modeButtonText, mode === "couple" && styles.modeButtonTextActive]}>Couple</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder="Space name"
                value={spaceName}
                onChangeText={setSpaceName}
                style={styles.input}
                placeholderTextColor={palette.muted}
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCreateSpace}
                disabled={spaceLoading || !userId}
              >
                <Text style={styles.primaryButtonText}>Create space</Text>
              </TouchableOpacity>
              <View style={styles.rowGap8}>
                <TextInput
                  placeholder="Pairing code"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  style={styles.input}
                  placeholderTextColor={palette.muted}
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleJoinSpace}
                  disabled={spaceLoading || !userId}
                >
                  <Text style={styles.primaryButtonText}>Join space</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGenerateCode}
                disabled={!activeSpaceId || spaceLoading}
              >
                <Text style={styles.secondaryButtonText}>Generate pairing code</Text>
              </TouchableOpacity>
              {lastCode ? <Text style={styles.codeBadge}>Share code: {lastCode}</Text> : null}
              {statusMsg ? <Text style={styles.statusText}>{statusMsg}</Text> : null}
            </View>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top","left","right"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AnchorLogo size={35} />
          <MenuButton color={palette.text} />
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.screenTitle}>Settings</Text>
            <Text style={styles.muted}>Section: {sectionNav.find(s => s.key === section)?.label}</Text>
        </View>

        {renderSection()}
      </ScrollView>

    </SafeAreaView>
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

type SettingsScreenProps = {
  route?: { params?: { initialSection?: SectionKey } };
};

type SectionKey = "spaces" | "app" | "help";

type SectionNavItem = {
  key: SectionKey;
  label: string;
  subtitle: string;
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
  safeArea: { flex: 1, backgroundColor: palette.background },
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  muted: { color: palette.muted },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 18, fontWeight: "700", color: palette.text },
  headerBlock: { marginTop: 10 },
  screenTitle: { fontSize: 26, fontWeight: "800", color: palette.text },
  menuContainer: {
    position: "absolute",
    top: 70,
    right: 16,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    width: 200,
    zIndex: 10,
  },
  menuItem: { paddingHorizontal: 14, paddingVertical: 12 },
  menuItemActive: { backgroundColor: palette.primarySoft },
  menuItemTitle: { fontSize: 15, fontWeight: "700", color: palette.text },
  menuItemSubtitle: { fontSize: 12, color: palette.muted, marginTop: 2 },
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
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  secondaryButtonText: { color: palette.text, fontWeight: "700" },
  dangerButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerButtonText: { color: palette.danger, fontWeight: "700" },
  modeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  modeButtonActive: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  modeButtonText: { color: palette.text, fontWeight: "700" },
  modeButtonTextActive: { color: palette.primary },
  rowGap8: { gap: 8 },
  divider: { height: 1, backgroundColor: palette.border },
  codeBadge: { marginTop: 6, color: palette.text, fontWeight: "700" },
  statusText: { marginTop: 4, color: palette.muted },
});
