import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { ConnectionStatusBanner } from "../../components/ConnectionStatusBanner";
import { ActivityItem, MoodEntry, MoodOption, MoodStreakSummary, PartnerPresence, Snapshot } from "../../models/types";
import {
  ensurePartnerMood,
  getMood,
  getMoodStreakSummary,
  getPartnerDisplayName,
  getPartnerPresenceSummary,
  getTodaySnapshot,
  listActivityFeed,
  saveSnapshot,
  setMood,
} from "../../services/storage";
import { CoupleModeGate } from "../../components/CoupleModeGate";
import { getAppSettings } from "../../services/appSettings";
import { useAppTheme } from "../../context/ThemeContext";
import { getFriendlyFirebaseError } from "../../services/firebaseErrors";

const MOODS: MoodOption[] = ["joyful", "calm", "neutral", "anxious", "low"];

export function SanctuaryScreen() {
  const { colors, isDark } = useAppTheme();

  const [initialLoading, setInitialLoading] = useState(true);
  const [savingMood, setSavingMood] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [myMood, setMyMood] = useState<MoodEntry | null>(null);
  const [partnerMood, setPartnerMoodState] = useState<MoodEntry | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [partnerName, setPartnerName] = useState("Partner");
  const [shareLocationEnabled, setShareLocationEnabled] = useState(false);
  const [locationUpdatesEnabled, setLocationUpdatesEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presence, setPresence] = useState<PartnerPresence>({ moodUpdatedAt: null, snapshotSavedAt: null, eventUpdatedAt: null });
  const [streak, setStreak] = useState<MoodStreakSummary>({ streakDays: 0, weeklyCheckins: 0, missedToday: false });
  const [feed, setFeed] = useState<ActivityItem[]>([]);

  const loadSanctuaryState = async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const [mine, partner, snap, partnerDisplayName, appSettings] = await Promise.all([
        getMood(),
        ensurePartnerMood(),
        getTodaySnapshot(),
        getPartnerDisplayName(),
        getAppSettings(),
      ]);
      const [presenceSummary, streakSummary, activity] = await Promise.all([
        getPartnerPresenceSummary(),
        getMoodStreakSummary(),
        listActivityFeed(10),
      ]);
      setMyMood(mine);
      setPartnerMoodState(partner);
      setSnapshot(snap);
      setPartnerName(partnerDisplayName?.trim() || "Partner");
      setShareLocationEnabled(appSettings.shareLocation);
      setLocationUpdatesEnabled(appSettings.locationUpdates);
      setPresence(presenceSummary);
      setStreak(streakSummary);
      setFeed(activity);
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Failed to load sanctuary state."));
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadSanctuaryState();
  }, []);

  const onRetrySync = async () => {
    await loadSanctuaryState();
  };

  const handleMoodSelect = async (mood: MoodOption) => {
    if (savingMood || savingSnapshot) return;

    setSavingMood(true);
    setError(null);
    try {
      await setMood(mood);
      const [updated, streakSummary, activity] = await Promise.all([getMood(), getMoodStreakSummary(), listActivityFeed(10)]);
      setMyMood(updated);
      setStreak(streakSummary);
      setFeed(activity);
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not save mood."));
    } finally {
      setSavingMood(false);
    }
  };

  const pickImage = async () => {
    if (savingMood || savingSnapshot) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow photo access to add a snapshot.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    const uri = result.assets[0].uri;

    setSavingSnapshot(true);
    setError(null);
    try {
      const snap = await saveSnapshot(uri);
      const [presenceSummary, activity] = await Promise.all([getPartnerPresenceSummary(), listActivityFeed(10)]);
      setSnapshot(snap);
      setPresence(presenceSummary);
      setFeed(activity);
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not save snapshot."));
    } finally {
      setSavingSnapshot(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <CoupleModeGate>
        <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
          {error ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onRetrySync}>
                <Text style={styles.primaryButtonText}>Retry sync</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.topBar}>
            <AnchorLogo size={35} />
            <MenuButton color={colors.text} />
          </View>

          <ConnectionStatusBanner />

          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Sanctuary</Text>
            <Text style={[styles.screenSubtitle, { color: colors.muted }]}>Your connection to {partnerName}</Text>

            <View style={[styles.heroInner, { backgroundColor: isDark ? "#4338CA" : "#C084FC" }]}>
              <Text style={styles.heroName}>{partnerName}</Text>
              <Text style={styles.heroTagline}>Always with you</Text>
            </View>
          </View>

          <View style={styles.cardGroup}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Current mood</Text>
            <View style={[styles.moodCard, { borderColor: colors.border, backgroundColor: isDark ? colors.surfaceAlt : "#F6EDFF" }] }>
              <View style={[styles.moodIconWrap, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="book-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.moodTitle, { color: colors.text }]}>{partnerMood?.mood ?? "Waiting for partner"}</Text>
                <Text style={[styles.mutedText, { color: colors.muted }]}>
                  {partnerMood?.updatedAt ? new Date(partnerMood.updatedAt).toLocaleTimeString() : "No recent mood"}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>Partner Presence Timeline</Text>
            <Text style={[styles.mutedText, { color: colors.muted }]}>Mood update: {presence.moodUpdatedAt ? new Date(presence.moodUpdatedAt).toLocaleString() : "No update yet"}</Text>
            <Text style={[styles.mutedText, { color: colors.muted }]}>Snapshot: {presence.snapshotSavedAt ? new Date(presence.snapshotSavedAt).toLocaleString() : "No snapshot yet"}</Text>
            <Text style={[styles.mutedText, { color: colors.muted }]}>Event activity: {presence.eventUpdatedAt ? new Date(presence.eventUpdatedAt).toLocaleString() : "No event activity yet"}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Check-in Streak</Text>
            <Text style={[styles.mutedText, { color: colors.text }]}>Streak: {streak.streakDays} day(s)</Text>
            <Text style={[styles.mutedText, { color: colors.text }]}>This week: {streak.weeklyCheckins} check-ins</Text>
            {streak.missedToday ? <Text style={[styles.mutedText, { color: colors.danger }]}>Gentle nudge: check in today 💜</Text> : null}
          </View>

          <View style={styles.cardGroup}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Last known location</Text>
            <View style={[styles.moodCard, { backgroundColor: isDark ? "#1E3A8A" : "#EEF6FF", borderColor: isDark ? "#1D4ED8" : "#DBEAFE" }]}>
              <View style={[styles.moodIconWrapBlue, { backgroundColor: isDark ? "#1E40AF" : "#DBEAFE" }]}>
                <Ionicons name="location-outline" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationTitle, { color: colors.text }]}>
                  {shareLocationEnabled ? "No location shared yet" : "Location sharing is turned off"}
                </Text>
                <View style={styles.rowCenter}>
                  <Ionicons name="time-outline" size={14} color={colors.muted} />
                  <Text style={[styles.mutedText, { marginLeft: 6, color: colors.muted }]}>
                    {shareLocationEnabled
                      ? locationUpdatesEnabled
                        ? "Waiting for location updates"
                        : "Location updates are disabled in Settings"
                      : "Enable Share Location in Settings"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Your mood today</Text>
                <Text style={[styles.mutedText, { color: colors.muted }]}>{myMood?.mood ?? "Not set"}</Text>
              </View>
              <Ionicons name="pulse-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.moodRow}>
              {MOODS.map(mood => (
                <TouchableOpacity
                  key={mood}
                  onPress={() => handleMoodSelect(mood)}
                  disabled={savingMood || savingSnapshot}
                  style={[
                    styles.moodPill,
                    { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                    myMood?.mood === mood && { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                    (savingMood || savingSnapshot) && styles.disabledButton,
                  ]}
                >
                  <Text style={[styles.moodPillText, { color: colors.text }]}>{mood}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {savingMood ? <Text style={[styles.mutedText, { color: colors.muted }]}>Saving mood...</Text> : null}
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Daily snapshot</Text>
                <Text style={[styles.mutedText, { color: colors.muted }]}>One photo per day, expires in 24h</Text>
              </View>
              <Ionicons name="image-outline" size={20} color={colors.primary} />
            </View>

            {snapshot?.uri ? (
              <Image source={{ uri: snapshot.uri }} style={styles.snapshot} resizeMode="cover" />
            ) : (
              <View style={[styles.snapshotPlaceholder, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.mutedText, { color: colors.muted }]}>No snapshot uploaded today.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, (savingMood || savingSnapshot) && styles.disabledButton]}
              onPress={pickImage}
              disabled={savingMood || savingSnapshot}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.primaryButtonText}>{savingSnapshot ? "Saving snapshot..." : "Add / Replace snapshot"}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>Activity Feed</Text>
            {feed.length === 0 ? (
              <Text style={[styles.mutedText, { color: colors.muted }]}>No recent activity.</Text>
            ) : (
              feed.map(item => (
                <View key={item.id} style={styles.feedRow}>
                  <Text style={[styles.mutedText, { color: colors.text, flex: 1 }]}>{item.actorName}: {item.message}</Text>
                  <Text style={[styles.mutedText, { color: colors.muted }]}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </CoupleModeGate>
    </SafeAreaView>
  );
}

const palette = {
  primary: "#7C3AED",
  primarySoft: "#EDE9FE",
  border: "#E5E7EB",
  card: "#FFFFFF",
  background: "#F5F3FF",
  text: "#111827",
  muted: "#6B7280",
  heroStart: "#C084FC",
  heroEnd: "#8B5CF6",
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 18, fontWeight: "700", color: palette.text },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "red" },
  mutedText: { color: palette.muted },
  heroCard: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    gap: 12,
  },
  heroInner: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#C084FC",
  },
  screenTitle: { fontSize: 26, fontWeight: "800", color: palette.text },
  screenSubtitle: { color: palette.muted },
  heroName: { fontSize: 24, fontWeight: "800", color: "white" },
  heroTagline: { color: "#F5F3FF", marginTop: 4 },
  cardGroup: { gap: 8 },
  sectionLabel: { color: palette.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  moodCard: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#F6EDFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  moodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  moodIconWrapBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  moodTitle: { fontSize: 16, fontWeight: "700", color: palette.text },
  locationTitle: { fontSize: 16, fontWeight: "700", color: palette.text },
  rowCenter: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    gap: 12,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: palette.text },
  moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "white",
  },
  moodPillText: { textTransform: "capitalize", color: palette.text },
  snapshot: { width: "100%", height: 220, borderRadius: 12 },
  snapshotPlaceholder: {
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: { color: "white", fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
  feedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
