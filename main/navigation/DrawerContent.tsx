import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerContentComponentProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useSpace } from "../../context/SpaceContext";
import { useAppTheme } from "../../context/ThemeContext";

type Props = DrawerContentComponentProps & {
  onSignOut: () => Promise<void>;
};

export function DrawerContent(props: Props) {
  const { session, activeSpaceId, activeSpaceName, spaceMemberCount } = useSpace();
  const { colors, isDark } = useAppTheme();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.surface }] }>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Anchor</Text>
        <Text style={[styles.email, { color: colors.muted }]}>{session?.user?.email ?? "Not signed in"}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          {`Mode: Couple • members: ${spaceMemberCount}${activeSpaceName || activeSpaceId ? ` • ${activeSpaceName ?? activeSpaceId}` : ""}`}
        </Text>
      </View>

      <DrawerItemList {...props} />

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <DrawerItem
          label="Sign out"
          onPress={props.onSignOut}
          icon={({ size }) => <Ionicons name="log-out-outline" color={colors.danger} size={size} />}
          labelStyle={[styles.signOutLabel, { color: colors.danger }]}
          style={[styles.signOutItem, { backgroundColor: isDark ? "#3A1C1C" : "#FEE2E2" }]}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  email: { color: "#6B7280", marginTop: 2 },
  meta: { color: "#6B7280", marginTop: 2, fontSize: 12 },
  footer: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  signOutItem: { marginTop: 4, borderRadius: 10 },
  signOutLabel: { fontWeight: "700" },
});
