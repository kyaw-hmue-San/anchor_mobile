import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  mode: "solo" | "couple";
  activeSpaceId: string | null;
  spaceLoading: boolean;
  userId: string | null;
  spaceName: string;
  joinCode: string;
  lastCode: string | null;
  statusMsg: string | null;
  setSpaceName: (value: string) => void;
  setJoinCode: (value: string) => void;
  onSolo: () => void;
  onCoupleHint: () => void;
  onCreateSpace: () => void;
  onJoinSpace: () => void;
  onGenerateCode: () => void;
};

export function SpacesSection(props: Props) {
  const {
    mode,
    activeSpaceId,
    spaceLoading,
    userId,
    spaceName,
    joinCode,
    lastCode,
    statusMsg,
    setSpaceName,
    setJoinCode,
    onSolo,
    onCoupleHint,
    onCreateSpace,
    onJoinSpace,
    onGenerateCode,
  } = props;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Spaces</Text>
      <Text style={styles.muted}>Mode: {mode === "couple" ? "Couple (shared space)" : "Solo (local only)"}</Text>
      <Text style={styles.muted}>Active space: {activeSpaceId ?? "None"}</Text>

      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.modeButton, mode === "solo" && styles.modeButtonActive]} onPress={onSolo} disabled={spaceLoading}>
          <Text style={[styles.modeButtonText, mode === "solo" && styles.modeButtonTextActive]}>Solo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeButton, mode === "couple" && styles.modeButtonActive]} onPress={onCoupleHint} disabled={spaceLoading}>
          <Text style={[styles.modeButtonText, mode === "couple" && styles.modeButtonTextActive]}>Couple</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Space name"
        value={spaceName}
        onChangeText={setSpaceName}
        style={styles.input}
        placeholderTextColor="#6B7280"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={onCreateSpace} disabled={spaceLoading || !userId}>
        <Text style={styles.primaryButtonText}>Create space</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Pairing code"
        value={joinCode}
        onChangeText={setJoinCode}
        style={styles.input}
        placeholderTextColor="#6B7280"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={onJoinSpace} disabled={spaceLoading || !userId}>
        <Text style={styles.primaryButtonText}>Join space</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onGenerateCode} disabled={!activeSpaceId || spaceLoading}>
        <Text style={styles.secondaryButtonText}>Generate pairing code</Text>
      </TouchableOpacity>

      {lastCode ? <Text style={styles.codeBadge}>Share code: {lastCode}</Text> : null}
      {statusMsg ? <Text style={styles.statusText}>{statusMsg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  muted: { color: "#6B7280" },
  modeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  modeButtonActive: { backgroundColor: "#F3E8FF", borderColor: "#7C3AED" },
  modeButtonText: { color: "#111827", fontWeight: "700" },
  modeButtonTextActive: { color: "#7C3AED" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    backgroundColor: "#FFF",
    color: "#111827",
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "white", fontWeight: "700" },
  secondaryButton: {
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: { color: "#111827", fontWeight: "700" },
  codeBadge: { marginTop: 6, color: "#111827", fontWeight: "700" },
  statusText: { marginTop: 4, color: "#6B7280" },
});
