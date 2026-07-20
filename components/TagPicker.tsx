import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface TagPickerProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

const LEVELS: { key: string; value: number; i18nKey: string }[] = [
  { key: 'low', value: 0.15, i18nKey: 'tagPicker.low' },
  { key: 'mid', value: 0.5, i18nKey: 'tagPicker.mid' },
  { key: 'high', value: 0.85, i18nKey: 'tagPicker.high' },
];

export default function TagPicker({ label, value, onChange }: TagPickerProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {LEVELS.map((level) => {
          const selected = value !== undefined && Math.abs(value - level.value) < 0.01;
          return (
            <Pressable
              key={level.key}
              onPress={() => onChange(selected ? undefined : level.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t(level.i18nKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: '#8A8A8E',
    marginBottom: 6,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#F0F0F3',
  },
  chipSelected: {
    backgroundColor: '#1A1A1A',
  },
  chipText: {
    fontSize: 13,
    color: '#1A1A1A',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
