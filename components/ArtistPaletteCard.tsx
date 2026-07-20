import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ArtistPalette } from '../constants/artistPalettes';

interface ArtistPaletteCardProps {
  palette: ArtistPalette;
  onApply: (paletteId: string) => Promise<unknown> | void;
}

export default function ArtistPaletteCard({ palette, onApply }: ArtistPaletteCardProps) {
  const { t } = useTranslation();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleApply = async () => {
    if (applying) return;
    setApplying(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    await onApply(palette.id);

    setApplying(false);
    setApplied(true);
    setTimeout(() => setApplied(false), 1800);
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.swatchRow}>
        {palette.colors.map((color, i) => (
          <View key={color + i} style={[styles.swatch, { backgroundColor: color }]} />
        ))}
      </View>

      <View style={styles.meta}>
        <Text style={styles.themeName}>{t(`artistPalettes.${palette.id}.themeName`)}</Text>
        <Text style={styles.artistName}>{palette.artistName}</Text>
        <Text style={styles.description}>{t(`artistPalettes.${palette.id}.description`)}</Text>
      </View>

      <Pressable
        style={[styles.applyButton, applied && styles.applyButtonApplied]}
        onPress={handleApply}
        disabled={applying}
      >
        <Text style={[styles.applyButtonText, applied && styles.applyButtonTextApplied]}>
          {applied ? t('common.applied') : applying ? t('common.applying') : t('common.apply')}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    flex: 1,
    height: 56,
    borderRadius: 14,
  },
  meta: {
    gap: 2,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  artistName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8E',
  },
  description: {
    fontSize: 13,
    color: '#6E6E73',
    marginTop: 4,
    lineHeight: 18,
  },
  applyButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonApplied: {
    backgroundColor: '#34C759',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  applyButtonTextApplied: {
    color: '#FFFFFF',
  },
});
