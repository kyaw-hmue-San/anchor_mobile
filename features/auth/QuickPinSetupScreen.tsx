import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ROUTES } from "../../main/navigation/routes";
import { useSpace } from "../../context/SpaceContext";
import { useAppTheme } from "../../context/ThemeContext";
import { isQuickPinFormatValid, saveQuickPin } from "../../services/quickPin";

export function QuickPinSetupScreen() {
  const navigation = useNavigation();
  const { session, signOut } = useSpace();
  const { colors } = useAppTheme();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id ?? "";

  const onSave = async () => {
    const normalizedPin = pin.trim();
    const normalizedConfirm = confirmPin.trim();

    if (!isQuickPinFormatValid(normalizedPin)) {
      setError("PIN must be 4 to 6 digits.");
      return;
    }
    if (normalizedPin !== normalizedConfirm) {
      setError("PIN confirmation does not match.");
      return;
    }
    if (!userId) {
      setError("Missing signed in session.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await saveQuickPin(userId, normalizedPin);
      navigation.reset({ index: 0, routes: [{ name: ROUTES.MainTabs as never }] });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save quick PIN";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  const onSignOut = async () => {
    setPending(true);
    setError(null);
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: ROUTES.Auth as never }] });
    setPending(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text style={[styles.title, { color: colors.text }]}>Create quick login PIN</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>This PIN is only for fast unlock. It is different from your account password.</Text>

      <TextInput
        placeholder="Enter 4-6 digit PIN"
        value={pin}
        onChangeText={setPin}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />

      <TextInput
        placeholder="Confirm PIN"
        value={confirmPin}
        onChangeText={setConfirmPin}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onSave} disabled={pending}>
        {pending ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Save PIN</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={onSignOut} disabled={pending}>
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Sign out</Text>
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
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontWeight: "700" },
  error: { color: "#B91C1C", marginTop: 4 },
});
