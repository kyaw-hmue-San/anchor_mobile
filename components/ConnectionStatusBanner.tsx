import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSpace } from "../context/SpaceContext";
import { getAppSettings } from "../services/appSettings";
import { useAppTheme } from "../context/ThemeContext";

export function ConnectionStatusBanner() {
  const { activeSpaceId, spaceMemberCount, isCoupleConnected } = useSpace();
  const { colors, isDark } = useAppTheme();
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await getAppSettings();
        setShowOnlineStatus(settings.showOnlineStatus);
      } catch {
        setShowOnlineStatus(true);
      }
    };

    load();
  }, []);

  if (!showOnlineStatus) return null;

  if (!activeSpaceId) {
    return (
      <View style={[styles.banner, styles.waiting, { backgroundColor: isDark ? "#3F2A00" : "#FFFBEB", borderColor: isDark ? "#5B4410" : "#FDE68A" }]}>
        <Ionicons name="link-outline" size={16} color="#92400E" />
        <Text style={[styles.text, { color: colors.text }]}>No active shared space yet</Text>
      </View>
    );
  }

  if (!isCoupleConnected) {
    return (
      <View style={[styles.banner, styles.waiting, { backgroundColor: isDark ? "#3F2A00" : "#FFFBEB", borderColor: isDark ? "#5B4410" : "#FDE68A" }]}>
        <Ionicons name="time-outline" size={16} color="#92400E" />
        <Text style={[styles.text, { color: colors.text }]}>Waiting for partner • members: {spaceMemberCount}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.connected, { backgroundColor: isDark ? "#0B3A2A" : "#ECFDF5", borderColor: isDark ? "#1E5C44" : "#A7F3D0" }]}>
      <Ionicons name="checkmark-circle-outline" size={16} color="#065F46" />
      <Text style={[styles.text, { color: colors.text }]}>Connected as couple • members: {spaceMemberCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waiting: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  connected: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  text: { fontWeight: "600" },
});
