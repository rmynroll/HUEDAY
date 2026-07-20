import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLOR_MOOD_BASE, COLOR_MOOD_ORDER, shadeForIntensity } from '../lib/colorMood';
import type { ColorMoodEmotion, ColorMoodEntry } from '../types/card';

interface ColorMoodPickerProps {
  entries: ColorMoodEntry[];
  onSelect: (emotion: ColorMoodEmotion, intensity: 1 | 2 | 3) => void;
  onDeselect: (emotion: ColorMoodEmotion) => void;
}

const SWATCH_SIZE = 48;

function nextIntensity(current: 1 | 2 | 3): 1 | 2 | 3 {
  if (current === 3) return 1;
  return ((current + 1) as 1 | 2 | 3);
}

interface EmotionButtonProps {
  emotion: ColorMoodEmotion;
  entry: ColorMoodEntry | undefined;
  onSelect: (emotion: ColorMoodEmotion, intensity: 1 | 2 | 3) => void;
  onDeselect: (emotion: ColorMoodEmotion) => void;
}

function EmotionButton({ emotion, entry, onSelect, onDeselect }: EmotionButtonProps) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(entry ? 1.15 : 1)).current;
  const isSelected = !!entry;
  const displayColor = entry ? entry.color : COLOR_MOOD_BASE[emotion];

  const animateTo = (toValue: number) => {
    Animated.spring(scaleAnim, { toValue, friction: 6, useNativeDriver: true }).start();
  };

  const handlePress = () => {
    if (isSelected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      animateTo(1);
      onDeselect(emotion);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      animateTo(1.15);
      onSelect(emotion, 2);
    }
  };

  const handleLongPress = () => {
    const nextLevel = nextIntensity(entry?.intensity ?? 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    animateTo(1.15);
    onSelect(emotion, nextLevel);
  };

  return (
    <View style={styles.buttonCol}>
      <Pressable onPress={handlePress} onLongPress={handleLongPress} delayLongPress={350} hitSlop={6}>
        <Animated.View
          style={[
            styles.swatch,
            { backgroundColor: displayColor, transform: [{ scale: scaleAnim }] },
            isSelected && styles.swatchSelected,
          ]}
        />
      </Pressable>
      <Text style={styles.label} numberOfLines={1}>
        {t(`colorMood.emotions.${emotion}`)}
      </Text>
    </View>
  );
}

export default function ColorMoodPicker({ entries, onSelect, onDeselect }: ColorMoodPickerProps) {
  const { t } = useTranslation();
  const entryByEmotion = useMemo(() => {
    const map = new Map<ColorMoodEmotion, ColorMoodEntry>();
    entries.forEach((e) => map.set(e.emotion, e));
    return map;
  }, [entries]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {COLOR_MOOD_ORDER.map((emotion) => (
          <EmotionButton
            key={emotion}
            emotion={emotion}
            entry={entryByEmotion.get(emotion)}
            onSelect={onSelect}
            onDeselect={onDeselect}
          />
        ))}
      </View>
      <Text style={styles.hint}>{t('colorMoodPicker.hint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonCol: {
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8A8E',
  },
  hint: {
    fontSize: 12,
    color: '#8A8A8E',
    textAlign: 'center',
  },
});
