import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import ViewShot, { captureRef } from 'react-native-view-shot';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Text, View } from '@/components/Themed';
import { useHuedayStore } from '@/lib/storage';

export default function WrappedScreen() {
  const { month } = useLocalSearchParams<{ month: string }>(); // yyyy-MM format, e.g. "2026-07"
  const cards = useHuedayStore((s) => s.cards);
  
  const viewShotRef = useRef<React.ElementRef<typeof ViewShot>>(null);
  const [sharing, setSharing] = useState(false);

  const monthKey = month || format(new Date(), 'yyyy-MM');
  const monthDate = useMemo(() => parseISO(`${monthKey}-01`), [monthKey]);

  // Filter cards for the target month
  const monthCards = useMemo(() => {
    return Object.values(cards)
      .filter((card) => card.date.startsWith(monthKey))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [cards, monthKey]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (monthCards.length === 0) {
      return {
        count: 0,
        avgMood: 0,
        avgEnergy: 0,
        avgSleep: 0,
        avgSocial: 0,
      };
    }

    const total = monthCards.length;
    const moodSum = monthCards.reduce((acc, c) => acc + c.mood, 0);
    const energySum = monthCards.reduce((acc, c) => acc + (c.tags.energy ?? 0.5), 0);
    const sleepSum = monthCards.reduce((acc, c) => acc + (c.tags.sleep ?? 0.5), 0);
    const socialSum = monthCards.reduce((acc, c) => acc + (c.tags.sociality ?? 0.5), 0);

    return {
      count: total,
      avgMood: moodSum / total,
      avgEnergy: energySum / total,
      avgSleep: sleepSum / total,
      avgSocial: socialSum / total,
    };
  }, [monthCards]);

  // Extract top/dominant colors in the month
  const dominantColors = useMemo(() => {
    if (monthCards.length === 0) {
      return ['#FAF6EE', '#F0F0F3', '#E5E5EA'];
    }
    // Gather all colors
    const allColors = monthCards.flatMap((c) => c.palette);
    
    // Group and count frequency
    const freq: Record<string, number> = {};
    allColors.forEach((color) => {
      freq[color] = (freq[color] || 0) + 1;
    });

    // Sort by count
    return Object.keys(freq)
      .sort((a, b) => freq[b] - freq[a])
      .slice(0, 5);
  }, [monthCards]);

  // SVG Line Chart coordinates for Mood Wave
  const moodWavePath = useMemo(() => {
    if (monthCards.length < 2) return '';
    const width = 300;
    const height = 100;
    const padding = 10;
    
    const points = monthCards.map((c, i) => {
      const x = padding + (i * (width - padding * 2)) / (monthCards.length - 1);
      // Map mood (0-1) to Y (height-padding -> padding)
      const y = height - padding - c.mood * (height - padding * 2);
      return { x, y };
    });

    // Generate SVG path string with smooth bezier curves or simple lines
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Midpoint control points for soft waves
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [monthCards]);

  const moodWaveAreaPath = useMemo(() => {
    if (monthCards.length < 2) return '';
    const width = 300;
    const height = 100;
    const padding = 10;

    const points = monthCards.map((c, i) => {
      const x = padding + (i * (width - padding * 2)) / (monthCards.length - 1);
      const y = height - padding - c.mood * (height - padding * 2);
      return { x, y };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }
    // Close the shape to bottom
    d += ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    return d;
  }, [monthCards]);

  const handleShare = async () => {
    if (!viewShotRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } else {
        if (Platform.OS === 'web') {
          const link = document.createElement('a');
          link.download = `hueday-wrapped-${monthKey}.png`;
          link.href = uri;
          link.click();
        }
      }
    } catch (e) {
      // Cancelled
    } finally {
      setSharing(false);
    }
  };

  const getMoodWord = (score: number) => {
    if (score < 0.35) return 'Dingin & Sakin';
    if (score < 0.68) return 'Dengeli & Stabil';
    return 'Canlı & Parlak';
  };

  const mainGradientId = `wrap-grad-${monthKey}`;

  if (monthCards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Aylık Özet' }} />
        <Text style={styles.emptyText}>Bu ay için henüz kayıtlı bir gün kartı yok.</Text>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Aylık Özet' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Wrapped Main Poster Container */}
        <ViewShot ref={viewShotRef} style={styles.posterWrapper} options={{ format: 'png', quality: 1 }}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={mainGradientId} x1="0" y1="0" x2="1" y2="1">
                {dominantColors.slice(0, 3).map((hex, i) => (
                  <Stop
                    key={hex + i}
                    offset={`${(i / Math.max(dominantColors.slice(0, 3).length - 1, 1)) * 100}%`}
                    stopColor={hex}
                  />
                ))}
              </LinearGradient>
              <LinearGradient id="wave-area-grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            {/* Blend background with soft overlay */}
            <Rect width="100%" height="100%" fill={`url(#${mainGradientId})`} />
            <Rect width="100%" height="100%" fill="#000000" opacity={0.12} />
          </Svg>

          <View style={styles.posterContent}>
            <Text style={styles.posterLogo}>hueday wrapped</Text>
            
            <View style={styles.middleRow}>
              <Text style={styles.posterTitle}>
                {format(monthDate, 'MMMM yyyy', { locale: tr })}
              </Text>
              <Text style={styles.posterSubtitle}>
                Renklerle dokunmuş hikayen.
              </Text>
            </View>

            {/* Dominant Palette Display */}
            <View style={styles.paletteContainer}>
              <Text style={styles.posterSectionLabel}>Baskın Renk Paletin</Text>
              <View style={styles.posterColorRow}>
                {dominantColors.map((color, idx) => (
                  <View key={color + idx} style={styles.paletteChipCol}>
                    <View style={[styles.paletteSwatchLarge, { backgroundColor: color }]} />
                    <Text style={styles.paletteTextSmall}>{color}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Mood Wave Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.posterSectionLabel}>Duygu Dalgaların</Text>
              {monthCards.length >= 2 ? (
                <View style={styles.svgWrapper}>
                  <Svg width="100%" height={100} viewBox="0 0 300 100">
                    <Path d={moodWaveAreaPath} fill="url(#wave-area-grad)" />
                    <Path d={moodWavePath} fill="none" stroke="#FFFFFF" strokeWidth={2.5} />
                    {/* Draw circles on points */}
                    {monthCards.map((c, i) => {
                      const width = 300;
                      const height = 100;
                      const padding = 10;
                      const x = padding + (i * (width - padding * 2)) / (monthCards.length - 1);
                      const y = height - padding - c.mood * (height - padding * 2);
                      return <Circle key={i} cx={x} cy={y} r={3} fill="#FFFFFF" />;
                    })}
                  </Svg>
                </View>
              ) : (
                <Text style={styles.noDataChartText}>Dalga çizimi için en az 2 gün kaydedilmelidir.</Text>
              )}
            </View>

            {/* Monthly Statistics Summary */}
            <View style={styles.statsSummaryBox}>
              <View style={styles.statsCol}>
                <Text style={styles.statLabel}>Kayıtlı Gün</Text>
                <Text style={styles.statVal}>{stats.count} gün</Text>
              </View>
              <View style={styles.statsCol}>
                <Text style={styles.statLabel}>Ağırlıklı Mood</Text>
                <Text style={styles.statVal}>{getMoodWord(stats.avgMood)}</Text>
              </View>
              <View style={styles.statsCol}>
                <Text style={styles.statLabel}>Genel Enerji</Text>
                <Text style={styles.statVal}>%{Math.round(stats.avgEnergy * 100)}</Text>
              </View>
            </View>
          </View>
        </ViewShot>

        {/* Action Button */}
        <Pressable style={styles.sharePosterButton} onPress={handleShare} disabled={sharing}>
          <Text style={styles.sharePosterButtonText}>
            {sharing ? 'Hazırlanıyor…' : 'Özeti Story Olarak Paylaş'}
          </Text>
        </Pressable>

        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Kapat</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    gap: 20,
    flexGrow: 1,
  },
  posterWrapper: {
    width: '100%',
    maxWidth: 350,
    aspectRatio: 9 / 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  posterContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: 'transparent',
  },
  posterLogo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  middleRow: {
    backgroundColor: 'transparent',
    marginTop: 10,
  },
  posterTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    textTransform: 'capitalize',
    letterSpacing: -1,
  },
  posterSubtitle: {
    color: '#E5E5EA',
    fontSize: 13,
    marginTop: 4,
    opacity: 0.85,
  },
  paletteContainer: {
    backgroundColor: 'transparent',
  },
  posterSectionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    opacity: 0.8,
  },
  posterColorRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  paletteChipCol: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  paletteSwatchLarge: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  paletteTextSmall: {
    color: '#E5E5EA',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'transparent',
  },
  svgWrapper: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  noDataChartText: {
    color: '#E5E5EA',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  statsSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statLabel: {
    color: '#E5E5EA',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  sharePosterButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  sharePosterButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  backLink: {
    paddingVertical: 10,
  },
  backLinkText: {
    color: '#8A8A8E',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FAF9F6',
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#8A8A8E',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
