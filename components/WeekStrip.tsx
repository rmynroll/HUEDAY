import { eachDayOfInterval, endOfWeek, format, isToday, startOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useHuedayStore } from '../lib/storage';

interface WeekStripProps {
  onSelectDate: (date: string) => void;
}

export default function WeekStrip({ onSelectDate }: WeekStripProps) {
  const cards = useHuedayStore((s) => s.cards || {});
  const tasks = useHuedayStore((s) => s.tasks || {});

  const weekDays = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(today, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.stripRow}>
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const card = cards[dateKey];
          const dayTasks = tasks[dateKey] || [];
          const taskCount = dayTasks.length;
          const completedCount = dayTasks.filter((t) => t.completed).length;
          const today = isToday(day);

          return (
            <Pressable
              key={dateKey}
              style={styles.dayCol}
              onPress={() => onSelectDate(dateKey)}
            >
              <Text style={styles.dayLabel}>
                {format(day, 'EEEEEE', { locale: tr })}
              </Text>

              <View
                style={[
                  styles.dayCardBox,
                  card ? { backgroundColor: card.palette[0] } : styles.dayCardBoxEmpty,
                  today && styles.dayCardBoxToday,
                ]}
              >
                <Text style={[styles.dateNumber, card && styles.dateNumberFilled]}>
                  {format(day, 'd')}
                </Text>
              </View>

              {/* Task Count Dot Indicator */}
              {taskCount > 0 ? (
                <View style={styles.taskIndicatorRow}>
                  <View
                    style={[
                      styles.taskDot,
                      completedCount === taskCount ? styles.taskDotCompleted : styles.taskDotPending,
                    ]}
                  />
                  <Text style={styles.taskCountText}>{completedCount}/{taskCount}</Text>
                </View>
              ) : (
                <View style={styles.emptyTaskSpacer} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8A8E',
    textTransform: 'uppercase',
  },
  dayCardBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardBoxEmpty: {
    backgroundColor: '#F2F2F7',
  },
  dayCardBoxToday: {
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },
  dateNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  dateNumberFilled: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  taskIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  taskDotPending: {
    backgroundColor: '#007AFF',
  },
  taskDotCompleted: {
    backgroundColor: '#34C759',
  },
  taskCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A8A8E',
  },
  emptyTaskSpacer: {
    height: 12,
  },
});
