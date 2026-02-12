import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../models/types";
import { eventsWithinNext24h } from "../../services/storage";

export function GuardianAlertScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const upcoming = await eventsWithinNext24h();
      setEvents(upcoming);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.muted}>Checking upcoming alerts…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Guardian Alert</Text>
          <Ionicons name="shield-checkmark-outline" size={22} color={palette.primary} />
        </View>
        <Text style={styles.muted}>Events happening in the next 24 hours</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={palette.muted} />
              <Text style={styles.metaText}>{new Date(item.dateTime).toLocaleString()}</Text>
            </View>
            {item.note ? <Text style={styles.noteText}>Note: {item.note}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.muted}>No guardian alerts in the next 24 hours.</Text>}
      />
    </View>
  );
}

const palette = {
  primary: "#5B6EF5",
  border: "#E5E7EB",
  card: "#FFFFFF",
  background: "#F6F7FB",
  text: "#111827",
  muted: "#6B7280",
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background, padding: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: palette.muted },
  heroCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroTitle: { fontSize: 18, fontWeight: "700", color: palette.text },
  listContent: { gap: 10, paddingBottom: 24 },
  eventCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: palette.card,
    gap: 6,
  },
  eventTitle: { fontWeight: "700", fontSize: 16, color: palette.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: palette.muted },
  noteText: { color: palette.text },
});
