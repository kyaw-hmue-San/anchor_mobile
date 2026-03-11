import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSpace } from "../context/SpaceContext";
import { ROUTES } from "../main/navigation/routes";
import { useAppTheme } from "../context/ThemeContext";

export function CoupleModeGate({ children }: { children: React.ReactNode }) {
  const { mode, activeSpaceId } = useSpace();
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();

  if (mode === "couple" && !activeSpaceId) {
    return (
      <View style={[styles.gate, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.surfaceAlt : "#EEF2FF" }]}>
          <Ionicons name="link-outline" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Pairing needed</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>You are in couple mode but no shared space is active. Create or join a space from Settings.</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate(ROUTES.Spaces as never)}>
          <Text style={styles.primaryButtonText}>Go to Spaces</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  subtitle: { color: "#4B5563", textAlign: "center" },
  primaryButton: {
    marginTop: 4,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: "white", fontWeight: "700" },
});
