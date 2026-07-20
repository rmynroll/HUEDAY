import { addMonths, subMonths, format } from 'date-fns';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import CalendarGrid from '@/components/CalendarGrid';
import { Text, View } from '@/components/Themed';
import { getDateFnsLocale } from '@/lib/i18n';
import { useHuedayStore } from '@/lib/storage';

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const [month, setMonth] = useState(new Date());
  const cards = useHuedayStore((s) => s.cards);
  const locale = getDateFnsLocale(i18n.language);

  const monthKey = format(month, 'yyyy-MM');
  const hasCardsInMonth = Object.values(cards).some((card) => card.date.startsWith(monthKey));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{t('calendar.heading')}</Text>

      <View style={styles.monthNav}>
        <Pressable onPress={() => setMonth((m) => subMonths(m, 1))} hitSlop={12}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setMonth((m) => addMonths(m, 1))} hitSlop={12}>
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      {hasCardsInMonth && (
        <Pressable
          style={styles.wrappedButton}
          onPress={() => router.push({ pathname: '/wrapped', params: { month: monthKey } })}
        >
          <Text style={styles.wrappedButtonText}>
            {t('calendar.wrappedButton', { month: format(month, 'MMMM', { locale }) })}
          </Text>
        </Pressable>
      )}

      <CalendarGrid month={month} cards={cards} onSelectDate={(date) => router.push(`/card/${date}`)} />
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
  wrappedButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  wrappedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
