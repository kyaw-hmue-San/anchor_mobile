import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { Event, SafetyCircle, SafetyContact, SmartReminder } from "../../models/types";
import { listSmartReminders } from "../../services/storage";
import { getAppSettings } from "../../services/appSettings";
import { useAppTheme } from "../../context/ThemeContext";
import { defaultSafetyCircle, getSafetyCircle, saveSafetyCircle } from "../../services/safetyCircle";
import { getFriendlyFirebaseError } from "../../services/firebaseErrors";

export function GuardianAlertScreen() {
  const { colors } = useAppTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardianAlertsEnabled, setGuardianAlertsEnabled] = useState(true);
  const [safetyCircle, setSafetyCircle] = useState<SafetyCircle>(defaultSafetyCircle);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [templateInput, setTemplateInput] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(defaultSafetyCircle.escalationSeconds);

  const withinNextDay = useCallback((evt: Event) => {
    if (!evt.guardianAlertEnabled) return false;
    const t = new Date(evt.dateTime).getTime();
    const now = Date.now();
    const next = now + 24 * 60 * 60 * 1000;
    return t >= now && t <= next;
  }, []);

  const loadGuardianState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appSettings, circle] = await Promise.all([getAppSettings(), getSafetyCircle()]);
      setGuardianAlertsEnabled(appSettings.guardianAlerts);
      setSafetyCircle(circle);
      setSecondsLeft(circle.escalationSeconds);
      if (!appSettings.guardianAlerts) {
        setEvents([]);
        setReminders([]);
        return;
      }

      const nextReminders = await listSmartReminders();
      const reminderEvents = Array.from(new Map(nextReminders.map(item => [item.event.id, item.event])).values());
      setReminders(nextReminders);
      setEvents(reminderEvents.filter(withinNextDay));
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not load alerts."));
    } finally {
      setLoading(false);
    }
  }, [withinNextDay]);

  useEffect(() => {
    loadGuardianState();
  }, [loadGuardianState]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning]);

  const persistCircle = useCallback(async (next: SafetyCircle) => {
    const saved = await saveSafetyCircle(next);
    setSafetyCircle(saved);
    if (!timerRunning) setSecondsLeft(saved.escalationSeconds);
  }, [timerRunning]);

  const addContact = useCallback(async () => {
    const name = contactName.trim();
    const phone = contactPhone.trim();
    if (!name || !phone) return;

    const nextContact: SafetyContact = { id: `${Date.now()}`, name, phone };
    try {
      await persistCircle({ ...safetyCircle, contacts: [...safetyCircle.contacts, nextContact] });
      setContactName("");
      setContactPhone("");
    } catch (err) {
      setError(getFriendlyFirebaseError(err, "Could not save trusted contact."));
    }
  }, [contactName, contactPhone, persistCircle, safetyCircle]);

  const removeContact = useCallback(async (id: string) => {
    try {
      await persistCircle({ ...safetyCircle, contacts: safetyCircle.contacts.filter(item => item.id !== id) });
    } catch (err) {
      setError(getFriendlyFirebaseError(err, "Could not remove trusted contact."));
    }
  }, [persistCircle, safetyCircle]);

  const addTemplate = useCallback(async () => {
    const value = templateInput.trim();
    if (!value) return;
    try {
      await persistCircle({ ...safetyCircle, templates: [...safetyCircle.templates, value] });
      setTemplateInput("");
    } catch (err) {
      setError(getFriendlyFirebaseError(err, "Could not save message template."));
    }
  }, [persistCircle, safetyCircle, templateInput]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top","left","right"]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.muted, { color: colors.muted }]}>Checking upcoming alerts…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top","left","right"]}>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
          <View style={styles.topBar}>
            <AnchorLogo size={35} />
            <MenuButton color={colors.text} />
          </View>

          <View style={styles.headerBlock}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Guardian Alert</Text>
            <Text style={[styles.muted, { color: colors.muted }]}>Events happening in the next 24 hours</Text>
          </View>

          {!guardianAlertsEnabled ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.muted, { color: colors.muted }]}>Guardian Alerts are turned off in Settings.</Text>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.muted, { color: colors.danger }]}>{error}</Text>
              <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={loadGuardianState}>
                <Text style={[styles.metaText, { color: colors.text }]}>Retry sync</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {guardianAlertsEnabled && events.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.muted, { color: colors.muted }]}>No guardian alerts in the next 24 hours.</Text>
            </View>
          ) : guardianAlertsEnabled ? (
            events.map(item => (
              <View key={item.id} style={[styles.eventCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={styles.eventHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={14} color={colors.muted} />
                      <Text style={[styles.metaText, { color: colors.muted }]}>{new Date(item.dateTime).toLocaleString()}</Text>
                    </View>
                    {item.note ? <Text style={[styles.noteText, { color: colors.text }]}>Note: {item.note}</Text> : null}
                  </View>
                  <View style={[styles.shieldBadge, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                  </View>
                </View>
              </View>
            ))
          ) : null}

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.eventTitle, { color: colors.text }]}>Smart Reminders</Text>
            {reminders.length === 0 ? (
              <Text style={[styles.muted, { color: colors.muted }]}>No active reminders.</Text>
            ) : (
              reminders.slice(0, 6).map(item => (
                <View key={`${item.event.id}-${item.windowMinutes}`} style={styles.metaRow}>
                  <Ionicons name="notifications-outline" size={14} color={colors.muted} />
                  <Text style={[styles.metaText, { color: colors.text, flex: 1 }]}>
                    {item.event.title} • {item.windowMinutes}m
                  </Text>
                  <Text style={[styles.metaText, { color: item.requiresGuardianFollowup ? colors.danger : colors.muted }]}>
                    {item.requiresGuardianFollowup ? "Needs confirm" : "Scheduled"}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.eventTitle, { color: colors.text }]}>Safety Circle</Text>

            <Text style={[styles.muted, { color: colors.muted }]}>Escalation timer: {secondsLeft}s</Text>
            <View style={styles.metaRow}>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border }]}
                onPress={() => {
                  setTimerRunning(true);
                  setSecondsLeft(safetyCircle.escalationSeconds);
                }}
              >
                <Text style={[styles.metaText, { color: colors.text }]}>Start Timer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border }]}
                onPress={() => {
                  setTimerRunning(false);
                  setSecondsLeft(safetyCircle.escalationSeconds);
                }}
              >
                <Text style={[styles.metaText, { color: colors.text }]}>Reset</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Contact name"
              value={contactName}
              onChangeText={setContactName}
              placeholderTextColor={colors.muted}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            />
            <TextInput
              placeholder="Phone"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholderTextColor={colors.muted}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            />
            <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={addContact}>
              <Text style={[styles.metaText, { color: colors.text }]}>Add Contact</Text>
            </TouchableOpacity>

            {safetyCircle.contacts.map(contact => (
              <View key={contact.id} style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.text, flex: 1 }]}>{contact.name} ({contact.phone})</Text>
                <TouchableOpacity onPress={() => removeContact(contact.id)}>
                  <Text style={[styles.metaText, { color: colors.danger }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TextInput
              placeholder="Add emergency template"
              value={templateInput}
              onChangeText={setTemplateInput}
              placeholderTextColor={colors.muted}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            />
            <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={addTemplate}>
              <Text style={[styles.metaText, { color: colors.text }]}>Add Template</Text>
            </TouchableOpacity>

            {safetyCircle.templates.map((tpl, idx) => (
              <Text key={`${tpl}-${idx}`} style={[styles.muted, { color: colors.muted }]}>{idx + 1}. {tpl}</Text>
            ))}
          </View>
        </ScrollView>
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
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
