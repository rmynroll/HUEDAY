import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';
import type { AutoStamp } from '../types/memories';

interface AutoDayStampProps {
  stamp?: AutoStamp;
  palette: string[];
}

const WEATHER_ICONS: Record<string, string> = {
  'Güneşli': '☀️',
  'Parçalı Bulutlu': '⛅',
  'Bulutlu': '☁️',
  'Yağmurlu': '🌧️',
  'Kar Yağışlı': '🌨️',
  'Fırtınalı': '⛈️',
  'Sisli': '🌫️',
  'Rüzgarlı': '💨',
};

export default function AutoDayStamp({ stamp, palette }: AutoDayStampProps) {
  const { t } = useTranslation();
  if (!stamp || (!stamp.temp && !stamp.condition && !stamp.city)) return null;

  const accentColor = palette[0] || '#E55B70';
  const icon = stamp.condition ? WEATHER_ICONS[stamp.condition] || '🌤️' : '🌤️';

  return (
    <View style={[styles.container, { borderColor: accentColor + '25' }]}>
      <View style={styles.stampRow}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.infoCol}>
          {stamp.temp !== undefined && (
            <Text style={[styles.tempText, { color: accentColor }]}>
              {Math.round(stamp.temp)}°C
            </Text>
          )}
          {stamp.condition && (
            <Text style={styles.conditionText}>
              {t(`weather.conditions.${stamp.condition}`, { defaultValue: stamp.condition })}
            </Text>
          )}
        </View>
        {stamp.city && (
          <View style={[styles.cityBadge, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.cityText, { color: accentColor }]}>📍 {stamp.city}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 6,
    backgroundColor: '#1C1C1E',
  },
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 22,
  },
  infoCol: {
    flex: 1,
  },
  tempText: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  conditionText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  cityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cityText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
