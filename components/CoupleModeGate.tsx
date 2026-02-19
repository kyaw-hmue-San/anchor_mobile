import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSpace } from "../context/SpaceContext";
import { ROUTES } from "../main/navigation/routes";

export function CoupleModeGate({ children }: { children: React.ReactNode }) {
  const { mode, activeSpaceId } = useSpace();
  const navigation = useNavigation();

  if (mode === "couple" && !activeSpaceId) {
    return (
      <View style={styles.gate}>
        <View style={styles.iconCircle}>
          <Ionicons name="link-outline" size={22} color="#7C3AED" />
        </View>
        <Text style={styles.title}>Pairing needed</Text>
        <Text style={styles.subtitle}>You are in couple mode but no shared space is active. Create or join a space from Settings.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate(ROUTES.Settings as never)}>
          <Text style={styles.primaryButtonText}>Go to Settings</Text>
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
