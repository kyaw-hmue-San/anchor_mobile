import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onReset: () => void;
};

export function HelpSection({ onReset }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Help & Danger Zone</Text>
        <Ionicons name="warning-outline" size={20} color="#EF4444" />
      </View>
      <Text style={styles.muted}>Need a fresh start? This clears local data only.</Text>
      <TouchableOpacity style={styles.dangerButton} onPress={onReset}>
        <Text style={styles.dangerButtonText}>Reset all data</Text>
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
  dangerButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerButtonText: { color: "#EF4444", fontWeight: "700" },
});
