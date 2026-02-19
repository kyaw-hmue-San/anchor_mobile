import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./navigation/RootNavigator";
import { SpaceProvider } from "../context/SpaceContext";

export function App() {
  return (
    <SpaceProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SpaceProvider>
  );
}
