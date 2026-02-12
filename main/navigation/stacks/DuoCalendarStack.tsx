import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DuoCalendarScreen } from "../../../features/duo-calendar/DuoCalendarScreen";
import { GuardianAlertScreen } from "../../../features/guardian-alert/GuardianAlertScreen";
import { ROUTES } from "../routes";

const Stack = createNativeStackNavigator();

export function DuoCalendarStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ROUTES.DuoCalendarHome}
        component={DuoCalendarScreen}
        options={{ title: "Duo-Calendar" }}
      />
      <Stack.Screen
        name={ROUTES.GuardianAlert}
        component={GuardianAlertScreen}
        options={{ title: "Guardian Alert" }}
      />
    </Stack.Navigator>
  );
}
