import React from "react";
import { View, ActivityIndicator, StyleSheet, Text, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { RootNavigator } from "./navigation/RootNavigator";
import { SpaceProvider } from "../context/SpaceContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

type RootErrorBoundaryState = { error: Error | null };

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Root render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Something crashed on web</Text>
          <ScrollView style={styles.errorBox} contentContainerStyle={{ padding: 12 }}>
            <Text style={styles.errorText}>{this.state.error.message}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [fontsLoaded] = useFonts(Ionicons.font);

  if (!fontsLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SpaceProvider>
      <SafeAreaProvider>
        <RootErrorBoundary>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </RootErrorBoundary>
      </SafeAreaProvider>
    </SpaceProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F3FF",
  },
  errorWrap: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#B91C1C",
  },
  errorBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    color: "#111827",
  },
});
