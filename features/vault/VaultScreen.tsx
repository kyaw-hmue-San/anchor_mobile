import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { ConnectionStatusBanner } from "../../components/ConnectionStatusBanner";
import { Memory, MemoryTag, Snapshot } from "../../models/types";
import { addMemoryFromSnapshot, addNoteMemory, getTodaySnapshot, listMemories } from "../../services/storage";
import { useAppTheme } from "../../context/ThemeContext";
import { getFriendlyFirebaseError } from "../../services/firebaseErrors";

const memoryTags: MemoryTag[] = ["trip", "anniversary", "apology", "gift"];

export function VaultScreen() {
  const { colors } = useAppTheme();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [todaySnap, setTodaySnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [activeTag, setActiveTag] = useState<MemoryTag | "all">("all");
  const [draftTag, setDraftTag] = useState<MemoryTag>("anniversary");

  const load = async () => {
    setError(null);
    try {
      const [mems, snap] = await Promise.all([listMemories(), getTodaySnapshot()]);
      setMemories(mems);
      setTodaySnap(snap);
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not load Vault data."));
    }
  };

  useEffect(() => {
    load().finally(() => setInitialLoading(false));
  }, []);

  const onRetrySync = useCallback(async () => {
    setInitialLoading(true);
    await load();
    setInitialLoading(false);
  }, []);

  const addSnapshotMemory = async () => {
    if (savingNote || savingSnapshot) return;

    if (!todaySnap) {
      setError("No snapshot found for today. Add one in Sanctuary first.");
      return;
    }

    setError(null);
    setSavingSnapshot(true);
    try {
      await addMemoryFromSnapshot(todaySnap);
      await load();
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not save snapshot to Vault."));
    } finally {
      setSavingSnapshot(false);
    }
  };

  const addNote = async () => {
    if (savingNote || savingSnapshot) return;
    if (!noteTitle.trim()) return;

    setError(null);
    setSavingNote(true);
    try {
      await addNoteMemory(noteTitle.trim(), noteDesc.trim(), draftTag);
      setNoteTitle("");
      setNoteDesc("");
      await load();
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not save note to Vault."));
    } finally {
      setSavingNote(false);
    }
  };

  const filteredMemories = useMemo(
    () => (activeTag === "all" ? memories : memories.filter(item => item.tag === activeTag)),
    [activeTag, memories]
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top","left","right"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top","left","right"]}>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
          <View style={styles.topBar}>
            <AnchorLogo size={35} />
            <MenuButton color={colors.text} />
          </View>

          <ConnectionStatusBanner />

          <View style={styles.headerBlock}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>The Vault</Text>
            <Text style={[styles.muted, { color: colors.muted }]}>Treasured moments & love letters</Text>
          </View>

          {error ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.muted, { color: colors.danger }]}>{error}</Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onRetrySync}>
                <Text style={styles.primaryButtonText}>Retry sync</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={[styles.banner, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
            <View style={styles.bannerRow}>
              <Ionicons name="cloud-download-outline" size={18} color={colors.text} />
              <Text style={[styles.bannerTitle, { color: colors.text }]}>Available Offline</Text>
            </View>
            <Text style={[styles.bannerSubtitle, { color: colors.muted }]}>All memories are cached and accessible even without internet.</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Add note memory</Text>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </View>
            <TextInput
              placeholder="Title"
              value={noteTitle}
              onChangeText={setNoteTitle}
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholderTextColor={colors.muted}
              editable={!savingNote && !savingSnapshot}
            />
            <TextInput
              placeholder="Description"
              value={noteDesc}
              onChangeText={setNoteDesc}
              style={[styles.input, { minHeight: 90, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholderTextColor={colors.muted}
              multiline
              editable={!savingNote && !savingSnapshot}
            />
            <View style={styles.tagRow}>
              {memoryTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                    draftTag === tag && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                  ]}
                  onPress={() => setDraftTag(tag)}
                  disabled={savingNote || savingSnapshot}
                >
                  <Text style={[styles.muted, { color: draftTag === tag ? colors.primary : colors.text }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, (savingNote || savingSnapshot) && styles.disabledButton]}
              onPress={addNote}
              disabled={savingNote || savingSnapshot}
            >
              <Text style={styles.primaryButtonText}>{savingNote ? "Saving note..." : "Save note to Vault"}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Today’s snapshot</Text>
              <Ionicons name="image-outline" size={20} color={colors.primary} />
            </View>
            {todaySnap?.uri ? (
              <Image source={{ uri: todaySnap.uri }} style={styles.snapshot} resizeMode="cover" />
            ) : (
              <View style={[styles.emptySnapshot, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.muted, { color: colors.muted }]}>No snapshot for today yet.</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, (savingNote || savingSnapshot) && styles.disabledButton]}
              onPress={addSnapshotMemory}
              disabled={savingNote || savingSnapshot}
            >
              <Text style={styles.primaryButtonText}>{savingSnapshot ? "Saving snapshot..." : "Save snapshot to Vault"}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Memory Collections</Text>
            <View style={styles.tagRow}>
              <TouchableOpacity
                style={[
                  styles.tagChip,
                  { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                  activeTag === "all" && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                ]}
                onPress={() => setActiveTag("all")}
              >
                <Text style={[styles.muted, { color: activeTag === "all" ? colors.primary : colors.text }]}>all</Text>
              </TouchableOpacity>
              {memoryTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                    activeTag === tag && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                  ]}
                  onPress={() => setActiveTag(tag)}
                >
                  <Text style={[styles.muted, { color: activeTag === tag ? colors.primary : colors.text }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ gap: 12 }}>
            {filteredMemories.length === 0 ? (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.muted, { color: colors.muted }]}>No memories yet.</Text>
              </View>
            ) : (
              filteredMemories.map(item => (
                <MemoryCard key={item.id} memory={item} />
              ))
            )}
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  const { colors, isDark } = useAppTheme();
  const date = new Date(memory.createdAt);
  const label = memory.type === "note" ? "Memory Note" : "Snapshot";
  const initial = "Y";
  const preview = memory.description || "";
  return (
    <View style={[styles.memoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.memoryBadges}>
        <View style={[styles.pill, { backgroundColor: colors.primarySoft }]}> 
          <Text style={[styles.pillText, { color: colors.primary }]}>{label}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: isDark ? "#3F2A00" : "#FEF3C7" }]}> 
          <Text style={[styles.pillText, { color: "#92400E" }]}>Cached</Text>
        </View>
      </View>

      <Text style={[styles.memoryTitle, { color: colors.text }]}>{memory.title}</Text>
      {memory.tag ? <Text style={[styles.memoryMeta, { color: colors.primary }]}>{memory.tag}</Text> : null}
      {preview ? <Text style={[styles.memoryPreview, { color: colors.muted }]}>{preview.slice(0, 120)}{preview.length > 120 ? "…" : ""}</Text> : null}
      {memory.snapshotUri ? (
        <Image source={{ uri: memory.snapshotUri }} style={styles.memoryImage} resizeMode="cover" />
      ) : null}

      <View style={styles.memoryFooter}>
        <View style={styles.authorRow}>
          <Text style={[styles.memoryMeta, { color: colors.muted }]}>You • {date.toDateString()}</Text>
        </View>
        <View style={[styles.avatarBubble, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
      <View style={styles.memoryChevron}>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </View>
    </View>
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
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  screen: { flex: 1, backgroundColor: palette.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  muted: { color: palette.muted },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 18, fontWeight: "700", color: palette.text },
  headerBlock: { gap: 4 },
  screenTitle: { fontSize: 26, fontWeight: "800", color: palette.text },
  banner: {
    backgroundColor: "#EDE9FE",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    gap: 6,
  },
  bannerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bannerTitle: { fontWeight: "700", color: palette.text },
  bannerSubtitle: { color: palette.muted },
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
  disabledButton: { opacity: 0.6 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    minHeight: 34,
    justifyContent: "center",
  },
  primaryButtonText: { color: "white", fontWeight: "700" },
  snapshot: { width: "100%", height: 220, borderRadius: 12 },
  emptySnapshot: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
  },
  memoryCard: {
    position: "relative",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  memoryBadges: { flexDirection: "row", gap: 8 },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: { fontWeight: "700", color: palette.primary },
  memoryTitle: { fontWeight: "800", fontSize: 18, color: palette.text },
  memoryPreview: { color: palette.muted, lineHeight: 20 },
  memoryImage: { width: "100%", height: 160, borderRadius: 12 },
  memoryFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  memoryMeta: { color: palette.muted },
  avatarBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "white", fontWeight: "800" },
  memoryChevron: { position: "absolute", top: 16, right: 16 },
});
