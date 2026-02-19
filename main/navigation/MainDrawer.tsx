
import React from "react";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { MainTabs } from "./MainTabs";
import { SettingsScreen } from "../../features/settings/SettingsScreen";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";

const Drawer = createDrawerNavigator();

export function MainDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, drawerStyle: styles.drawer }}
      drawerContent={props => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={MainTabs} />
      <Drawer.Screen
        name="Spaces & Couple"
        component={SettingsScreen}
        initialParams={{ initialSection: "spaces" }}
      />
      <Drawer.Screen
        name="App Settings"
        component={SettingsScreen}
        initialParams={{ initialSection: "app" }}
      />
      <Drawer.Screen
        name="Help & FAQ"
        component={SettingsScreen}
        initialParams={{ initialSection: "help" }}
      />
    </Drawer.Navigator>
  );
}

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline",
  "Spaces & Couple": "heart-outline",
  "App Settings": "settings-outline",
  "Help & FAQ": "help-circle-outline",
};

function DrawerContent(props: any) {
  const { state, navigation } = props;
  const currentRoute = state.routeNames[state.index];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      {state.routeNames.map((name: string) => (
        <DrawerItem
          key={name}
          label={() => (
            <View style={styles.itemRow}>
              <Ionicons
                name={iconMap[name] ?? "ellipse-outline"}
                size={20}
                color={name === currentRoute ? palette.primary : palette.muted}
                style={styles.itemIcon}
              />
              <View>
                <Text style={[styles.itemLabel, name === currentRoute && styles.itemLabelActive]}>{name}</Text>
              </View>
            </View>
          )}
          onPress={() => navigation.navigate(name)}
          style={[styles.item, name === currentRoute && styles.itemActive]}
        />
      ))}
    </DrawerContentScrollView>
  );
}

const palette = {
  primary: "#7C3AED",
  muted: "#6B7280",
  border: "#E5E7EB",
  card: "#FFFFFF",
  background: "#F9FAFB",
};

const styles = StyleSheet.create({
  drawer: { backgroundColor: palette.card, width: 300 },
  drawerContent: { paddingTop: 24, paddingHorizontal: 12 },
  headerRow: { paddingHorizontal: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  item: {
    borderRadius: 12,
    marginHorizontal: 4,
  },
  itemActive: {
    backgroundColor: "#F3E8FF",
  },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemIcon: { width: 22 },
  itemLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  itemLabelActive: { color: palette.primary },
});
