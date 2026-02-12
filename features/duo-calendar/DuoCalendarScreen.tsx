import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Event, EventCategory } from "../../models/types";
import { deleteEvent, listEvents, saveEvent } from "../../services/storage";
import { ROUTES } from "../../main/navigation/routes";

const categories: EventCategory[] = ["call", "date", "gift", "trip", "other"];

const emptyEvent = (): Event => ({
  id: `event-${Date.now()}`,
  title: "",
  dateTime: new Date().toISOString(),
  category: "other",
  note: "",
  guardianAlertEnabled: false,
});

export function DuoCalendarScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState<Event>(emptyEvent());
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    const list = await listEvents();
    setEvents(list);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents().finally(() => setInitialLoading(false));
  }, []);

  const onSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert("Missing title", "Please add an event title.");
      return;
    }
    setLoading(true);
    await saveEvent(form);
    setForm(emptyEvent());
    await loadEvents();
  };

  const onEdit = (event: Event) => setForm(event);

  const onDelete = async (id: string) => {
    await deleteEvent(id);
    await loadEvents();
  };

  const toggleGuardian = () => setForm(prev => ({ ...prev, guardianAlertEnabled: !prev.guardianAlertEnabled }));

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [events]
  );

  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading calendar…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Text style={styles.screenTitle}>Duo-Calendar</Text>
        <Text style={styles.muted}>Shared moments & memories</Text>
      </View>

      <TouchableOpacity
        style={styles.alertBanner}
        onPress={() => navigation.navigate(ROUTES.GuardianAlert as never)}
      >
        <Ionicons name="alert" size={22} color="white" />
        <Text style={styles.alertBannerText}>Guardian Alert</Text>
        <Ionicons name="flame" size={22} color="white" />
      </TouchableOpacity>
      <Text style={[styles.muted, { textAlign: "center", marginTop: 6 }]}>Tap if you need immediate help or support</Text>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Add / Edit Event</Text>
            <Text style={styles.muted}>Title, time, category, note</Text>
          </View>
          <TouchableOpacity onPress={() => setForm(emptyEvent())}>
            <Ionicons name="add-circle-outline" size={24} color={palette.primary} />
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Title"
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          style={styles.input}
          placeholderTextColor={palette.muted}
        />
        <TextInput
          placeholder="ISO datetime (e.g., 2026-02-12T18:00:00Z)"
          value={form.dateTime}
          onChangeText={text => setForm({ ...form, dateTime: text })}
          style={styles.input}
          placeholderTextColor={palette.muted}
        />
        <TextInput
          placeholder="Note"
          value={form.note}
          onChangeText={text => setForm({ ...form, note: text })}
          style={[styles.input, { minHeight: 80 }]}
          placeholderTextColor={palette.muted}
          multiline
        />

        <View style={styles.chipRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setForm({ ...form, category: cat })}
              style={[
                styles.chip,
                form.category === cat && { backgroundColor: palette.primarySoft, borderColor: palette.primary },
              ]}
            >
              <Text style={styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.toggleButton} onPress={toggleGuardian}>
          <Ionicons
            name={form.guardianAlertEnabled ? "shield-checkmark" : "shield-outline"}
            size={18}
            color={form.guardianAlertEnabled ? palette.primary : palette.muted}
          />
          <Text style={[styles.toggleText, form.guardianAlertEnabled && { color: palette.primary }]}> 
            Guardian Alert {form.guardianAlertEnabled ? "ON" : "OFF"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={onSubmit} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? "Saving…" : "Save Event"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.upcomingHeaderRow}>
        <Text style={styles.upcomingTitle}>Upcoming Events</Text>
        <TouchableOpacity style={styles.addCircle} onPress={() => setForm(emptyEvent())}>
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {sortedEvents.length === 0 ? (
        <Text style={[styles.muted, { marginBottom: 16 }]}>No events yet.</Text>
      ) : (
        sortedEvents.map(item => (
          <View key={item.id} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <View style={styles.eventMetaRow}>
                  <Ionicons name="calendar-outline" size={14} color={palette.muted} />
                  <Text style={styles.eventMetaText}>{new Date(item.dateTime).toLocaleString()}</Text>
                </View>
                <Text style={styles.eventMetaText}>{item.note || "No note"}</Text>
                <Text style={[styles.eventMetaText, { marginTop: 4, color: item.guardianAlertEnabled ? palette.primary : palette.muted }]}>
                  Guardian Alert: {item.guardianAlertEnabled ? "Enabled" : "Disabled"}
                </Text>
                <Text style={[styles.eventMetaText, { marginTop: 4 }]}>Shared with partner</Text>
              </View>
              <View style={styles.heartBadge}>
                <Ionicons name="heart-outline" size={18} color={palette.primary} />
              </View>
            </View>
            <View style={styles.eventActionRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => onEdit(item)}>
                <Text style={styles.secondaryButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={() => onDelete(item.id)}>
                <Text style={styles.dangerButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const palette = {
  primary: "#7C3AED",
  primarySoft: "#F3E8FF",
  border: "#E5E7EB",
  card: "#FFFFFF",
  background: "#F5F3FF",
  text: "#111827",
  muted: "#6B7280",
  danger: "#EF4444",
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: palette.muted },
  headerBlock: { gap: 4 },
  screenTitle: { fontSize: 26, fontWeight: "800", color: palette.text },
  alertBanner: {
    marginTop: 14,
    backgroundColor: palette.danger,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#EF4444",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  alertBannerText: { color: "white", fontWeight: "800", fontSize: 16 },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  upcomingHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  upcomingTitle: { fontSize: 20, fontWeight: "800", color: palette.text },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: palette.text },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFF",
    color: palette.text,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "white",
  },
  chipText: { color: palette.text, textTransform: "capitalize" },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  toggleText: { color: palette.muted, fontWeight: "600" },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "white", fontWeight: "700" },
  eventCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    backgroundColor: "#FFF",
  },
  eventHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  eventTitle: { fontWeight: "700", fontSize: 16, color: palette.text },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  eventMetaText: { color: palette.muted },
  eventNote: { color: palette.text },
  eventActionRow: { flexDirection: "row", gap: 10 },
  heartBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryButtonText: { color: palette.text, fontWeight: "600" },
  dangerButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#FEE2E2",
  },
  dangerButtonText: { color: "#B91C1C", fontWeight: "700" },
});
