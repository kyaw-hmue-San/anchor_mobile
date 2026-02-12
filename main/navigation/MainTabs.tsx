import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SanctuaryScreen } from "../../features/sanctuary/SanctuaryScreen";
import { DuoCalendarStack } from "./stacks/DuoCalendarStack";
import { VaultScreen } from "../../features/vault/VaultScreen";
import { SettingsScreen } from "../../features/settings/SettingsScreen";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Sanctuary" component={SanctuaryScreen} />
      <Tab.Screen name="DuoCalendar" component={DuoCalendarStack} />
      <Tab.Screen name="Vault" component={VaultScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
