import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AnchorLogo } from "../../components/AnchorLogo";
import { ROUTES } from "../../main/navigation/routes";
import { useSpace } from "../../context/SpaceContext";
import { useAppTheme } from "../../context/ThemeContext";
import { hasQuickPin } from "../../services/quickPin";

const MIN_LANDING_MS = 3000;
const LANDING_DEMO_MODE = process.env.EXPO_PUBLIC_LANDING_DEMO_MODE === "true";
const LANDING_AUTO_REDIRECT = process.env.EXPO_PUBLIC_LANDING_AUTO_REDIRECT === "true";
const FEATURE_PREVIEWS = ["Sanctuary mood sync", "Shared duo calendar", "Guardian alert reminders", "Vault memory timeline"];

export function LandingScreen() {
  const navigation = useNavigation();
  const { loading, session, startupIssue, retrySessionBootstrap } = useSpace();
  const { colors } = useAppTheme();
  const [pinStatusLoading, setPinStatusLoading] = useState(false);
  const [nextRoute, setNextRoute] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (startupIssue) return;

    let mounted = true;
    const routeNext = async () => {
      const startedAt = Date.now();
      let targetRoute: string = ROUTES.Auth;

      const ensureMinimumLandingTime = async () => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_LANDING_MS - elapsed);
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
      };

      try {
        if (!session?.user?.id) {
          targetRoute = ROUTES.Auth;
        } else {
          setPinStatusLoading(true);
          const hasPin = await hasQuickPin(session.user.id);
          targetRoute = hasPin ? ROUTES.QuickPinUnlock : ROUTES.QuickPinSetup;
        }

        await ensureMinimumLandingTime();
        if (!mounted) return;
        setNextRoute(targetRoute);

        if (LANDING_AUTO_REDIRECT && !LANDING_DEMO_MODE) {
          navigation.reset({ index: 0, routes: [{ name: targetRoute as never }] });
        }
      } catch {
        await ensureMinimumLandingTime();
        if (!mounted) return;
        setNextRoute(ROUTES.Auth);
        if (LANDING_AUTO_REDIRECT && !LANDING_DEMO_MODE) {
          navigation.reset({ index: 0, routes: [{ name: ROUTES.Auth as never }] });
        }
      } finally {
        if (mounted) {
          setPinStatusLoading(false);
        }
      }
    };

    void routeNext();

    return () => {
      mounted = false;
    };
  }, [loading, navigation, session, startupIssue]);

  const statusText = useMemo(() => {
    if (loading) return "Checking app data and your account…";
    if (startupIssue) return startupIssue;
    if (LANDING_DEMO_MODE && nextRoute) return "Presentation mode is enabled. Use Continue to open the app when you are ready.";
    if (!LANDING_AUTO_REDIRECT && nextRoute) return "Ready when you are. Tap Get Started to continue.";
    if (pinStatusLoading) return "Preparing secure quick login…";
    if (session) return "Signed in. Redirecting now…";
    return "Welcome. Redirecting to sign in…";
  }, [loading, nextRoute, pinStatusLoading, session, startupIssue]);

  const goNext = () => {
    const target = nextRoute || ROUTES.Auth;
    navigation.reset({ index: 0, routes: [{ name: target as never }] });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.bgOrbTop, { backgroundColor: colors.primarySoft }]} />
        <View style={[styles.bgOrbBottom, { borderColor: colors.border }]} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <AnchorLogo size={84} />
            <Text style={[styles.title, { color: colors.text }]}>Anchor</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>A private sanctuary for two hearts.</Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Live Demo Features</Text>
            <View style={styles.featureGrid}>
              {FEATURE_PREVIEWS.map(item => (
                <View key={item} style={[styles.featureChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Text style={[styles.featureChipText, { color: colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
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
            {(!loading && !startupIssue && nextRoute) ? (
              <View style={styles.ctaRow}>
                <TouchableOpacity style={[styles.primaryAction, { backgroundColor: colors.primary }]} onPress={goNext}>
                  <Text style={styles.primaryActionText}>Get Started</Text>
                </TouchableOpacity>
                {LANDING_DEMO_MODE ? (
                  <TouchableOpacity
                    style={[styles.secondaryAction, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: ROUTES.Auth as never }] })}
                  >
                    <Text style={[styles.secondaryActionText, { color: colors.text }]}>Open sign in</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F3FF" },
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#F5F3FF",
  },
  scrollContent: {
    padding: 24,
    gap: 16,
    paddingBottom: 30,
  },
  bgOrbTop: {
    position: "absolute",
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.45,
  },
  bgOrbBottom: {
    position: "absolute",
    bottom: -120,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 999,
    borderWidth: 20,
    opacity: 0.25,
  },
  hero: {
    marginTop: 24,
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
  featureCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 34,
    justifyContent: "center",
  },
  featureChipText: {
    fontSize: 13,
    fontWeight: "600",
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
  ctaRow: {
    marginTop: 8,
    gap: 8,
  },
  primaryAction: {
    borderRadius: 12,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: "white",
    fontWeight: "700",
  },
  secondaryAction: {
    borderRadius: 12,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryActionText: {
    fontWeight: "600",
  },
});
