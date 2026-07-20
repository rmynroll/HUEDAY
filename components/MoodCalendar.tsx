import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
} from 'date-fns';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { getDateFnsLocale } from '../lib/i18n';
import type { DayCard } from '../types/card';

interface MoodCalendarProps {
  month: Date;
  cards: Record<string, DayCard>;
  onSelectDate: (date: string) => void;
}

const CIRCLE_SIZE = 34;

interface MoodDayCellProps {
  day: Date;
  dateKey: string;
  card: DayCard | undefined;
  onSelect: (date: string) => void;
}

function MoodDayCell({ day, dateKey, card, onSelect }: MoodDayCellProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const moods = card?.colorMoods || [];
  const hasMoods = moods.length > 0;
  const today = isToday(day);

  const handlePressIn = () => {
    if (!hasMoods) return;
    Animated.spring(scaleAnim, { toValue: 1.12, friction: 5, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    if (!hasMoods) return;
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      style={styles.cell}
      onPress={() => onSelect(dateKey)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[styles.circleWrap, today && styles.circleWrapToday, { transform: [{ scale: scaleAnim }] }]}
      >
        {moods.length === 0 && <View style={styles.emptyRing} />}
        {moods.length === 1 && <View style={[styles.filledCircle, { backgroundColor: moods[0].color }]} />}
        {moods.length >= 2 && (
          <View style={styles.splitCircle}>
            <View style={[styles.halfCell, { backgroundColor: moods[0].color }]} />
            <View style={[styles.halfCell, { backgroundColor: moods[1].color }]} />
          </View>
        )}
        <Text style={[styles.dayNumber, hasMoods && styles.dayNumberFilled]}>{format(day, 'd')}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function MoodCalendar({ month, cards, onSelectDate }: MoodCalendarProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const weekdayLabels = t('weekdays', { returnObjects: true }) as string[];

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const leadingBlanks = (getDay(startOfMonth(month)) + 6) % 7;

  return (
    <View>
      <Text style={styles.monthTitle}>{format(month, 'MMMM yyyy', { locale })}</Text>
      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label) => (
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
          return <MoodDayCell key={key} day={day} dateKey={key} card={cards[key]} onSelect={onSelectDate} />;
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleWrapToday: {
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },
  emptyRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(138,138,142,0.35)',
    borderStyle: 'dashed',
  },
  filledCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CIRCLE_SIZE / 2,
  },
  splitCircle: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  halfCell: {
    flex: 1,
    height: '100%',
  },
  dayNumber: {
    fontSize: 12,
    color: '#8A8A8E',
    fontWeight: '500',
  },
  dayNumberFilled: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
