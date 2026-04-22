import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { AppSettingsSection } from "./sections/AppSettingsSection";
import { AppSettings, defaultSettings } from "./types";
import { getAppSettings, saveAppSettings } from "../../services/appSettings";
import { useAppTheme } from "../../context/ThemeContext";
import { ROUTES } from "../../main/navigation/routes";
import { getFriendlyFirebaseError } from "../../services/firebaseErrors";
import { ensureLocationPermission, ensureNotificationPermission } from "../../services/permissions";

const NOTIFICATION_KEYS: (keyof AppSettings)[] = [
  "enableNotifications",
  "messageNotifications",
  "countdownReminders",
  "guardianAlerts",
  "locationUpdates",
];

const LOCATION_KEYS: (keyof AppSettings)[] = ["shareLocation", "locationUpdates"];

export function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, setDarkModeEnabled } = useAppTheme();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await getAppSettings();
        setSettings(next);
      } catch (error) {
        setError(getFriendlyFirebaseError(error, "Could not load settings."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const persistSettings = async (next: AppSettings) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveAppSettings(next);
      setSettings(saved);
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not save settings."));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (key: keyof AppSettings) => {
    if (saving || loading) return;

    const nextValue = !settings[key];
    const next = { ...settings, [key]: !settings[key] };

    if (nextValue && NOTIFICATION_KEYS.includes(key)) {
      try {
        const permission = await ensureNotificationPermission();
        if (!permission.granted) {
          setError(permission.message || "Notification permission is required for this setting.");
          return;
        }
      } catch {
        setError("Could not verify notification permission.");
        return;
      }
    }

    if (nextValue && LOCATION_KEYS.includes(key)) {
      try {
        const permission = await ensureLocationPermission();
        if (!permission.granted) {
          setError(permission.message || "Location permission is required for this setting.");
          return;
        }
      } catch {
        setError("Could not verify location permission.");
        return;
      }
    }

    if (key === "darkMode") {
      await setDarkModeEnabled(next.darkMode);
    }

    await persistSettings(next);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AnchorLogo size={35} />
          <MenuButton color={colors.text} />
        </View>

        <Text style={[styles.screenTitle, { color: colors.text }]}>Settings</Text>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.muted, { color: colors.muted }]}>Loading settings…</Text>
          </View>
        ) : (
          <AppSettingsSection settings={settings} toggle={toggle} saving={saving} />
        )}

        <View style={[styles.securityCard, { backgroundColor: colors.surface, borderColor: colors.border }] }>
          <Text style={[styles.securityTitle, { color: colors.text }]}>Security</Text>
          <Text style={[styles.securitySubtitle, { color: colors.muted }]}>Manage your fast unlock PIN.</Text>
          <TouchableOpacity
            style={[styles.securityButton, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}
            onPress={() => navigation.navigate(ROUTES.ChangeQuickPin as never)}
          >
            <Text style={[styles.securityButtonText, { color: colors.primary }]}>Change quick PIN</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
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
  loadingWrap: { minHeight: 100, alignItems: "center", justifyContent: "center", gap: 10 },
  muted: { color: "#6B7280" },
  securityCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  securityTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  securitySubtitle: { color: "#6B7280" },
  securityButton: {
    marginTop: 4,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  securityButtonText: { fontWeight: "700" },
  errorText: { color: "#B91C1C" },
});
