import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { ConnectionStatusBanner } from "../../components/ConnectionStatusBanner";
import { useAppTheme } from "../../context/ThemeContext";
import { useSpace } from "../../context/SpaceContext";

const START_DATE_KEY_PREFIX = "anchor:relationship:startDate:";
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_MILESTONES = [10, 30, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;
const YEAR_MILESTONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type Milestone = {
  label: string;
  date: Date;
  daysDelta: number;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [yearRaw, monthRaw, dayRaw] = trimmed.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return startOfDay(parsed);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return startOfDay(next);
}

function getDayDelta(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function getElapsedParts(start: Date, end: Date) {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += previousMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
  };
}

function formatDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`;
}

function formatStatus(daysDelta: number) {
  if (daysDelta > 0) return `${daysDelta}days left`;
  if (daysDelta < 0) return `${Math.abs(daysDelta)}days ago`;
  return "Today";
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatElapsedText(years: number, months: number, days: number) {
  const yearLabel = `${years} ${years === 1 ? "year" : "years"}`;
  const monthLabel = `${months} ${months === 1 ? "month" : "months"}`;
  const dayLabel = `${days} ${days === 1 ? "day" : "days"}`;
  return `${yearLabel} ${monthLabel} ${dayLabel}`;
}

export function SoloTimelineScreen() {
  const { colors } = useAppTheme();
  const { isCoupleConnected, session } = useSpace();
  const [savedStartDate, setSavedStartDate] = useState<Date | null>(null);
  const [draftStartDate, setDraftStartDate] = useState<Date>(startOfDay(new Date()));
  const [editingStartDate, setEditingStartDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const startDateStorageKey = session?.user?.id ? `${START_DATE_KEY_PREFIX}${session.user.id}` : null;

  useEffect(() => {
    const load = async () => {
      if (!startDateStorageKey) {
        setSavedStartDate(null);
        setDraftStartDate(startOfDay(new Date()));
        setEditingStartDate(false);
        setShowDatePicker(false);
        return;
      }

      const raw = await AsyncStorage.getItem(startDateStorageKey);
      if (!raw) {
        setSavedStartDate(null);
        setDraftStartDate(startOfDay(new Date()));
        setEditingStartDate(false);
        setShowDatePicker(false);
        return;
      }
      const parsed = parseIsoDate(raw);
      if (!parsed) {
        setSavedStartDate(null);
        setDraftStartDate(startOfDay(new Date()));
        return;
      }
      setSavedStartDate(parsed);
      setDraftStartDate(parsed);
    };

    void load();
  }, [startDateStorageKey]);

  const today = startOfDay(new Date());

  const summary = useMemo(() => {
    if (!savedStartDate) return null;
    const togetherDays = Math.max(1, getDayDelta(savedStartDate, today) + 1);
    const elapsed = getElapsedParts(savedStartDate, today);
    return {
      togetherDays,
      elapsedText: formatElapsedText(elapsed.years, elapsed.months, elapsed.days),
    };
  }, [savedStartDate, today]);

  const milestones = useMemo(() => {
    if (!savedStartDate) return [];

    const baseList: Milestone[] = [
      ...DAY_MILESTONES.map(days => {
        const date = addDays(savedStartDate, days - 1);
        return {
          label: `${days}days`,
          date,
          daysDelta: getDayDelta(today, date),
        };
      }),
      ...YEAR_MILESTONES.map(year => {
        const date = addYears(savedStartDate, year);
        return {
          label: `${year}${year === 1 ? "year" : "years"}`,
          date,
          daysDelta: getDayDelta(today, date),
        };
      }),
    ];

    return baseList
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .filter((item, index, arr) => {
        if (index === 0) return true;
        const prev = arr[index - 1];
        return prev.label !== item.label || prev.date.getTime() !== item.date.getTime();
      });
  }, [savedStartDate, today]);

  const onSaveDate = async () => {
    if (draftStartDate.getTime() > today.getTime()) {
      Alert.alert("Invalid date", "Start date cannot be in the future.");
      return;
    }

    if (!startDateStorageKey) {
      Alert.alert("Sign in required", "Please sign in before saving your date.");
      return;
    }

    const isoDateOnly = `${draftStartDate.getFullYear()}-${`${draftStartDate.getMonth() + 1}`.padStart(2, "0")}-${`${draftStartDate.getDate()}`.padStart(2, "0")}`;
    await AsyncStorage.setItem(startDateStorageKey, isoDateOnly);
    setSavedStartDate(startOfDay(draftStartDate));
    setEditingStartDate(false);
    setShowDatePicker(false);
  };

  const onDatePicked = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed" || !selectedDate) return;
    setDraftStartDate(startOfDay(selectedDate));
  };

  const onStartEditing = () => {
    setDraftStartDate(savedStartDate ?? today);
    setEditingStartDate(true);
    setShowDatePicker(true);
  };

  const showSetupCard = !savedStartDate || editingStartDate;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AnchorLogo size={35} />
          <MenuButton color={colors.text} />
        </View>

        <ConnectionStatusBanner />

        {showSetupCard ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{savedStartDate ? "Update Start Date" : "Set Start Date"}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Choose your relationship start date from the calendar.</Text>

            <TouchableOpacity
              style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.pickerLabel, { color: colors.muted }]}>Selected date</Text>
              <Text style={[styles.pickerValue, { color: colors.text }]}>{formatLongDate(draftStartDate)}</Text>
            </TouchableOpacity>

            {showDatePicker ? (
              <DateTimePicker
                value={draftStartDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDatePicked}
                maximumDate={today}
              />
            ) : null}

            <View style={styles.actionRow}>
              {savedStartDate ? (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={() => {
                    setEditingStartDate(false);
                    setShowDatePicker(false);
                    if (savedStartDate) setDraftStartDate(savedStartDate);
                  }}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={onSaveDate}>
                <Text style={styles.saveButtonText}>{savedStartDate ? "Update date" : "Save start date"}</Text>
              </TouchableOpacity>
            </View>

            {!isCoupleConnected ? (
              <Text style={[styles.helperText, { color: colors.muted }]}>Full couple tabs unlock automatically after both members join the same space.</Text>
            ) : null}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Start date</Text>
            <Text style={[styles.savedDateValue, { color: colors.text }]}>{savedStartDate ? formatLongDate(savedStartDate) : "-"}</Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border, alignSelf: "flex-start" }]}
              onPress={onStartEditing}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Change date</Text>
            </TouchableOpacity>
          </View>
        )}

        {summary ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.daysTogether, { color: colors.text }]}>{summary.togetherDays}days</Text>
            <Text style={[styles.elapsed, { color: colors.text }]}>Been Together</Text>
            <Text style={[styles.elapsedValue, { color: colors.text }]}>{summary.elapsedText}</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Set your start date above to view milestone reminders.</Text>
          </View>
        )}

        {milestones.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Milestones</Text>
            {milestones.map(item => (
              <View key={`${item.label}-${item.date.toISOString()}`} style={[styles.row, { borderBottomColor: colors.border }]}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowDate, { color: colors.muted }]}>{formatDate(item.date)}</Text>
                  <Text
                    style={[
                      styles.rowStatus,
                      { color: item.daysDelta >= 0 ? colors.primary : colors.muted },
                    ]}
                  >
                    {formatStatus(item.daysDelta)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F3FF" },
  screen: { flex: 1, backgroundColor: "#F5F3FF" },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 14, lineHeight: 20 },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 56,
    paddingHorizontal: 14,
    justifyContent: "center",
    gap: 2,
  },
  pickerLabel: { fontSize: 12, fontWeight: "600" },
  pickerValue: { fontSize: 16, fontWeight: "700" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveButton: {
    borderRadius: 10,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 14,
    flex: 1,
  },
  saveButtonText: { color: "white", fontWeight: "700" },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  secondaryButtonText: { fontWeight: "700" },
  helperText: { fontSize: 12, lineHeight: 18 },
  savedDateValue: { fontSize: 20, fontWeight: "800" },
  daysTogether: { fontSize: 34, fontWeight: "800", textAlign: "center" },
  elapsed: { textAlign: "center", fontSize: 16 },
  elapsedValue: { textAlign: "center", fontSize: 22, fontWeight: "800" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  row: {
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  rowLabel: { fontSize: 20, fontWeight: "700" },
  rowRight: { alignItems: "flex-end", gap: 2 },
  rowDate: { fontSize: 13 },
  rowStatus: { fontSize: 14, fontWeight: "700" },
});
