import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import ArtistPaletteCard from '@/components/ArtistPaletteCard';
import { Text, View } from '@/components/Themed';
import { ARTIST_PALETTES } from '@/constants/artistPalettes';
import { todayKey, useHuedayStore } from '@/lib/storage';

export default function StudioScreen() {
  const { t } = useTranslation();
  const applyArtistPalette = useHuedayStore((s) => s.applyArtistPalette);
  const [lastAppliedId, setLastAppliedId] = useState<string | null>(null);

  const handleApply = async (paletteId: string) => {
    await applyArtistPalette(todayKey(), paletteId);
    setLastAppliedId(paletteId);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{t('studio.heading')}</Text>
      <Text style={styles.subheading}>
        {t('studio.subheading')}
      </Text>

      <View style={styles.list}>
        {ARTIST_PALETTES.map((palette) => (
          <ArtistPaletteCard key={palette.id} palette={palette} onApply={handleApply} />
        ))}
      </View>

      {lastAppliedId && (
        <Text style={styles.hint}>
          {t('studio.appliedHint')}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 72,
    paddingBottom: 40,
    backgroundColor: '#FAF9F6',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: '#8A8A8E',
    marginBottom: 20,
    lineHeight: 18,
  },
  list: {
    gap: 14,
  },
  hint: {
    fontSize: 12,
    color: '#8A8A8E',
    textAlign: 'center',
    marginTop: 20,
  },
});
