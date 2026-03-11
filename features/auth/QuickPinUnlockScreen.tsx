import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ROUTES } from "../../main/navigation/routes";
import { useSpace } from "../../context/SpaceContext";
import { useAppTheme } from "../../context/ThemeContext";
import { clearQuickPin, getQuickPinLockStatus, verifyQuickPinWithLockout } from "../../services/quickPin";

export function QuickPinUnlockScreen() {
  const navigation = useNavigation();
  const { session, signOut } = useSpace();
  const { colors } = useAppTheme();
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockRemainingMs, setLockRemainingMs] = useState(0);

  const userId = session?.user?.id ?? "";

  useEffect(() => {
    const init = async () => {
      if (!userId) return;
      const status = await getQuickPinLockStatus(userId);
      setLockRemainingMs(status.remainingMs);
    };
    init();
  }, [userId]);

  useEffect(() => {
    if (lockRemainingMs <= 0) return;
    const timer = setInterval(() => {
      setLockRemainingMs(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockRemainingMs]);

  const onUnlock = async () => {
    if (lockRemainingMs > 0) {
      setError(`Too many attempts. Try again in ${Math.ceil(lockRemainingMs / 1000)}s.`);
      return;
    }

    if (!pin.trim()) {
      setError("Enter your quick PIN.");
      return;
    }

    setPending(true);
    setError(null);
    const result = await verifyQuickPinWithLockout(userId, pin);
    if (!result.ok) {
      if (result.reason === "locked") {
        setLockRemainingMs(result.remainingMs);
        setError(`Too many attempts. Try again in ${Math.ceil(result.remainingMs / 1000)}s.`);
      } else {
        setError(`Incorrect PIN.${typeof result.attemptsLeft === "number" ? ` ${result.attemptsLeft} attempt(s) left.` : ""}`);
      }
      setPending(false);
      return;
    }

    navigation.reset({ index: 0, routes: [{ name: ROUTES.MainTabs as never }] });
    setPending(false);
  };

  const onForgotPin = async () => {
    setPending(true);
    setError(null);
    if (userId) {
      await clearQuickPin(userId);
    }
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: ROUTES.Auth as never }] });
    setPending(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Enter your quick login PIN to continue.</Text>

      {lockRemainingMs > 0 ? (
        <Text style={[styles.lockText, { color: colors.danger }]}>Locked for {Math.ceil(lockRemainingMs / 1000)}s due to multiple wrong PIN attempts.</Text>
      ) : null}

      <TextInput
        placeholder="Quick PIN"
        value={pin}
        onChangeText={setPin}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }, lockRemainingMs > 0 && styles.disabledButton]}
        onPress={onUnlock}
        disabled={pending || lockRemainingMs > 0}
      >
        {pending ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Unlock</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={onForgotPin} disabled={pending}>
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Forgot PIN? Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  primaryButton: {
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "white", fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontWeight: "700" },
  error: { color: "#B91C1C", marginTop: 4 },
  lockText: { fontWeight: "600" },
});
