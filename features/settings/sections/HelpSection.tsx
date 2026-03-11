import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../../context/ThemeContext";

type Props = {
  onClearLocalCache: () => void;
  onSignOut: () => void;
  onDeleteAccountData: () => void;
  pending?: boolean;
};

export function HelpSection({ onClearLocalCache, onSignOut, onDeleteAccountData, pending = false }: Props) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeaderRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Help & Danger Zone</Text>
        <Ionicons name="warning-outline" size={20} color={colors.danger} />
      </View>
      <Text style={[styles.muted, { color: colors.muted }]}>Choose exactly what to reset or remove.</Text>

      <TouchableOpacity
        style={[styles.neutralButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }, pending && styles.disabledButton]}
        onPress={onClearLocalCache}
        disabled={pending}
      >
        <Text style={[styles.neutralButtonText, { color: colors.text }]}>Clear local cache</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.neutralButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }, pending && styles.disabledButton]}
        onPress={onSignOut}
        disabled={pending}
      >
        <Text style={[styles.neutralButtonText, { color: colors.text }]}>Sign out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.dangerButton, { backgroundColor: isDark ? "#4C1D1D" : "#FEE2E2" }, pending && styles.disabledButton]}
        onPress={onDeleteAccountData}
        disabled={pending}
      >
        <Text style={[styles.dangerButtonText, { color: colors.danger }]}>Delete account data</Text>
      </TouchableOpacity>
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
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  muted: { color: "#6B7280" },
  neutralButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  neutralButtonText: { fontWeight: "700" },
  dangerButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerButtonText: { color: "#EF4444", fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
});
