import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../../models/types";
import { useAppTheme } from "../../../context/ThemeContext";

type Props = {
  visible: boolean;
  form: Event;
  loading: boolean;
  guardianAlertsEnabled: boolean;
  categories: React.ReactNode;
  onChange: (patch: Partial<Event>) => void;
  onClose: () => void;
  onSave: () => void;
};

function toLocalDateTimeParts(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "", time: "" };
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  const hours = `${parsed.getHours()}`.padStart(2, "0");
  const minutes = `${parsed.getMinutes()}`.padStart(2, "0");

  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

function buildIsoFromLocal(dateValue: string, timeValue: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());
  if (!dateMatch || !timeMatch) return "";

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12) return "";
  if (day < 1 || day > 31) return "";
  if (hour < 0 || hour > 23) return "";
  if (minute < 0 || minute > 59) return "";

  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString();
}

export function EventFormModal({ visible, form, loading, guardianAlertsEnabled, categories, onChange, onClose, onSave }: Props) {
  const { colors } = useAppTheme();
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");

  useEffect(() => {
    if (!visible) return;
    const parts = toLocalDateTimeParts(form.dateTime);
    setDateInput(parts.date);
    setTimeInput(parts.time);
  }, [visible, form.id, form.dateTime]);

  const onDateChange = (value: string) => {
    setDateInput(value);
    onChange({ dateTime: buildIsoFromLocal(value, timeInput) });
  };

  const onTimeChange = (value: string) => {
    setTimeInput(value);
    onChange({ dateTime: buildIsoFromLocal(dateInput, value) });
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Add / Edit Event</Text>
              <Text style={[styles.muted, { color: colors.muted }]}>Title, time, category, note</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Title"
            value={form.title}
            onChangeText={text => onChange({ title: text })}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholderTextColor={colors.muted}
            editable={!loading}
          />
          <TextInput
            placeholder="Date (YYYY-MM-DD)"
            value={dateInput}
            onChangeText={onDateChange}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            editable={!loading}
          />
          <TextInput
            placeholder="Time (HH:mm)"
            value={timeInput}
            onChangeText={onTimeChange}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            editable={!loading}
          />
          <Text style={[styles.muted, { color: colors.muted }]}>Use local date/time. Example: 2026-03-04 and 18:30</Text>
          <TextInput
            placeholder="Note"
            value={form.note}
            onChangeText={text => onChange({ note: text })}
            style={[styles.input, { minHeight: 80, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholderTextColor={colors.muted}
            multiline
            editable={!loading}
          />

          {categories}

          <TouchableOpacity
            style={[
              styles.toggleButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
              !guardianAlertsEnabled && styles.toggleButtonDisabled,
            ]}
            onPress={() => {
              if (!guardianAlertsEnabled) return;
              onChange({ guardianAlertEnabled: !form.guardianAlertEnabled });
            }}
            disabled={!guardianAlertsEnabled || loading}
          >
            <Ionicons name={form.guardianAlertEnabled ? "shield-checkmark" : "shield-outline"} size={18} color={form.guardianAlertEnabled ? colors.primary : colors.muted} />
            <Text style={[styles.toggleText, { color: colors.muted }, form.guardianAlertEnabled && { color: colors.primary }]}>Guardian Alert {form.guardianAlertEnabled ? "ON" : "OFF"}</Text>
          </TouchableOpacity>
          {!guardianAlertsEnabled ? <Text style={[styles.muted, { color: colors.muted }]}>Enable Guardian Alerts in Settings to turn this on.</Text> : null}

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onSave} disabled={loading}>
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
  toggleButtonDisabled: {
    opacity: 0.55,
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
