import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ROUTES } from "../../main/navigation/routes";
import { useSpace } from "../../context/SpaceContext";
import { useAppTheme } from "../../context/ThemeContext";
import { isQuickPinFormatValid, saveQuickPin, verifyQuickPin } from "../../services/quickPin";

export function ChangeQuickPinScreen() {
  const navigation = useNavigation();
  const { session } = useSpace();
  const { colors } = useAppTheme();
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id ?? "";

  const onSave = async () => {
    if (!userId) {
      setError("Missing signed in session.");
      return;
    }

    if (!currentPin.trim()) {
      setError("Enter your current quick PIN.");
      return;
    }

    if (!isQuickPinFormatValid(nextPin)) {
      setError("New PIN must be 4 to 6 digits.");
      return;
    }

    if (nextPin.trim() !== confirmPin.trim()) {
      setError("New PIN confirmation does not match.");
      return;
    }

    setPending(true);
    setError(null);
    setStatus(null);

    const isCurrentValid = await verifyQuickPin(userId, currentPin);
    if (!isCurrentValid) {
      setError("Current PIN is incorrect.");
      setPending(false);
      return;
    }

    try {
      await saveQuickPin(userId, nextPin.trim());
      setStatus("Quick PIN updated.");
      navigation.reset({ index: 0, routes: [{ name: ROUTES.MainTabs as never }] });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not update quick PIN";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text style={[styles.title, { color: colors.text }]}>Change quick PIN</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Use a different PIN for fast app unlock.</Text>

      <TextInput
        placeholder="Current PIN"
        value={currentPin}
        onChangeText={setCurrentPin}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />

      <TextInput
        placeholder="New PIN"
        value={nextPin}
        onChangeText={setNextPin}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />

      <TextInput
        placeholder="Confirm new PIN"
        value={confirmPin}
        onChangeText={setConfirmPin}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onSave} disabled={pending}>
        {pending ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Update PIN</Text>}
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
  error: { color: "#B91C1C", marginTop: 4 },
  status: { color: "#047857", marginTop: 4 },
});
