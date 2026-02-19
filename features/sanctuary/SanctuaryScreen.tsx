import React, { useEffect, useMemo, useState } from "react";
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
import { MoodEntry, MoodOption, Snapshot } from "../../models/types";
import { ensurePartnerMood, getMood, getTodaySnapshot, saveSnapshot, setMood } from "../../services/storage";
import { CoupleModeGate } from "../../components/CoupleModeGate";
import { useSpace } from "../../context/SpaceContext";
import { listMoods, listSnapshots, MoodRow, postMood, SnapshotRow, subscribeMoods, uploadSnapshot } from "../../services/supabaseRepo";

const MOODS: MoodOption[] = ["joyful", "calm", "neutral", "anxious", "low"];

const toMoodEntry = (row: MoodRow, isPartner = false): MoodEntry => ({
  date: row.created_at.slice(0, 10),
  mood: row.mood,
  isPartner,
  updatedAt: new Date(row.created_at).getTime(),
});

const toSnapshot = (row: SnapshotRow): Snapshot => ({
  id: row.id,
  uri: row.uri,
  createdAt: new Date(row.created_at).getTime(),
});

export function SanctuaryScreen() {
  const { mode, activeSpaceId, userId } = useSpace();
  const isCoupleActive = useMemo(() => mode === "couple" && !!activeSpaceId && !!userId, [activeSpaceId, mode, userId]);
  const [loading, setLoading] = useState(true);
  const [myMood, setMyMood] = useState<MoodEntry | null>(null);
  const [partnerMood, setPartnerMoodState] = useState<MoodEntry | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const partnerName = "Partner";
  const lastLocation = "Coffee Shop, Downtown";
  const lastLocationAgo = "Updated 1 hour ago";

  useEffect(() => {
    let isMounted = true;

    const loadSolo = async () => {
      const [mine, partner, snap] = await Promise.all([getMood(), ensurePartnerMood(), getTodaySnapshot()]);
      if (!isMounted) return;
      setMyMood(mine);
      setPartnerMoodState(partner);
      setSnapshot(snap);
    };

    const loadCouple = async () => {
      if (!activeSpaceId || !userId) return;
      const [{ moods, error: moodsError }, { snapshots, error: snapsError }] = await Promise.all([
        listMoods(activeSpaceId),
        listSnapshots(activeSpaceId),
      ]);
      if (moodsError) throw moodsError;
      if (snapsError) throw snapsError;
      if (!isMounted) return;
      const myRow = moods.find(row => row.user_id === userId) ?? null;
      const partnerRow = moods.find(row => row.user_id !== userId) ?? null;
      setMyMood(myRow ? toMoodEntry(myRow) : null);
      setPartnerMoodState(partnerRow ? toMoodEntry(partnerRow, true) : null);
      const latestSnapshot = snapshots[0];
      setSnapshot(latestSnapshot ? toSnapshot(latestSnapshot) : null);
    };

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isCoupleActive) {
          await loadCouple();
        } else {
          await loadSolo();
        }
      } catch (err) {
        setError("Failed to load sanctuary state.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [activeSpaceId, isCoupleActive, userId]);

  useEffect(() => {
    if (!isCoupleActive || !activeSpaceId) return;
    const unsubscribe = subscribeMoods(activeSpaceId, mood => {
      if (mood.user_id === userId) {
        setMyMood(toMoodEntry(mood));
      } else {
        setPartnerMoodState(toMoodEntry(mood, true));
      }
    });
    return () => unsubscribe();
  }, [activeSpaceId, isCoupleActive, userId]);

  const handleMoodSelect = async (mood: MoodOption) => {
    setLoading(true);
    try {
      if (isCoupleActive && activeSpaceId && userId) {
        const { mood: savedMood, error: moodError } = await postMood(activeSpaceId, userId, mood);
        if (moodError || !savedMood) throw moodError ?? new Error("Failed to save mood");
        setMyMood(toMoodEntry(savedMood));
      } else {
        await setMood(mood);
        const updated = await getMood();
        setMyMood(updated);
      }
    } catch (err) {
      setError("Could not save mood.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
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
    setLoading(true);
    try {
      if (isCoupleActive && activeSpaceId && userId) {
        const { uri: remoteUri, error: uploadError } = await uploadSnapshot(activeSpaceId, userId, uri);
        if (uploadError || !remoteUri) throw uploadError ?? new Error("Upload failed");
        setSnapshot({ id: `snapshot-${Date.now()}`, uri: remoteUri, createdAt: Date.now() });
      } else {
        const snap = await saveSnapshot(uri);
        setSnapshot(snap);
      }
    } catch {
      setError("Could not save snapshot.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <CoupleModeGate>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.topBar}>
            <AnchorLogo size={35} />
            <MenuButton color={palette.text} />
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.screenTitle}>Sanctuary</Text>
            <Text style={styles.screenSubtitle}>Your connection to {partnerName}</Text>

            <View style={styles.heroInner}>
              <Text style={styles.heroName}>{partnerName}</Text>
              <Text style={styles.heroTagline}>Always with you</Text>
            </View>
          </View>

          <View style={styles.cardGroup}>
            <Text style={styles.sectionLabel}>Current mood</Text>
            <View style={styles.moodCard}>
              <View style={styles.moodIconWrap}>
                <Ionicons name="book-outline" size={22} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moodTitle}>{partnerMood?.mood ?? "Waiting for partner"}</Text>
                <Text style={styles.mutedText}>
                  {partnerMood?.updatedAt ? new Date(partnerMood.updatedAt).toLocaleTimeString() : "No recent mood"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardGroup}>
            <Text style={styles.sectionLabel}>Last known location</Text>
            <View style={[styles.moodCard, { backgroundColor: "#EEF6FF", borderColor: "#DBEAFE" }]}>
              <View style={styles.moodIconWrapBlue}>
                <Ionicons name="location-outline" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>{lastLocation}</Text>
                <View style={styles.rowCenter}>
                  <Ionicons name="time-outline" size={14} color={palette.muted} />
                  <Text style={[styles.mutedText, { marginLeft: 6 }]}>{lastLocationAgo}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Your mood today</Text>
                <Text style={styles.mutedText}>{myMood?.mood ?? "Not set"}</Text>
              </View>
              <Ionicons name="pulse-outline" size={20} color={palette.primary} />
            </View>
            <View style={styles.moodRow}>
              {MOODS.map(mood => (
                <TouchableOpacity
                  key={mood}
                  onPress={() => handleMoodSelect(mood)}
                  style={[
                    styles.moodPill,
                    myMood?.mood === mood && { backgroundColor: palette.primarySoft, borderColor: palette.primary },
                  ]}
                >
                  <Text style={styles.moodPillText}>{mood}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Daily snapshot</Text>
                <Text style={styles.mutedText}>One photo per day, expires in 24h</Text>
              </View>
              <Ionicons name="image-outline" size={20} color={palette.primary} />
            </View>

            {snapshot ? (
              <Image source={{ uri: snapshot.uri }} style={styles.snapshot} resizeMode="cover" />
            ) : (
              <View style={styles.snapshotPlaceholder}>
                <Ionicons name="camera-outline" size={24} color={palette.muted} />
                <Text style={styles.mutedText}>No photo yet for today.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.primaryButtonText}>Add / Replace snapshot</Text>
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
});
