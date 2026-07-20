import { addMonths, subMonths, format, parseISO } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';

import ColorMoodPicker from '@/components/ColorMoodPicker';
import MoodCalendar from '@/components/MoodCalendar';
import { Text, View } from '@/components/Themed';
import { computeMonthColorSummary } from '@/lib/colorMood';
import { getDateFnsLocale } from '@/lib/i18n';
import { useHuedayStore } from '@/lib/storage';
import type { ColorMoodEmotion } from '@/types/card';

export default function MoodCalendarScreen() {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const cards = useHuedayStore((s) => s.cards);
  const setColorMoodEntry = useHuedayStore((s) => s.setColorMoodEntry);
  const removeColorMoodEntry = useHuedayStore((s) => s.removeColorMoodEntry);

  const monthKey = format(month, 'yyyy-MM');

  const monthColorSummary = useMemo(() => {
    const entries = Object.values(cards)
      .filter((card) => card.date.startsWith(monthKey))
      .flatMap((card) => card.colorMoods || []);
    return computeMonthColorSummary(entries);
  }, [cards, monthKey]);

  const monthColorSummaryLabel = monthColorSummary.topEmotion
    ? t(`colorMood.emotions.${monthColorSummary.topEmotion}`)
    : t('colorMood.noRecordYet');

  const selectedEntries = selectedDate ? cards[selectedDate]?.colorMoods || [] : [];

  const handleQuickSelect = (emotion: ColorMoodEmotion, intensity: 1 | 2 | 3) => {
    if (!selectedDate) return;
    setColorMoodEntry(selectedDate, emotion, intensity).catch(() => {});
  };

  const handleQuickDeselect = (emotion: ColorMoodEmotion) => {
    if (!selectedDate) return;
    removeColorMoodEntry(selectedDate, emotion);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{t('moodCalendar.heading')}</Text>
      <Text style={styles.subheading}>{t('moodCalendar.subheading')}</Text>

      <View style={styles.monthNav}>
        <Pressable onPress={() => setMonth((m) => subMonths(m, 1))} hitSlop={12}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setMonth((m) => addMonths(m, 1))} hitSlop={12}>
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      <MoodCalendar month={month} cards={cards} onSelectDate={(date) => setSelectedDate(date)} />

      <View style={styles.monthSummaryCard}>
        <Text style={styles.monthSummaryHeader}>{t('moodCalendar.monthSummaryTitle')}</Text>
        <View style={styles.monthSummaryRow}>
          <View style={[styles.monthSummarySwatch, { backgroundColor: monthColorSummary.blendColor }]} />
          <Text style={styles.monthSummaryEmotion}>{monthColorSummaryLabel}</Text>
        </View>
      </View>

      {/* Günlük Renk Seçici Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={!!selectedDate}
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedDate ? format(parseISO(selectedDate), 'd MMMM yyyy', { locale }) : ''}
            </Text>
            <Text style={styles.modalSubtitle}>{t('moodCalendar.modalSubtitle')}</Text>

            <ColorMoodPicker
              entries={selectedEntries}
              onSelect={handleQuickSelect}
              onDeselect={handleQuickDeselect}
            />

            <Pressable style={styles.modalCloseButton} onPress={() => setSelectedDate(null)}>
              <Text style={styles.modalCloseButtonText}>{t('moodCalendar.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 72,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: '#8A8A8E',
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginBottom: 8,
  },
  navArrow: {
    fontSize: 28,
    lineHeight: 28,
  },
  monthSummaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    gap: 14,
  },
  monthSummaryHeader: {
    fontSize: 13,
    color: '#A0A0A6',
    fontWeight: '500',
  },
  monthSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  monthSummarySwatch: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  monthSummaryEmotion: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingTop: 12,
    alignItems: 'center',
    gap: 16,
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8A8A8E',
    textAlign: 'center',
    marginTop: -8,
  },
  modalCloseButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#8A8A8E',
    fontSize: 13,
    fontWeight: '600',
  },
});
