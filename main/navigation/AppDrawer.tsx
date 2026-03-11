import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MainTabs } from "./MainTabs";
import { SpacesScreen } from "../../features/settings/SpacesScreen";
import { ProfileScreen } from "../../features/settings/ProfileScreen";
import { SettingsScreen } from "../../features/settings/SettingsScreen";
import { HelpScreen } from "../../features/settings/HelpScreen";
import { ROUTES } from "./routes";
import { DrawerContent } from "./DrawerContent";
import { useSpace } from "../../context/SpaceContext";
import { useAppTheme } from "../../context/ThemeContext";

const Drawer = createDrawerNavigator();

export function AppDrawer() {
  const { signOut } = useSpace();
  const { colors } = useAppTheme();

  return (
    <Drawer.Navigator
      drawerContent={props => <DrawerContent {...props} onSignOut={signOut} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
        drawerActiveBackgroundColor: colors.primarySoft,
        drawerInactiveBackgroundColor: "transparent",
        drawerItemStyle: { borderRadius: 10, marginHorizontal: 8 },
        drawerLabelStyle: { fontWeight: "600" },
        drawerStyle: { backgroundColor: colors.surface },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={MainTabs}
        options={{ drawerLabel: "Home" }}
      />
      <Drawer.Screen
        name={ROUTES.Profile}
        component={ProfileScreen}
        options={{ drawerLabel: "Profile" }}
      />
      <Drawer.Screen
        name={ROUTES.Spaces}
        component={SpacesScreen}
        options={{ drawerLabel: "Spaces" }}
      />
      <Drawer.Screen
        name={ROUTES.Settings}
        component={SettingsScreen}
        options={{ drawerLabel: "Settings" }}
      />
      <Drawer.Screen
        name={ROUTES.Help}
        component={HelpScreen}
        options={{ drawerLabel: "Help" }}
      />
    </Drawer.Navigator>
  );
}
