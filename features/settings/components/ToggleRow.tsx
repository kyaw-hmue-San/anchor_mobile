import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import { useAppTheme } from "../../../context/ThemeContext";

type Props = {
  label: string;
  subtitle: string;
  value: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function ToggleRow({ label, subtitle, value, onPress, disabled = false }: Props) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.itemRow, { borderTopColor: colors.border }, disabled && styles.itemRowDisabled]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.itemSubtitle, { color: colors.muted }]} numberOfLines={2}>{subtitle}</Text>
      </View>
      <View style={styles.switchWrap}>
        <Text style={[styles.switchLabel, value ? styles.switchLabelOn : styles.switchLabelOff]}>{value ? "ON" : "OFF"}</Text>
        <Switch
          value={value}
          onValueChange={onPress}
          disabled={disabled}
          trackColor={{ false: colors.border, true: "#A78BFA" }}
          thumbColor={value ? "#7C3AED" : "#F9FAFB"}
          ios_backgroundColor={colors.border}
        />
      </View>
    </TouchableOpacity>
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
    gap: 10,
  },
  itemRowDisabled: {
    opacity: 0.6,
  },
  itemLabel: { fontSize: 15, fontWeight: "700" },
  itemSubtitle: { marginTop: 2, flexShrink: 1 },
  switchWrap: {
    minHeight: 44,
    minWidth: 84,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  switchLabelOn: {
    color: "#7C3AED",
  },
  switchLabelOff: {
    color: "#6B7280",
  },
});
