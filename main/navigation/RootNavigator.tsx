import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthScreen } from "../../features/auth/AuthScreen";
import { MainTabs } from "./MainTabs";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}
