import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../../models/types";
import { useAppTheme } from "../../../context/ThemeContext";

type Props = {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
  onConfirm?: (id: string) => void;
};

export function EventCard({ event, onEdit, onDelete, disabled = false, onConfirm }: Props) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.eventCard, { borderColor: colors.border, backgroundColor: colors.surface }] }>
      <View style={styles.eventHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
          <View style={styles.eventMetaRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={[styles.eventMetaText, { color: colors.muted }]}>{new Date(event.dateTime).toLocaleString()}</Text>
          </View>
          <Text style={[styles.eventMetaText, { color: colors.muted }]}>{event.note || "No note"}</Text>
          <Text style={[styles.eventMetaText, { color: event.guardianAlertEnabled ? colors.primary : colors.muted }]}>
            Guardian Alert: {event.guardianAlertEnabled ? "Enabled" : "Disabled"}
          </Text>
          <Text style={[styles.eventMetaText, { color: event.confirmedAt ? colors.primary : colors.muted }]}>
            Confirmed: {event.confirmedAt ? new Date(event.confirmedAt).toLocaleString() : "Not confirmed"}
          </Text>
        </View>
        <View style={[styles.heartBadge, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="heart-outline" size={18} color={colors.primary} />
        </View>
      </View>
      <View style={styles.eventActionRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }, disabled && styles.disabledButton]}
          onPress={() => onEdit(event)}
          disabled={disabled}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }, disabled && styles.disabledButton]}
          onPress={() => onConfirm?.(event.id)}
          disabled={disabled || !onConfirm || !!event.confirmedAt}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{event.confirmedAt ? "Confirmed" : "Confirm"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: isDark ? "#4C1D1D" : "#FEE2E2" }, disabled && styles.disabledButton]}
          onPress={() => onDelete(event.id)}
          disabled={disabled}
        >
          <Text style={styles.dangerButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function areEqual(prev: Props, next: Props) {
  return (
    prev.disabled === next.disabled &&
    prev.event.id === next.event.id &&
    prev.event.title === next.event.title &&
    prev.event.dateTime === next.event.dateTime &&
    prev.event.note === next.event.note &&
    prev.event.category === next.event.category &&
    prev.event.guardianAlertEnabled === next.event.guardianAlertEnabled &&
    prev.event.confirmedAt === next.event.confirmedAt
  );
}

export const MemoizedEventCard = React.memo(EventCard, areEqual);

const styles = StyleSheet.create({
  eventCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FFF",
    gap: 10,
  },
  eventHeader: { flexDirection: "row", gap: 10 },
  eventTitle: { fontWeight: "700", fontSize: 16 },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eventMetaText: {},
  heartBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  eventActionRow: { flexDirection: "row", gap: 8 },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontWeight: "700" },
  dangerButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: { color: "#B91C1C", fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
});
