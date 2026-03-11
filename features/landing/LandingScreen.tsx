import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AnchorLogo } from "../../components/AnchorLogo";
import { ROUTES } from "../../main/navigation/routes";
import { useSpace } from "../../context/SpaceContext";
import { useAppTheme } from "../../context/ThemeContext";
import { hasQuickPin } from "../../services/quickPin";

const MIN_LANDING_MS = 3000;

export function LandingScreen() {
  const navigation = useNavigation();
  const { loading, session, startupIssue, retrySessionBootstrap } = useSpace();
  const { colors } = useAppTheme();
  const [pinStatusLoading, setPinStatusLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (startupIssue) return;

    let mounted = true;
    const routeNext = async () => {
      const startedAt = Date.now();
      const ensureMinimumLandingTime = async () => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_LANDING_MS - elapsed);
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
      };

      if (!session?.user?.id) {
        await ensureMinimumLandingTime();
        if (!mounted) return;
        navigation.reset({ index: 0, routes: [{ name: ROUTES.Auth as never }] });
        return;
      }

      setPinStatusLoading(true);
      const hasPin = await hasQuickPin(session.user.id);
      await ensureMinimumLandingTime();
      if (!mounted) return;

      const nextRoute = hasPin ? ROUTES.QuickPinUnlock : ROUTES.QuickPinSetup;
      navigation.reset({ index: 0, routes: [{ name: nextRoute as never }] });
      setPinStatusLoading(false);
    };

    routeNext();

    return () => {
      mounted = false;
    };
  }, [loading, navigation, session, startupIssue]);

  const statusText = useMemo(() => {
    if (loading) return "Checking app data and your account…";
    if (startupIssue) return startupIssue;
    if (pinStatusLoading) return "Preparing secure quick login…";
    if (session) return "Signed in. Redirecting now…";
    return "Welcome. Redirecting to sign in…";
  }, [loading, pinStatusLoading, session, startupIssue]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.hero}>
          <AnchorLogo size={84} />
          <Text style={[styles.title, { color: colors.text }]}>Anchor</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>A private sanctuary for two hearts.</Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            {loading || pinStatusLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <View style={styles.statusDot} />}
            <Text style={[styles.statusTitle, { color: colors.text }]}>App status</Text>
          </View>
          <Text style={[styles.statusText, { color: colors.muted }]}>{statusText}</Text>
          {startupIssue ? (
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={retrySessionBootstrap}>
              <Text style={styles.retryButtonText}>Retry startup</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F3FF" },
  container: {
    flex: 1,
    backgroundColor: "#F5F3FF",
    padding: 24,
    justifyContent: "space-between",
  },
  hero: {
    marginTop: 40,
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  statusText: {
    color: "#6B7280",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 10,
    borderRadius: 12,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "700",
  },
});
