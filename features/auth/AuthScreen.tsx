import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ROUTES } from "../../main/navigation/routes";
import { useSpace } from "../../context/SpaceContext";
import { useAppTheme } from "../../context/ThemeContext";

export function AuthScreen() {
  const navigation = useNavigation();
  const { session, loading, signIn, signUp, setSoloMode } = useSpace();
  const { colors, isDark } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      navigation.reset({ index: 0, routes: [{ name: ROUTES.Landing as never }] });
    }
  }, [navigation, session]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setPending(true);
    setError(null);
    setStatus(null);
    const err = isSignUp
      ? await signUp(email.trim().toLowerCase(), password)
      : await signIn(email.trim().toLowerCase(), password);
    if (err) {
      setError(err.message);
    } else {
      setStatus(isSignUp ? "Account created. Redirecting…" : "Signed in. Redirecting…");
      navigation.reset({ index: 0, routes: [{ name: ROUTES.Landing as never }] });
    }
    setPending(false);
  };

  const handleSolo = async () => {
    setPending(true);
    setError(null);
    setStatus("Solo mode enabled.");
    await setSoloMode();
    navigation.navigate(ROUTES.MainTabs as never);
    setPending(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text style={[styles.title, { color: colors.text }]}>Anchor</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Private sanctuary for two. Choose how you sign in.</Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, { borderColor: colors.border }, !isSignUp && [styles.toggleButtonActive, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]]}
          onPress={() => setIsSignUp(false)}
        >
          <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, { borderColor: colors.border }, isSignUp && [styles.toggleButtonActive, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]]}
          onPress={() => setIsSignUp(true)}
        >
          <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={pending || loading}>
        {pending ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>{isSignUp ? "Create account" : "Sign in"}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: isDark ? colors.surfaceAlt : "#E5E7EB" }]} onPress={handleSolo} disabled={pending || loading}>
        <Text style={styles.secondaryButtonText}>Continue in solo mode</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 12, backgroundColor: "#F9FAFB" },
  title: { fontSize: 28, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 16, color: "#4B5563", marginBottom: 8 },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggleButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: { backgroundColor: "#EEF2FF", borderColor: "#7C3AED" },
  toggleText: { color: "#6B7280", fontWeight: "700" },
  toggleTextActive: { color: "#4C1D95" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    backgroundColor: "white",
    color: "#111827",
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "white", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: "#111827", fontWeight: "700" },
  error: { color: "#B91C1C", marginTop: 4 },
  status: { color: "#047857", marginTop: 4 },
});
