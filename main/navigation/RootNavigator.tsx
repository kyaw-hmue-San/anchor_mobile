import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthScreen } from "../../features/auth/AuthScreen";
import { MainDrawer } from "./MainDrawer";
import { ROUTES } from "./routes";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName={ROUTES.Auth} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.Auth} component={AuthScreen} />
      <Stack.Screen name={ROUTES.MainTabs} component={MainDrawer} />
    </Stack.Navigator>
  );
}
