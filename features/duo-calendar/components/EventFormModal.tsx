import React from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../../models/types";

type Props = {
  visible: boolean;
  form: Event;
  loading: boolean;
  categories: React.ReactNode;
  onChange: (patch: Partial<Event>) => void;
  onClose: () => void;
  onSave: () => void;
};

export function EventFormModal({ visible, form, loading, categories, onChange, onClose, onSave }: Props) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Add / Edit Event</Text>
              <Text style={styles.muted}>Title, time, category, note</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Title"
            value={form.title}
            onChangeText={text => onChange({ title: text })}
            style={styles.input}
            placeholderTextColor="#6B7280"
          />
          <TextInput
            placeholder="ISO datetime (e.g., 2026-02-12T18:00:00Z)"
            value={form.dateTime}
            onChangeText={text => onChange({ dateTime: text })}
            style={styles.input}
            placeholderTextColor="#6B7280"
          />
          <TextInput
            placeholder="Note"
            value={form.note}
            onChangeText={text => onChange({ note: text })}
            style={[styles.input, { minHeight: 80 }]}
            placeholderTextColor="#6B7280"
            multiline
          />

          {categories}

          <TouchableOpacity style={styles.toggleButton} onPress={() => onChange({ guardianAlertEnabled: !form.guardianAlertEnabled })}>
            <Ionicons name={form.guardianAlertEnabled ? "shield-checkmark" : "shield-outline"} size={18} color={form.guardianAlertEnabled ? "#7C3AED" : "#6B7280"} />
            <Text style={[styles.toggleText, form.guardianAlertEnabled && { color: "#7C3AED" }]}>Guardian Alert {form.guardianAlertEnabled ? "ON" : "OFF"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={onSave} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? "Saving…" : "Save Event"}</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  card: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconButton: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  muted: { color: "#6B7280" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    backgroundColor: "#FFF",
    color: "#111827",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  toggleText: { color: "#6B7280", fontWeight: "700" },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "white", fontWeight: "700" },
});
