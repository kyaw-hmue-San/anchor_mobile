import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthScreen } from "../../features/auth/AuthScreen";
import { QuickPinSetupScreen } from "../../features/auth/QuickPinSetupScreen";
import { QuickPinUnlockScreen } from "../../features/auth/QuickPinUnlockScreen";
import { LandingScreen } from "../../features/landing/LandingScreen";
import { ChangeQuickPinScreen } from "../../features/settings/ChangeQuickPinScreen";
import { AppDrawer } from "./AppDrawer";
import { ROUTES } from "./routes";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName={ROUTES.Landing} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.Landing} component={LandingScreen} />
      <Stack.Screen name={ROUTES.Auth} component={AuthScreen} />
      <Stack.Screen name={ROUTES.QuickPinSetup} component={QuickPinSetupScreen} />
      <Stack.Screen name={ROUTES.QuickPinUnlock} component={QuickPinUnlockScreen} />
      <Stack.Screen name={ROUTES.ChangeQuickPin} component={ChangeQuickPinScreen} />
      <Stack.Screen name={ROUTES.MainTabs} component={AppDrawer} />
    </Stack.Navigator>
  );
}
