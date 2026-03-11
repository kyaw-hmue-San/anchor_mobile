import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SanctuaryScreen } from "../../features/sanctuary/SanctuaryScreen";
import { DuoCalendarStack } from "./stacks/DuoCalendarStack";
import { VaultScreen } from "../../features/vault/VaultScreen";
import { ROUTES } from "./routes";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === ROUTES.Sanctuary
              ? "home-outline"
              : route.name === ROUTES.DuoCalendar
              ? "calendar-outline"
              : "albums-outline";
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name={ROUTES.Sanctuary} component={SanctuaryScreen} />
      <Tab.Screen name={ROUTES.DuoCalendar} component={DuoCalendarStack} />
      <Tab.Screen name={ROUTES.Vault} component={VaultScreen} />
    </Tab.Navigator>
  );
}
