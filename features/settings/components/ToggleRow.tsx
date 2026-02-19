import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  label: string;
  subtitle: string;
  value: boolean;
  onPress: () => void;
};

export function ToggleRow({ label, subtitle, value, onPress }: Props) {
  return (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.toggleHitArea, styles.toggle, value ? styles.toggleOn : styles.toggleOff]}>
        <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E9D5FF",
    gap: 10,
  },
  itemLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  itemSubtitle: { color: "#6B7280", marginTop: 2, flexShrink: 1 },
  toggleHitArea: { minHeight: 44, minWidth: 44, justifyContent: "center" },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 16,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  toggleOn: { backgroundColor: "#7C3AED" },
  toggleOff: { backgroundColor: "#E5E7EB" },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
  },
  toggleThumbOn: { marginLeft: 18 },
  toggleThumbOff: { marginLeft: 0 },
});
