import React, { useEffect, useState } from "react";
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Memory, Snapshot } from "../../models/types";
import { addMemoryFromSnapshot, addNoteMemory, getTodaySnapshot, listMemories } from "../../services/storage";

export function VaultScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [todaySnap, setTodaySnap] = useState<Snapshot | null>(null);

  const load = async () => {
    const [mems, snap] = await Promise.all([listMemories(), getTodaySnapshot()]);
    setMemories(mems);
    setTodaySnap(snap);
  };

  useEffect(() => {
    load();
  }, []);

  const addSnapshotMemory = async () => {
    if (!todaySnap) return;
    await addMemoryFromSnapshot(todaySnap);
    await load();
  };

  const addNote = async () => {
    if (!noteTitle.trim()) return;
    await addNoteMemory(noteTitle.trim(), noteDesc.trim());
    setNoteTitle("");
    setNoteDesc("");
    await load();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Text style={styles.screenTitle}>The Vault</Text>
        <Text style={styles.muted}>Treasured moments & love letters</Text>
      </View>

      <View style={styles.banner}>
        <View style={styles.bannerRow}>
          <Ionicons name="cloud-download-outline" size={18} color={palette.text} />
          <Text style={styles.bannerTitle}>Available Offline</Text>
        </View>
        <Text style={styles.bannerSubtitle}>All memories are cached and accessible even without internet</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Add note memory</Text>
          <Ionicons name="create-outline" size={20} color={palette.primary} />
        </View>
        <TextInput
          placeholder="Title"
          value={noteTitle}
          onChangeText={setNoteTitle}
          style={styles.input}
          placeholderTextColor={palette.muted}
        />
        <TextInput
          placeholder="Description"
          value={noteDesc}
          onChangeText={setNoteDesc}
          style={[styles.input, { minHeight: 90 }]}
          placeholderTextColor={palette.muted}
          multiline
        />
        <TouchableOpacity style={styles.primaryButton} onPress={addNote}>
          <Text style={styles.primaryButtonText}>Save note to Vault</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Today’s snapshot</Text>
          <Ionicons name="image-outline" size={20} color={palette.primary} />
        </View>
        {todaySnap ? (
          <>
            <Image source={{ uri: todaySnap.uri }} style={styles.snapshot} resizeMode="cover" />
            <TouchableOpacity style={styles.primaryButton} onPress={addSnapshotMemory}>
              <Text style={styles.primaryButtonText}>Save snapshot to Vault</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.muted}>No snapshot today to save.</Text>
        )}
      </View>

      <View style={{ gap: 12 }}>
        {memories.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.muted}>No memories yet.</Text>
          </View>
        ) : (
          memories.map(item => (
            <MemoryCard key={item.id} memory={item} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  const date = new Date(memory.createdAt);
  const label = memory.type === "note" ? "Memory Note" : "Snapshot";
  const initial = "Y";
  const preview = memory.description || "";
  return (
    <View style={styles.memoryCard}>
      <View style={styles.memoryBadges}>
        <View style={[styles.pill, { backgroundColor: palette.primarySoft }]}> 
          <Text style={styles.pillText}>{label}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: "#FEF3C7" }]}> 
          <Text style={[styles.pillText, { color: "#92400E" }]}>Cached</Text>
        </View>
      </View>

      <Text style={styles.memoryTitle}>{memory.title}</Text>
      {preview ? <Text style={styles.memoryPreview}>{preview.slice(0, 120)}{preview.length > 120 ? "…" : ""}</Text> : null}
      {memory.snapshotUri ? (
        <Image source={{ uri: memory.snapshotUri }} style={styles.memoryImage} resizeMode="cover" />
      ) : null}

      <View style={styles.memoryFooter}>
        <View style={styles.authorRow}>
          <Text style={styles.memoryMeta}>You • {date.toDateString()}</Text>
        </View>
        <View style={styles.avatarBubble}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
      <View style={styles.memoryChevron}>
        <Ionicons name="chevron-forward" size={16} color={palette.primary} />
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
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  muted: { color: palette.muted },
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
  primaryButtonText: { color: "white", fontWeight: "700" },
  snapshot: { width: "100%", height: 220, borderRadius: 12 },
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
