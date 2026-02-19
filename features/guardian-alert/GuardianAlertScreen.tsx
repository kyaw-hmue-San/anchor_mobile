import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { Event } from "../../models/types";
import { eventsWithinNext24h } from "../../services/storage";
import { useSpace } from "../../context/SpaceContext";
import { CoupleModeGate } from "../../components/CoupleModeGate";
import { listEvents, subscribeEvents } from "../../services/supabaseRepo";

export function GuardianAlertScreen() {
  const { mode, activeSpaceId } = useSpace();
  const isCoupleActive = useMemo(() => mode === "couple" && !!activeSpaceId, [activeSpaceId, mode]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const withinNextDay = (evt: Event) => {
    if (!evt.guardianAlertEnabled) return false;
    const t = new Date(evt.dateTime).getTime();
    const now = Date.now();
    const next = now + 24 * 60 * 60 * 1000;
    return t >= now && t <= next;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isCoupleActive && activeSpaceId) {
          const { events: remoteEvents, error: remoteError } = await listEvents(activeSpaceId);
          if (remoteError) throw remoteError;
          setEvents(remoteEvents.filter(withinNextDay));
        } else {
          const upcoming = await eventsWithinNext24h();
          setEvents(upcoming);
        }
      } catch {
        setError("Could not load alerts.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeSpaceId, isCoupleActive]);

  useEffect(() => {
    if (!isCoupleActive || !activeSpaceId) return;
    const unsubscribe = subscribeEvents(activeSpaceId, event => {
      setEvents(prev => {
        const merged = [...prev.filter(e => e.id !== event.id), event];
        return merged.filter(withinNextDay);
      });
    });
    return () => unsubscribe();
  }, [activeSpaceId, isCoupleActive]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.muted}>Checking upcoming alerts…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top","left","right"]}>
      <CoupleModeGate>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <View style={styles.topBar}>
            <AnchorLogo size={35} />
            <MenuButton color={palette.text} />
          </View>

          <View style={styles.headerBlock}>
            <Text style={styles.screenTitle}>Guardian Alert</Text>
            <Text style={styles.muted}>Events happening in the next 24 hours</Text>
          </View>

          {error ? <Text style={[styles.muted, { color: "#B91C1C" }]}>{error}</Text> : null}

          {events.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.muted}>No guardian alerts in the next 24 hours.</Text>
            </View>
          ) : (
            events.map(item => (
              <View key={item.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={14} color={palette.muted} />
                      <Text style={styles.metaText}>{new Date(item.dateTime).toLocaleString()}</Text>
                    </View>
                    {item.note ? <Text style={styles.noteText}>Note: {item.note}</Text> : null}
                  </View>
                  <View style={styles.shieldBadge}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={palette.primary} />
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </CoupleModeGate>
    </SafeAreaView>
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
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 18, fontWeight: "700", color: palette.text },
  headerBlock: { gap: 4 },
  screenTitle: { fontSize: 24, fontWeight: "800", color: palette.text },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: palette.muted },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  eventCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFF",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  eventHeader: { flexDirection: "row", gap: 10, alignItems: "center" },
  eventTitle: { fontWeight: "700", fontSize: 16, color: palette.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  metaText: { color: palette.muted },
  noteText: { color: palette.text },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
