import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayCard } from '../types/card';

interface CalendarGridProps {
  month: Date;
  cards: Record<string, DayCard>;
  onSelectDate: (date: string) => void;
}

const WEEKDAY_LABELS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

export default function CalendarGrid({ month, cards, onSelectDate }: CalendarGridProps) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  // Pazartesi=0 ... Pazar=6 olacak şekilde ISO haftaya çevir.
  const leadingBlanks = (getDay(startOfMonth(month)) + 6) % 7;

  return (
    <View>
      <Text style={styles.monthTitle}>{format(month, 'MMMM yyyy', { locale: tr })}</Text>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const card = cards[key];
          const today = isToday(day);
          return (
            <Pressable
              key={key}
              style={styles.cell}
              disabled={!card}
              onPress={() => onSelectDate(key)}
            >
              <View
                style={[
                  styles.dayBox,
                  card ? { backgroundColor: card.palette[0] } : styles.dayBoxEmpty,
                  today && styles.dayBoxToday,
                ]}
              >
                <Text style={[styles.dayNumber, card && styles.dayNumberFilled]}>{format(day, 'd')}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayLabel: {
    flexBasis: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    color: '#8A8A8E',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    flexBasis: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  dayBox: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBoxEmpty: {
    backgroundColor: '#F0F0F3',
  },
  dayBoxToday: {
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  dayNumber: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  dayNumberFilled: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
