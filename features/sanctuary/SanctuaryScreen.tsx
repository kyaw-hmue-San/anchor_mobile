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
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { ConnectionStatusBanner } from "../../components/ConnectionStatusBanner";
import { MoodEntry, MoodOption, PartnerPresence, SharedLocation, Snapshot } from "../../models/types";
import {
  ensurePartnerMood,
  getMood,
  getPartnerDisplayName,
  getPartnerLocation,
  getPartnerSnapshot,
  getPartnerPresenceSummary,
  saveMyLocation,
  saveSnapshot,
  subscribeToPartnerEventActivity,
  subscribeToPartnerLocation,
  subscribeToPartnerMood,
  subscribeToPartnerSnapshot,
  setMood,
} from "../../services/storage";
import { CoupleModeGate } from "../../components/CoupleModeGate";
import { getAppSettings } from "../../services/appSettings";
import { useAppTheme } from "../../context/ThemeContext";
import { getFriendlyFirebaseError } from "../../services/firebaseErrors";
import { ensureLocationPermission } from "../../services/permissions";
import { PartnerLocationMap } from "./components/PartnerLocationMap";

const MOODS: MoodOption[] = ["joyful", "calm", "neutral", "anxious", "low"];

export function SanctuaryScreen() {
  const { colors, isDark } = useAppTheme();

  const [initialLoading, setInitialLoading] = useState(true);
  const [savingMood, setSavingMood] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [myMood, setMyMood] = useState<MoodEntry | null>(null);
  const [partnerMood, setPartnerMoodState] = useState<MoodEntry | null>(null);
  const [partnerSnapshot, setPartnerSnapshot] = useState<Snapshot | null>(null);
  const [partnerName, setPartnerName] = useState("Partner");
  const [shareLocationEnabled, setShareLocationEnabled] = useState(false);
  const [locationUpdatesEnabled, setLocationUpdatesEnabled] = useState(true);
  const [partnerLocation, setPartnerLocation] = useState<SharedLocation | null>(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presence, setPresence] = useState<PartnerPresence>({ moodUpdatedAt: null, snapshotSavedAt: null, eventUpdatedAt: null });
  const [lastLiveUpdateAt, setLastLiveUpdateAt] = useState<number | null>(null);

  const refreshPartnerSignals = async () => {
    const [partner, presenceSummary, latestPartnerLocation, latestPartnerSnapshot, partnerDisplayName] = await Promise.all([
      ensurePartnerMood(),
      getPartnerPresenceSummary(),
      getPartnerLocation(),
      getPartnerSnapshot(),
      getPartnerDisplayName(),
    ]);

    setPartnerMoodState(partner);
    setPresence(presenceSummary);
    setPartnerLocation(latestPartnerLocation);
    setPartnerSnapshot(latestPartnerSnapshot);
    setPartnerName(partnerDisplayName?.trim() || "Partner");
    setLastLiveUpdateAt(Date.now());
  };

  const loadSanctuaryState = async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const [mine, snap, appSettings] = await Promise.all([
        getMood(),
        getPartnerSnapshot(),
        getAppSettings(),
      ]);
      setMyMood(mine);
      setPartnerSnapshot(snap);
      setShareLocationEnabled(appSettings.shareLocation);
      setLocationUpdatesEnabled(appSettings.locationUpdates);
      await refreshPartnerSignals();
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Failed to load sanctuary state."));
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    void loadSanctuaryState();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    const start = async () => {
      try {
        unsubscribe = await subscribeToPartnerLocation(
          location => {
            if (!active) return;
            setPartnerLocation(location);
            setLastLiveUpdateAt(Date.now());
          },
          () => {
            // Keep the last known location on transient listener failures.
          }
        );
      } catch {
        // If subscription setup fails, polling still keeps data fresh.
      }
    };

    void start();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    const start = async () => {
      try {
        unsubscribe = await subscribeToPartnerMood(
          mood => {
            if (!active) return;
            setPartnerMoodState(mood);
            setPresence(prev => ({
              ...prev,
              moodUpdatedAt: mood?.updatedAt ?? null,
            }));
            setLastLiveUpdateAt(Date.now());
          },
          () => {
            // Keep the last known mood on transient listener failures.
          }
        );
      } catch {
        // Initial load and manual sync still provide fallback data.
      }
    };

    void start();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    const start = async () => {
      try {
        unsubscribe = await subscribeToPartnerSnapshot(
          snapshot => {
            if (!active) return;
            setPartnerSnapshot(snapshot);
            setPresence(prev => ({
              ...prev,
              snapshotSavedAt: snapshot?.createdAt ?? null,
            }));
            setLastLiveUpdateAt(Date.now());
          },
          () => {
            // Keep last known partner snapshot on transient listener failures.
          }
        );
      } catch {
        // If subscription setup fails, polling still keeps data fresh.
      }
    };

    void start();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    const start = async () => {
      try {
        unsubscribe = await subscribeToPartnerEventActivity(
          updatedAt => {
            if (!active) return;
            setPresence(prev => ({
              ...prev,
              eventUpdatedAt: updatedAt,
            }));
            setLastLiveUpdateAt(Date.now());
          },
          () => {
            // Keep the last known event activity on transient listener failures.
          }
        );
      } catch {
        // Initial load and manual sync still provide fallback data.
      }
    };

    void start();

    return () => {
      active = false;
      unsubscribe?.();
    };
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
      const updated = await getMood();
      setMyMood(updated);
      await refreshPartnerSignals();
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
      await saveSnapshot(uri);
      await refreshPartnerSignals();
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not save snapshot."));
    } finally {
      setSavingSnapshot(false);
    }
  };

  const shareCurrentLocation = async () => {
    if (sharingLocation || savingMood || savingSnapshot) return;
    if (!shareLocationEnabled) {
      setError("Turn on Share Location in Settings first.");
      return;
    }

    setSharingLocation(true);
    setError(null);

    try {
      const perm = await ensureLocationPermission();
      if (!perm.granted) {
        setError(perm.message || "Location permission is required.");
        return;
      }

      // Push a recent cached fix first so partner can see updates with less delay.
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 60_000,
        requiredAccuracy: 200,
      });

      if (lastKnown) {
        await saveMyLocation(
          lastKnown.coords.latitude,
          lastKnown.coords.longitude,
          typeof lastKnown.coords.accuracy === "number" ? lastKnown.coords.accuracy : null
        );
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await saveMyLocation(
        current.coords.latitude,
        current.coords.longitude,
        typeof current.coords.accuracy === "number" ? current.coords.accuracy : null
      );

      await refreshPartnerSignals();
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not share your current location."));
    } finally {
      setSharingLocation(false);
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
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>{partnerName}'s current mood</Text>
            <View style={[styles.moodCard, { borderColor: colors.border, backgroundColor: isDark ? colors.surfaceAlt : "#F6EDFF" }] }>
              <View style={[styles.moodIconWrap, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="book-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.moodTitle, { color: colors.text }]}>{partnerMood?.mood ?? `${partnerName} has not checked in yet`}</Text>
                <Text style={[styles.mutedText, { color: colors.muted }]}>
                  {partnerMood?.updatedAt ? new Date(partnerMood.updatedAt).toLocaleTimeString() : "No recent mood"}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>Partner Presence Timeline</Text>
            <Text style={[styles.mutedText, { color: colors.muted }]}>
              Live updates: {lastLiveUpdateAt ? new Date(lastLiveUpdateAt).toLocaleTimeString() : "Waiting for partner activity"}
            </Text>
            <Text style={[styles.mutedText, { color: colors.muted }]}>Mood update: {presence.moodUpdatedAt ? new Date(presence.moodUpdatedAt).toLocaleString() : "No update yet"}</Text>
            <Text style={[styles.mutedText, { color: colors.muted }]}>Snapshot: {presence.snapshotSavedAt ? new Date(presence.snapshotSavedAt).toLocaleString() : "No snapshot yet"}</Text>
            <Text style={[styles.mutedText, { color: colors.muted }]}>Event activity: {presence.eventUpdatedAt ? new Date(presence.eventUpdatedAt).toLocaleString() : "No event activity yet"}</Text>
          </View>

          <View style={styles.cardGroup}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Last known location</Text>
            <View style={[styles.moodCard, { backgroundColor: isDark ? "#1E3A8A" : "#EEF6FF", borderColor: isDark ? "#1D4ED8" : "#DBEAFE" }]}>
              <View style={[styles.moodIconWrapBlue, { backgroundColor: isDark ? "#1E40AF" : "#DBEAFE" }]}>
                <Ionicons name="location-outline" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationTitle, { color: colors.text }]}>
                  {shareLocationEnabled
                    ? partnerLocation
                      ? "Partner location received"
                      : "No location shared yet"
                    : "Location sharing is turned off"}
                </Text>
                <View style={styles.rowCenter}>
                  <Ionicons name="time-outline" size={14} color={colors.muted} />
                  <Text style={[styles.mutedText, { marginLeft: 6, color: colors.muted }]}>
                    {shareLocationEnabled
                      ? locationUpdatesEnabled
                        ? partnerLocation
                          ? `Updated ${new Date(partnerLocation.updatedAt).toLocaleTimeString()}`
                          : "Waiting for location updates"
                        : "Location updates are disabled in Settings"
                      : "Enable Share Location in Settings"}
                  </Text>
                </View>

                {partnerLocation ? (
                  <PartnerLocationMap
                    latitude={partnerLocation.latitude}
                    longitude={partnerLocation.longitude}
                    partnerName={partnerName}
                  />
                ) : null}

                <TouchableOpacity
                  style={[styles.secondaryAction, { borderColor: colors.border }, sharingLocation && styles.disabledButton]}
                  onPress={shareCurrentLocation}
                  disabled={sharingLocation}
                >
                  <Text style={[styles.mutedText, { color: colors.text }]}>
                    {sharingLocation ? "Sharing location..." : "Share my current location"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Your current mood</Text>
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
                <Text style={[styles.cardTitle, { color: colors.text }]}>{partnerName}'s snapshot</Text>
                <Text style={[styles.mutedText, { color: colors.muted }]}>Latest partner photo in the last 24 hours</Text>
              </View>
              <Ionicons name="image-outline" size={20} color={colors.primary} />
            </View>

            {partnerSnapshot?.uri ? (
              <>
                <Image source={{ uri: partnerSnapshot.uri }} style={styles.snapshot} resizeMode="cover" />
                <Text style={[styles.mutedText, { color: colors.muted }]}>Updated {new Date(partnerSnapshot.createdAt).toLocaleTimeString()}</Text>
              </>
            ) : (
              <View style={[styles.snapshotPlaceholder, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.mutedText, { color: colors.muted }]}>{partnerName} has not shared a snapshot yet.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, (savingMood || savingSnapshot) && styles.disabledButton]}
              onPress={pickImage}
              disabled={savingMood || savingSnapshot}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.primaryButtonText}>{savingSnapshot ? "Sharing snapshot..." : "Share my snapshot"}</Text>
            </TouchableOpacity>
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
  secondaryAction: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 34,
    justifyContent: "center",
    marginTop: 10,
  },
});
