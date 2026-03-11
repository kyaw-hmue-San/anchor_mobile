import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../../../context/ThemeContext";

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
  const { colors } = useAppTheme();

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
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Spaces</Text>
      <Text style={[styles.muted, { color: colors.muted }]}>Mode: {mode === "couple" ? "Couple (shared space)" : "Solo (local only)"}</Text>
      <Text style={[styles.muted, { color: colors.muted }]}>Active space: {activeSpaceId ?? "None"}</Text>
      {!userId ? <Text style={styles.warningText}>Sign in to create or join shared spaces.</Text> : null}

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeButton, { borderColor: colors.border, backgroundColor: colors.surface }, mode === "solo" && styles.modeButtonActive, spaceLoading && styles.disabledButton]}
          onPress={onSolo}
          disabled={spaceLoading}
        >
          <Text style={[styles.modeButtonText, { color: colors.text }, mode === "solo" && styles.modeButtonTextActive]}>Solo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, { borderColor: colors.border, backgroundColor: colors.surface }, mode === "couple" && styles.modeButtonActive, spaceLoading && styles.disabledButton]}
          onPress={onCoupleHint}
          disabled={spaceLoading}
        >
          <Text style={[styles.modeButtonText, { color: colors.text }, mode === "couple" && styles.modeButtonTextActive]}>Couple</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Space name"
        value={spaceName}
        onChangeText={setSpaceName}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        editable={!spaceLoading}
      />
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }, spaceLoading && styles.disabledButton]}
        onPress={onCreateSpace}
        disabled={spaceLoading}
      >
        <Text style={styles.primaryButtonText}>Create space</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Pairing code"
        value={joinCode}
        onChangeText={setJoinCode}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        editable={!spaceLoading}
      />
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }, spaceLoading && styles.disabledButton]}
        onPress={onJoinSpace}
        disabled={spaceLoading}
      >
        <Text style={styles.primaryButtonText}>Join space</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }, (!activeSpaceId || spaceLoading) && styles.disabledButton]}
        onPress={onGenerateCode}
        disabled={!activeSpaceId || spaceLoading}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Generate pairing code</Text>
      </TouchableOpacity>

      {lastCode ? <Text style={[styles.codeBadge, { color: colors.text }]}>Share code: {lastCode}</Text> : null}
      {statusMsg ? <Text style={[styles.statusText, { color: colors.muted }]}>{statusMsg}</Text> : null}
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
  warningText: { color: "#92400E", fontWeight: "600" },
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
  modeButtonText: { fontWeight: "700" },
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
  disabledButton: { opacity: 0.55 },
});
