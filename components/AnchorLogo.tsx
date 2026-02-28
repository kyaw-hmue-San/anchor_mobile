import React from "react";
import { View, Text, StyleSheet } from "react-native";

export type AnchorLogoProps = {
  size?: number;
  showWordmark?: boolean;
  wordmarkColor?: string;
};

export function AnchorLogo({ size = 28, showWordmark = false, wordmarkColor = "#111827" }: AnchorLogoProps) {
  const badgeSize = size;
  const iconSize = Math.max(12, Math.round(size * 0.52));

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { width: badgeSize, height: badgeSize, borderRadius: Math.round(badgeSize * 0.26) }]}>
        <Text style={[styles.icon, { fontSize: iconSize }]}>⚓</Text>
      </View>
      {showWordmark ? <Text style={[styles.wordmark, { color: wordmarkColor }]}>Anchor</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: {
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { color: "#7C3AED" },
  wordmark: { fontSize: 18, fontWeight: "800" },
});
