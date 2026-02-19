import React, { useEffect, useState } from "react";
import { View, Text, Alert, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { useSpace } from "../../context/SpaceContext";
import { resetAll } from "../../services/storage";
import { AppSettingsSection } from "./sections/AppSettingsSection";
import { HelpSection } from "./sections/HelpSection";
import { SpacesSection } from "./sections/SpacesSection";
import { AppSettings, defaultSettings, SectionKey } from "./types";

type SettingsScreenProps = {
  route?: { params?: { initialSection?: SectionKey } };
};

const settingsKey = "app_settings";

export function SettingsScreen({ route }: SettingsScreenProps) {
  const initialSection = route?.params?.initialSection ?? "spaces";
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [section, setSection] = useState<SectionKey>(initialSection);
  const [spaceName, setSpaceName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const { loading: spaceLoading, userId, mode, activeSpaceId, setSoloMode, createSpace, joinWithCode, generateCode } = useSpace();

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(settingsKey);
      if (stored) setSettings({ ...defaultSettings, ...JSON.parse(stored) });
    };
    load();
  }, []);

  const persistSettings = async (next: AppSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(settingsKey, JSON.stringify(next));
  };

  const toggle = (key: keyof AppSettings) => persistSettings({ ...settings, [key]: !settings[key] });

  const onReset = async () => {
    await resetAll();
    setSettings(defaultSettings);
    await AsyncStorage.removeItem(settingsKey);
    Alert.alert("Reset complete", "All local data cleared.");
  };

  const onCreateSpace = async () => {
    const { spaceId, error } = await createSpace(spaceName.trim() || "Shared Space");
    if (error || !spaceId) return Alert.alert("Create space failed", error?.message ?? "Unknown error");
    setSpaceName("");
    setStatusMsg(`Active space: ${spaceId}`);
  };

  const onJoinSpace = async () => {
    if (!joinCode.trim()) return Alert.alert("Missing code", "Enter a pairing code to join.");
    const { spaceId, error } = await joinWithCode(joinCode.trim());
    if (error || !spaceId) return Alert.alert("Join failed", error?.message ?? "Invalid code");
    setJoinCode("");
    setStatusMsg(`Joined space: ${spaceId}`);
  };

  const onGenerateCode = async () => {
    if (!activeSpaceId) return Alert.alert("No active space", "Create or join a space first.");
    const { code, error } = await generateCode(activeSpaceId);
    if (error || !code) return Alert.alert("Code error", error?.message ?? "Could not generate code");
    setLastCode(code);
    setStatusMsg(`Share this code: ${code}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AnchorLogo size={35} />
          <MenuButton color="#111827" />
        </View>

        <Text style={styles.screenTitle}>Settings</Text>

        <View style={styles.tabRow}>
          {(["spaces", "app", "help"] as SectionKey[]).map(key => (
            <TouchableOpacity key={key} style={[styles.tabButton, section === key && styles.tabButtonActive]} onPress={() => setSection(key)}>
              <Text style={[styles.tabText, section === key && styles.tabTextActive]}>{key === "app" ? "App" : key === "help" ? "Help" : "Spaces"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {section === "spaces" ? (
          <SpacesSection
            mode={mode}
            activeSpaceId={activeSpaceId}
            spaceLoading={spaceLoading}
            userId={userId}
            spaceName={spaceName}
            joinCode={joinCode}
            lastCode={lastCode}
            statusMsg={statusMsg}
            setSpaceName={setSpaceName}
            setJoinCode={setJoinCode}
            onSolo={setSoloMode}
            onCoupleHint={() => setStatusMsg(activeSpaceId ? `Couple mode ready in space ${activeSpaceId}` : "Create or join a space first")}
            onCreateSpace={onCreateSpace}
            onJoinSpace={onJoinSpace}
            onGenerateCode={onGenerateCode}
          />
        ) : null}

        {section === "app" ? <AppSettingsSection settings={settings} toggle={toggle} /> : null}
        {section === "help" ? <HelpSection onReset={onReset} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F3FF" },
  screen: { flex: 1, backgroundColor: "#F5F3FF" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  screenTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  tabRow: { flexDirection: "row", gap: 8 },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tabButtonActive: { backgroundColor: "#F3E8FF", borderColor: "#7C3AED" },
  tabText: { color: "#111827", fontWeight: "700" },
  tabTextActive: { color: "#7C3AED" },
});
