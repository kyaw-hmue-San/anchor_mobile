import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { Event, EventCategory } from "../../models/types";
import { deleteEvent, listEvents, saveEvent } from "../../services/storage";
import { ROUTES } from "../../main/navigation/routes";
import { CategoryChips } from "./components/CategoryChips";
import { EventCard } from "./components/EventCard";
import { EventFormModal } from "./components/EventFormModal";

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
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await listEvents());
    } catch {
      setError("Could not load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents().finally(() => setInitialLoading(false));
  }, []);

  const onSave = async () => {
    if (!form.title.trim()) {
      Alert.alert("Missing title", "Please add an event title.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveEvent(form);
      setForm(emptyEvent());
      setShowModal(false);
      await loadEvents();
    } catch {
      setError("Could not save event.");
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteEvent(id);
      await loadEvents();
    } catch {
      setError("Could not delete event.");
      setLoading(false);
    }
  };

  const onEdit = (event: Event) => {
    setForm(event);
    setShowModal(true);
  };

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [events]
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AnchorLogo size={35} />
          <MenuButton color={palette.text} />
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.screenTitle}>Duo-Calendar</Text>
          <Text style={styles.muted}>Shared moments & memories</Text>
        </View>

        {error ? <Text style={[styles.muted, { color: "#B91C1C" }]}>{error}</Text> : null}

        <TouchableOpacity style={styles.alertBanner} onPress={() => navigation.navigate(ROUTES.GuardianAlert as never)}>
          <Ionicons name="alert" size={22} color="white" />
          <Text style={styles.alertBannerText}>Guardian Alert</Text>
          <Ionicons name="flame" size={22} color="white" />
        </TouchableOpacity>

        <Text style={[styles.muted, styles.centerText]}>Tap if you need immediate help or support</Text>

        <View style={styles.upcomingHeaderRow}>
          <Text style={styles.upcomingTitle}>Upcoming Events</Text>
          <TouchableOpacity
            style={styles.addCircle}
            onPress={() => {
              setForm(emptyEvent());
              setShowModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {sortedEvents.length === 0 ? (
          <Text style={[styles.muted, { marginBottom: 16 }]}>No events yet.</Text>
        ) : (
          sortedEvents.map(item => <EventCard key={item.id} event={item} onEdit={onEdit} onDelete={onDelete} />)
        )}
      </ScrollView>

      <EventFormModal
        visible={showModal}
        form={form}
        loading={loading}
        onChange={patch => setForm(prev => ({ ...prev, ...patch }))}
        onClose={() => setShowModal(false)}
        onSave={onSave}
        categories={<CategoryChips categories={categories} selected={form.category} onSelect={category => setForm(prev => ({ ...prev, category }))} />}
      />
    </SafeAreaView>
  );
}

const palette = {
  primary: "#7C3AED",
  background: "#F5F3FF",
  text: "#111827",
  muted: "#6B7280",
  danger: "#EF4444",
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerText: { textAlign: "center", marginTop: 6 },
  muted: { color: palette.muted },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerBlock: { gap: 4 },
  screenTitle: { fontSize: 26, fontWeight: "800", color: palette.text },
  alertBanner: {
    backgroundColor: palette.danger,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  alertBannerText: { color: "white", fontWeight: "800", fontSize: 16 },
  upcomingHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  upcomingTitle: { fontSize: 20, fontWeight: "800", color: palette.text },
  addCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
