import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { ConnectionStatusBanner } from "../../components/ConnectionStatusBanner";
import { CoupleGoal, Event, EventCategory, SmartReminder, WeeklyPlanDay } from "../../models/types";
import {
  confirmEvent,
  deleteEvent,
  getWeeklyPlan,
  listCoupleGoals,
  listEvents,
  listSmartReminders,
  saveEvent,
  subscribeToEvents,
  updateGoalProgress,
  upsertCoupleGoal,
} from "../../services/storage";
import { ROUTES } from "../../main/navigation/routes";
import { CategoryChips } from "./components/CategoryChips";
import { MemoizedEventCard } from "./components/EventCard";
import { EventFormModal } from "./components/EventFormModal";
import { getAppSettings } from "../../services/appSettings";
import { useAppTheme } from "../../context/ThemeContext";
import { getFriendlyFirebaseError } from "../../services/firebaseErrors";
import { CoupleModeGate } from "../../components/CoupleModeGate";

const categories: EventCategory[] = ["call", "date", "gift", "trip", "other"];

const emptyEvent = (): Event => ({
  id: "",
  title: "",
  dateTime: new Date().toISOString(),
  category: "other",
  note: "",
  guardianAlertEnabled: false,
});

function isValidDateTime(value: string) {
  if (!value.trim()) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

export function DuoCalendarScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState<Event>(emptyEvent());
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [guardianAlertsEnabled, setGuardianAlertsEnabled] = useState(true);
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanDay[]>([]);
  const [goals, setGoals] = useState<CoupleGoal[]>([]);
  const [goalTitle, setGoalTitle] = useState("");

  const loadEvents = useCallback(async (options?: { showSpinner?: boolean }) => {
    const showSpinner = options?.showSpinner ?? true;
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [nextEvents, nextReminders, nextPlan, nextGoals] = await Promise.all([
        listEvents(),
        listSmartReminders(),
        getWeeklyPlan(),
        listCoupleGoals(),
      ]);

      setEvents(nextEvents);
      setReminders(nextReminders);
      setWeeklyPlan(nextPlan);
      setGoals(nextGoals);
    } catch (error) {
      setError(getFriendlyFirebaseError(error, "Could not load events."));
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  const runCalendarMutation = useCallback(async (action: () => Promise<void>, errorFallback: string) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      await loadEvents({ showSpinner: false });
    } catch (error) {
      setError(getFriendlyFirebaseError(error, errorFallback));
    } finally {
      setLoading(false);
    }
  }, [loadEvents]);

  useEffect(() => {
    const init = async () => {
      try {
        const appSettings = await getAppSettings();
        setGuardianAlertsEnabled(appSettings.guardianAlerts);
      } catch {
        setGuardianAlertsEnabled(true);
      } finally {
        loadEvents({ showSpinner: false }).finally(() => setInitialLoading(false));
      }
    };

    init();
  }, [loadEvents]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    const start = async () => {
      try {
        unsubscribe = await subscribeToEvents(
          () => {
            if (!active) return;
            void loadEvents({ showSpinner: false });
          },
          () => {
            // Keep current data on transient listener failures.
          }
        );
      } catch {
        // Initial/manual loading still works even if listener setup fails.
      }
    };

    void start();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [loadEvents]);

  const onSave = useCallback(async () => {
    if (!form.title.trim()) {
      Alert.alert("Missing title", "Please add an event title.");
      return;
    }

    if (!isValidDateTime(form.dateTime)) {
      Alert.alert("Invalid date/time", "Enter a valid date and time before saving.");
      return;
    }

    await runCalendarMutation(async () => {
      await saveEvent({ ...form, guardianAlertEnabled: guardianAlertsEnabled ? !!form.guardianAlertEnabled : false });
      setForm(emptyEvent());
      setShowModal(false);
    }, "Could not save event.");
  }, [form, guardianAlertsEnabled, runCalendarMutation]);

  const onDelete = useCallback(async (id: string) => {
    await runCalendarMutation(async () => {
      await deleteEvent(id);
    }, "Could not delete event.");
  }, [runCalendarMutation]);

  const onConfirm = useCallback(async (id: string) => {
    await runCalendarMutation(async () => {
      await confirmEvent(id);
    }, "Could not confirm event.");
  }, [runCalendarMutation]);

  const onCreateGoal = useCallback(async () => {
    const title = goalTitle.trim();
    if (!title) return;

    await runCalendarMutation(async () => {
      await upsertCoupleGoal({
        title,
        type: "custom",
        target: 2,
        progress: 0,
      });
      setGoalTitle("");
    }, "Could not create goal.");
  }, [goalTitle, runCalendarMutation]);

  const onBumpGoal = useCallback(async (goal: CoupleGoal) => {
    await runCalendarMutation(async () => {
      await updateGoalProgress(goal.id, goal.progress + 1);
    }, "Could not update goal.");
  }, [runCalendarMutation]);

  const onEdit = useCallback((event: Event) => {
    setForm(event);
    setShowModal(true);
  }, []);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [events]
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <CoupleModeGate>
        <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AnchorLogo size={35} />
          <MenuButton color={colors.text} />
        </View>

        <ConnectionStatusBanner />

        <View style={styles.headerBlock}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Duo-Calendar</Text>
          <Text style={[styles.muted, { color: colors.muted }]}>Shared moments & memories</Text>
        </View>

        {error ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.muted, { color: colors.danger }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.goalButton, { backgroundColor: colors.primary }, loading && styles.alertBannerDisabled]}
              onPress={() => {
                loadEvents();
              }}
              disabled={loading}
            >
              <Text style={styles.alertBannerText}>Retry sync</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? <Text style={[styles.muted, { color: colors.muted }]}>Syncing calendar data…</Text> : null}

        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: colors.danger }, (!guardianAlertsEnabled || loading) && styles.alertBannerDisabled]}
          onPress={() => {
            if (loading) return;
            if (!guardianAlertsEnabled) {
              Alert.alert("Disabled in Settings", "Enable Guardian Alerts in Settings to use this feature.");
              return;
            }
            navigation.navigate(ROUTES.GuardianAlert as never);
          }}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Open Guardian Alert"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="alert" size={22} color="white" />
          <Text style={styles.alertBannerText}>Guardian Alert</Text>
          <Ionicons name="flame" size={22} color="white" />
        </TouchableOpacity>

        <Text style={[styles.muted, styles.centerText, { color: colors.muted }] }>
          {guardianAlertsEnabled ? "Tap if you need immediate help or support" : "Guardian Alerts are disabled in Settings"}
        </Text>

        <View style={styles.upcomingHeaderRow}>
          <Text style={[styles.upcomingTitle, { color: colors.text }]}>Upcoming Events</Text>
          <TouchableOpacity
            style={[styles.addCircle, { backgroundColor: colors.primary }, loading && styles.alertBannerDisabled]}
            onPress={() => {
              if (loading) return;
              setForm(emptyEvent());
              setShowModal(true);
            }}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Add event"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {sortedEvents.length === 0 ? (
          <Text style={[styles.muted, { marginBottom: 16, color: colors.muted }]}>{loading ? "Loading events..." : "No events yet."}</Text>
        ) : (
          sortedEvents.map(item => (
            <MemoizedEventCard
              key={item.id}
              event={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onConfirm={onConfirm}
              disabled={loading}
            />
          ))
        )}

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Reminders</Text>
          {reminders.length === 0 ? (
            <Text style={[styles.muted, { color: colors.muted }]}>No active reminders.</Text>
          ) : (
            reminders.slice(0, 5).map(item => (
              <View key={`${item.event.id}-${item.windowMinutes}`} style={styles.rowBetween}>
                <Text style={[styles.muted, { color: colors.text, flex: 1 }]}>{item.event.title} • {item.windowMinutes}m window</Text>
                <Text style={[styles.muted, { color: item.requiresGuardianFollowup ? colors.danger : colors.muted }]}>
                  {item.requiresGuardianFollowup ? "Guardian follow-up" : "Pending"}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Shared Weekly Plan</Text>
          {weeklyPlan.map(day => (
            <View key={day.date} style={styles.dayBlock}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>{day.date}</Text>
              <Text style={[styles.muted, { color: colors.muted }]}>Events: {day.events.length}</Text>
              {day.conflicts.length ? <Text style={[styles.muted, { color: colors.danger }]}>Conflicts: {day.conflicts.length}</Text> : null}
              {day.suggestedBlocks.map(slot => (
                <Text key={`${day.date}-${slot}`} style={[styles.muted, { color: colors.primary }]}>• {slot}</Text>
              ))}
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Couple Goals</Text>
          <TextInput
            placeholder="Add a shared goal"
            value={goalTitle}
            onChangeText={setGoalTitle}
            editable={!loading}
            placeholderTextColor={colors.muted}
            style={[styles.goalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          />
          <TouchableOpacity
            style={[styles.goalButton, { backgroundColor: colors.primary }, loading && styles.alertBannerDisabled]}
            onPress={onCreateGoal}
            disabled={loading}
          >
            <Text style={styles.alertBannerText}>Create goal</Text>
          </TouchableOpacity>

          {goals.length === 0 ? (
            <Text style={[styles.muted, { color: colors.muted }]}>No goals yet.</Text>
          ) : (
            goals.map(goal => {
              const ratio = Math.max(0, Math.min(1, goal.progress / Math.max(1, goal.target)));
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <Text style={[styles.muted, { color: colors.text, fontWeight: "700" }]}>{goal.title}</Text>
                  <Text style={[styles.muted, { color: colors.muted }]}>{goal.progress}/{goal.target}</Text>
                  <View style={[styles.goalTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.goalFill, { backgroundColor: colors.primary, width: `${ratio * 100}%` }]} />
                  </View>
                  <TouchableOpacity
                    style={[styles.secondaryAction, { borderColor: colors.border }, loading && styles.alertBannerDisabled]}
                    onPress={() => onBumpGoal(goal)}
                    disabled={loading || goal.completed}
                  >
                    <Text style={[styles.muted, { color: colors.text }]}>{goal.completed ? "Completed 🎉" : "Mark progress"}</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
        </ScrollView>
      </CoupleModeGate>

      <EventFormModal
        visible={showModal}
        form={form}
        loading={loading}
        onChange={patch => setForm(prev => ({ ...prev, ...patch }))}
        onClose={() => setShowModal(false)}
        onSave={onSave}
        guardianAlertsEnabled={guardianAlertsEnabled}
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
  alertBannerDisabled: {
    opacity: 0.55,
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
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  dayBlock: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#D1D5DB", gap: 2 },
  dayTitle: { fontWeight: "700" },
  goalInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  goalButton: {
    borderRadius: 10,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  goalCard: { gap: 6, paddingVertical: 6 },
  goalTrack: { height: 8, borderRadius: 999, overflow: "hidden" },
  goalFill: { height: "100%" },
  secondaryAction: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 34,
    justifyContent: "center",
  },
});
