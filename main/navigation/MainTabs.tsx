import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SanctuaryScreen } from "../../features/sanctuary/SanctuaryScreen";
import { DuoCalendarStack } from "./stacks/DuoCalendarStack";
import { VaultScreen } from "../../features/vault/VaultScreen";
import { SoloTimelineScreen } from "../../features/solo/SoloTimelineScreen";
import { ROUTES } from "./routes";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";
import { useSpace } from "../../context/SpaceContext";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { colors } = useAppTheme();
  const { isCoupleConnected } = useSpace();

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
            route.name === ROUTES.SoloTimeline
              ? "time-outline"
              : route.name === ROUTES.Sanctuary
              ? "home-outline"
              : route.name === ROUTES.DuoCalendar
              ? "calendar-outline"
              : "albums-outline";
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      {isCoupleConnected ? (
        <>
          <Tab.Screen name={ROUTES.Sanctuary} component={SanctuaryScreen} />
          <Tab.Screen name={ROUTES.DuoCalendar} component={DuoCalendarStack} />
          <Tab.Screen name={ROUTES.Vault} component={VaultScreen} />
        </>
      ) : (
        <Tab.Screen
          name={ROUTES.SoloTimeline}
          component={SoloTimelineScreen}
          options={{ tabBarLabel: "Date" }}
        />
      )}
    </Tab.Navigator>
  );
}
