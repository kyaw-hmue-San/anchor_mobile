import React from "react";
import { View, ActivityIndicator, StyleSheet, Text, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { RootNavigator } from "./navigation/RootNavigator";
import { SpaceProvider } from "../context/SpaceContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppThemeColors, ThemeProvider, useAppTheme } from "../context/ThemeContext";

type RootErrorBoundaryState = { error: Error | null };

class RootErrorBoundary extends React.Component<{ children: React.ReactNode; colors: AppThemeColors }, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Root render error:", error, info.componentStack);
  }

  render() {
    const { colors } = this.props;
    if (this.state.error) {
      return (
        <View style={[styles.errorWrap, { backgroundColor: colors.background }] }>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>Something crashed on web</Text>
          <ScrollView style={[styles.errorBox, { borderColor: colors.border, backgroundColor: colors.surface }]} contentContainerStyle={{ padding: 12 }}>
            <Text style={[styles.errorText, { color: colors.text }]}>{this.state.error.message}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  const { colors, navigationTheme } = useAppTheme();

  const [fontsLoaded] = useFonts(Ionicons.font);

  if (!fontsLoaded) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SpaceProvider>
      <SafeAreaProvider>
        <RootErrorBoundary colors={colors}>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </RootErrorBoundary>
      </SafeAreaProvider>
    </SpaceProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
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
