import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../../models/types";

type Props = {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
};

export function EventCard({ event, onEdit, onDelete }: Props) {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventMetaRow}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.eventMetaText}>{new Date(event.dateTime).toLocaleString()}</Text>
          </View>
          <Text style={styles.eventMetaText}>{event.note || "No note"}</Text>
          <Text style={[styles.eventMetaText, { color: event.guardianAlertEnabled ? "#7C3AED" : "#6B7280" }]}>
            Guardian Alert: {event.guardianAlertEnabled ? "Enabled" : "Disabled"}
          </Text>
        </View>
        <View style={styles.heartBadge}>
          <Ionicons name="heart-outline" size={18} color="#7C3AED" />
        </View>
      </View>
      <View style={styles.eventActionRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => onEdit(event)}>
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={() => onDelete(event.id)}>
          <Text style={styles.dangerButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  eventTitle: { fontWeight: "700", fontSize: 16, color: "#111827" },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eventMetaText: { color: "#6B7280" },
  heartBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  eventActionRow: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: "#111827", fontWeight: "700" },
  dangerButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: { color: "#B91C1C", fontWeight: "700" },
});
