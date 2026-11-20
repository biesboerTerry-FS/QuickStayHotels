import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { formatDay, fromIsoDate, todayIso, toIsoDate } from '@/lib/format';
import { MIN_TOUCH } from './ui';

type DateFieldProps = {
  label: string;
  /** Selected date as YYYY-MM-DD (empty string means no date). */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  /** Earliest selectable date as YYYY-MM-DD (inclusive). Defaults to today. */
  minDate?: string;
  error?: string;
  hint?: string;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * A cross-platform date field: shows the date as DD/MM/YYYY and opens a real
 * calendar picker (pure JS, so it works in Expo Go on iOS/Android and on web).
 */
export const DateField = ({
  label,
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  minDate,
  error,
  hint,
}: DateFieldProps) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const today = todayIso();
  const earliest = minDate && minDate > today ? minDate : today;

  const selectedDate = value ? fromIsoDate(value) : fromIsoDate(today);
  const [viewDate, setViewDate] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  const openPicker = () => {
    const base = value ? fromIsoDate(value) : fromIsoDate(today);
    setViewDate(new Date(base.getFullYear(), base.getMonth(), 1));
    setOpen(true);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: dayCount }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayDate = fromIsoDate(today);
  const atCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth();

  const moveMonth = (delta: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const isSelectable = (iso: string) => iso >= earliest;

  const selectIso = (iso: string) => {
    if (!isSelectable(iso)) return;
    onChange(iso);
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }} nativeID={`${label}-label`}>
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
        ]}
      >
        <Pressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={`${label} date`}
          accessibilityHint="Opens a calendar. Date format is day slash month slash year."
          style={styles.inputPress}
        >
          <TextInput
            editable={false}
            pointerEvents="none"
            value={value ? formatDay(value) : ''}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            accessibilityLabel={`${label} value`}
            style={[styles.input, { color: colors.text }]}
          />
        </Pressable>
        <Pressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={`Open calendar for ${label}`}
          hitSlop={8}
          style={styles.calendarButton}
        >
          <Ionicons name="calendar-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>
      {hint && !error ? (
        <Text style={{ color: colors.muted, marginTop: 6, fontSize: 13 }}>{hint}</Text>
      ) : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.danger, marginTop: 6, fontSize: 13 }}>
          {error}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        accessibilityViewIsModal
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close calendar"
        >
          <Pressable
            style={[styles.calendar, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={styles.calendarHeader}>
              <Pressable
                onPress={() => moveMonth(-1)}
                disabled={atCurrentMonth}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                style={[styles.navButton, { opacity: atCurrentMonth ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
              <Text accessibilityRole="header" style={[styles.monthLabel, { color: colors.text }]}>
                {MONTHS[month]} {year}
              </Text>
              <Pressable
                onPress={() => moveMonth(1)}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                style={styles.navButton}
              >
                <Ionicons name="chevron-forward" size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekdays}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={[styles.weekday, { color: colors.muted }]}>{day}</Text>
              ))}
            </View>

            <View style={styles.days}>
              {cells.map((day, index) => {
                if (day === null) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const iso = toIsoDate(new Date(year, month, day));
                const enabled = isSelectable(iso);
                const isSelected = iso === value;
                const isToday = iso === today;
                return (
                  <Pressable
                    key={iso}
                    onPress={() => selectIso(iso)}
                    disabled={!enabled}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${formatDay(iso)}`}
                    accessibilityState={{ disabled: !enabled, selected: isSelected }}
                    style={[
                      styles.dayCell,
                      styles.dayButton,
                      isSelected && { backgroundColor: colors.primary },
                      !enabled && { opacity: 0.3 },
                      isToday && !isSelected && { borderColor: colors.primary, borderWidth: 1 },
                    ]}
                  >
                    <Text style={{ color: isSelected ? colors.primaryText : colors.text, fontWeight: isSelected ? '700' : '400' }}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable
                onPress={() => selectIso(today)}
                accessibilityRole="button"
                accessibilityLabel="Select today"
                style={styles.footerButton}
              >
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Today</Text>
              </Pressable>
              <Pressable
                onPress={() => { onChange(''); setOpen(false); }}
                accessibilityRole="button"
                accessibilityLabel="Clear date"
                style={styles.footerButton}
              >
                <Text style={{ color: colors.muted, fontWeight: '600' }}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Done choosing date"
                style={styles.footerButton}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  inputRow: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  inputPress: { flex: 1, justifyContent: 'center' },
  input: { minHeight: MIN_TOUCH, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  calendarButton: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  calendar: { width: 340, maxWidth: '100%', borderWidth: 1, borderRadius: 16, padding: 16 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 17, fontWeight: '700' },
  weekdays: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600' },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', height: 44, alignItems: 'center', justifyContent: 'center' },
  dayButton: { borderRadius: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.25)' },
  footerButton: { paddingVertical: 8, paddingHorizontal: 10 },
});
