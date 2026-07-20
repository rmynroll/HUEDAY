import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
} from 'date-fns';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import DaySealRing from './DaySealRing';
import { getDateFnsLocale } from '../lib/i18n';
import { useHuedayStore } from '../lib/storage';
import { getMonthlyTaskSummaries } from '../lib/taskRepository';
import { calculateDaySealProgress } from '../lib/threeRituals';
import type { DayCard } from '../types/card';

interface CalendarGridProps {
  month: Date;
  cards: Record<string, DayCard>;
  onSelectDate: (date: string) => void;
}

export default function CalendarGrid({ month, cards, onSelectDate }: CalendarGridProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const weekdayLabels = t('weekdays', { returnObjects: true }) as string[];
  const allTasks = useHuedayStore((s) => s.tasks || {});
  const allPhotos = useHuedayStore((s) => s.photos || {});
  const allAudioMemos = useHuedayStore((s) => s.audioMemos || {});
  const allJournals = useHuedayStore((s) => s.handwritingJournals || {});

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const yearMonthKey = useMemo(() => format(month, 'yyyy-MM'), [month]);

  // Aggregated single-pass task summary for the entire 31-day month grid
  const monthlyTaskSummaries = useMemo(() => {
    return getMonthlyTaskSummaries(yearMonthKey, allTasks);
  }, [yearMonthKey, allTasks]);

  // Pazartesi=0 ... Pazar=6 olacak şekilde ISO haftaya çevir.
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
          const card = cards[key];
          const taskSummary = monthlyTaskSummaries[key];
          const today = isToday(day);

          const hasTasks = taskSummary && taskSummary.total > 0;
          const allCompleted = hasTasks && taskSummary.completed === taskSummary.total;
          const hasPhotos = allPhotos[key] && allPhotos[key].length > 0;
          const hasAudio = !!allAudioMemos[key];
          const hasJournal = allJournals[key] && allJournals[key].length > 0;

          return (
            <Pressable
              key={key}
              style={styles.cell}
              onPress={() => onSelectDate(key)}
            >
              <View
                style={[
                  styles.dayBox,
                  card ? { backgroundColor: card.palette[0] } : styles.dayBoxEmpty,
                  today && styles.dayBoxToday,
                ]}
              >
                {/* Day Seal Ring Overlay */}
                {card && (
                  <View style={StyleSheet.absoluteFill}>
                    <DaySealRing
                      progress={calculateDaySealProgress(card)}
                      size={40}
                      strokeWidth={2}
                      color={card.palette[1] || '#FFFFFF'}
                      trackColor="rgba(255,255,255,0.15)"
                    />
                  </View>
                )}

                <Text style={[styles.dayNumber, card && styles.dayNumberFilled]}>{format(day, 'd')}</Text>

                {/* Task Indicator Dot */}
                {hasTasks && (
                  <View
                    style={[
                      styles.taskDot,
                      allCompleted
                        ? { backgroundColor: card ? '#FFFFFF' : '#34C759' }
                        : { backgroundColor: card ? 'rgba(255,255,255,0.7)' : '#007AFF' },
                    ]}
                  />
                )}

                {/* Media Icons (photo / audio / journal) */}
                {(hasPhotos || hasAudio || hasJournal) && (
                  <View style={styles.mediaIconsRow}>
                    {hasPhotos && <Text style={styles.mediaIcon}>📸</Text>}
                    {hasAudio && <Text style={styles.mediaIcon}>🎙️</Text>}
                    {hasJournal && <Text style={styles.mediaIcon}>✏️</Text>}
                  </View>
                )}
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
    position: 'relative',
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
  taskDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  mediaIconsRow: {
    position: 'absolute',
    top: 1,
    right: 1,
    flexDirection: 'row',
    gap: 1,
  },
  mediaIcon: {
    fontSize: 7,
  },
});
