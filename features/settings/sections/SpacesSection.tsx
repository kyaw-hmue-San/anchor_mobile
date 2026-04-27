import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useAppTheme } from "../../../context/ThemeContext";

type Props = {
  activeSpaceId: string | null;
  activeSpaceName: string | null;
  spaceLoading: boolean;
  loadingAction: "create" | "join" | "generate" | null;
  userId: string | null;
  spaceName: string;
  joinCode: string;
  lastCode: string | null;
  statusMsg: string | null;
  setSpaceName: (value: string) => void;
  setJoinCode: (value: string) => void;
  onCreateSpace: () => void;
  onJoinSpace: () => void;
  onGenerateCode: () => void;
  onCopyCode: (value: string) => void;
};

export function SpacesSection(props: Props) {
  const { colors } = useAppTheme();

  const {
    activeSpaceId,
    activeSpaceName,
    spaceLoading,
    loadingAction,
    userId,
    spaceName,
    joinCode,
    lastCode,
    statusMsg,
    setSpaceName,
    setJoinCode,
    onCreateSpace,
    onJoinSpace,
    onGenerateCode,
    onCopyCode,
  } = props;

  const hasActiveSpace = !!activeSpaceId;
  const createDisabled = spaceLoading || hasActiveSpace;

  const renderButtonLabel = (label: string, action: "create" | "join" | "generate") => {
    if (loadingAction !== action) return <Text style={styles.primaryButtonText}>{label}</Text>;

    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color="white" />
        <Text style={styles.primaryButtonText}>{label.replace(/^[a-z]/, char => char.toUpperCase())}...</Text>
      </View>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Spaces</Text>
      <Text style={[styles.muted, { color: colors.muted }]}>Mode: Couple (shared space required)</Text>
      <Text style={[styles.muted, { color: colors.muted }]}>Active space: {activeSpaceName ?? activeSpaceId ?? "None"}</Text>
      {!userId ? <Text style={styles.warningText}>Sign in to create or join shared spaces.</Text> : null}

      <TextInput
        placeholder="Space name"
        value={spaceName}
        onChangeText={setSpaceName}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        editable={!createDisabled}
      />
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }, createDisabled && styles.disabledButton]}
        onPress={onCreateSpace}
        disabled={createDisabled}
      >
        {renderButtonLabel("Create space", "create")}
      </TouchableOpacity>
      {hasActiveSpace ? <Text style={[styles.statusText, { color: colors.muted }]}>You already have an active space. Creating another space is disabled.</Text> : null}

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
        {renderButtonLabel("Join space", "join")}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }, (!activeSpaceId || spaceLoading) && styles.disabledButton]}
        onPress={onGenerateCode}
        disabled={!activeSpaceId || spaceLoading}
      >
        {loadingAction === "generate" ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Generating...</Text>
          </View>
        ) : (
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Generate pairing code</Text>
        )}
      </TouchableOpacity>

      {lastCode ? (
        <View style={styles.codeRow}>
          <Text style={[styles.codeBadge, { color: colors.text }]}>Share code: {lastCode}</Text>
          <TouchableOpacity style={[styles.copyButton, { borderColor: colors.border }]} onPress={() => onCopyCode(lastCode)}>
            <Text style={[styles.copyButtonText, { color: colors.text }]}>Share</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  codeRow: { marginTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  codeBadge: { flex: 1, color: "#111827", fontWeight: "700" },
  copyButton: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copyButtonText: { fontWeight: "700" },
  statusText: { marginTop: 4, color: "#6B7280" },
  disabledButton: { opacity: 0.55 },
});
