import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { EventCategory } from "../../../models/types";
import { useAppTheme } from "../../../context/ThemeContext";

type Props = {
  categories: EventCategory[];
  selected: EventCategory;
  onSelect: (category: EventCategory) => void;
};

export function CategoryChips({ categories, selected, onSelect }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.chipRow}>
      {categories.map(cat => (
        <TouchableOpacity
          key={cat}
          onPress={() => onSelect(cat)}
          style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }, selected === cat && [styles.chipActive, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]]}
        >
          <Text style={[styles.chipText, { color: colors.text }]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#F3E8FF", borderColor: "#7C3AED" },
  chipText: { textTransform: "capitalize" },
});
