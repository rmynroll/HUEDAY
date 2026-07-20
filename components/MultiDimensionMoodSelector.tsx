import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { generatePaletteFromDimensions, getPhraseKeyFromDimensions } from '../lib/dimensions';

export interface MoodDimensions {
  energy: number; // 0-1
  sleep: number; // 0-1
  sociality: number; // 0-1
}

interface MultiDimensionMoodSelectorProps {
  dimensions: MoodDimensions;
  onChange: (newDimensions: MoodDimensions) => void;
}

const TRACK_HEIGHT = 16;
const THUMB_SIZE = 28;

interface SingleSliderProps {
  title: string;
  value: number;
  statusLabel: string;
  minLabel: string;
  maxLabel: string;
  gradientColors: [string, string];
  gradientId: string;
  onChange: (val: number) => void;
}

function SingleSlider({
  title,
  value,
  statusLabel,
  minLabel,
  maxLabel,
  gradientColors,
  gradientId,
  onChange,
}: SingleSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackPageXRef = useRef<number>(0);

  const updateValueFromPageX = useCallback(
    (pageX: number) => {
      if (trackWidth <= 0) return;
      const relativeX = pageX - trackPageXRef.current;
      const clampedX = Math.min(trackWidth, Math.max(0, relativeX));
      const newValue = clampedX / trackWidth;
      onChange(newValue);
    },
    [trackWidth, onChange]
  );

  const measureTrack = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0) {
          setTrackWidth(width);
          trackPageXRef.current = pageX;
        }
      });
    }
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - trackWidth) > 1) {
      setTrackWidth(w);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        measureTrack();
        const touchPageX = evt.nativeEvent.pageX;
        if (touchPageX !== undefined && touchPageX !== null) {
          updateValueFromPageX(touchPageX);
        }
      },

      onPanResponderMove: (evt) => {
        const touchPageX = evt.nativeEvent.pageX;
        if (touchPageX !== undefined && touchPageX !== null) {
          updateValueFromPageX(touchPageX);
        }
      },
    })
  ).current;

  const webProps =
    Platform.OS === 'web'
      ? {
          onPointerDown: (e: any) => {
            if (trackRef.current) {
              const rect = (trackRef.current as any).getBoundingClientRect?.();
              if (rect) {
                trackPageXRef.current = rect.left;
                setTrackWidth(rect.width);
                const newValue = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                onChange(newValue);

                const onPointerMove = (moveEvent: PointerEvent) => {
                  const val = Math.min(1, Math.max(0, (moveEvent.clientX - rect.left) / rect.width));
                  onChange(val);
                };

                const onPointerUp = () => {
                  window.removeEventListener('pointermove', onPointerMove);
                  window.removeEventListener('pointerup', onPointerUp);
                };

                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
              }
            }
          },
        }
      : {};

  const usableWidth = Math.max(trackWidth - THUMB_SIZE, 0);
  const thumbLeft = Math.min(usableWidth, Math.max(0, value * usableWidth));

  return (
    <View style={styles.sliderBlock}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>

      {/* Track */}
      <View
        ref={trackRef}
        style={styles.track}
        onLayout={onLayout}
        {...panResponder.panHandlers}
        {...webProps}
      >
        <Svg width="100%" height={TRACK_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height={TRACK_HEIGHT} rx={TRACK_HEIGHT / 2} fill={`url(#${gradientId})`} />
        </Svg>
        <View pointerEvents="none" style={[styles.thumb, { left: thumbLeft }]} />
      </View>

      {/* Footer Labels */}
      <View style={styles.labelsRow}>
        <Text style={styles.minMaxText}>{minLabel}</Text>
        <Text style={styles.minMaxText}>{maxLabel}</Text>
      </View>
    </View>
  );
}

export default function MultiDimensionMoodSelector({
  dimensions,
  onChange,
}: MultiDimensionMoodSelectorProps) {
  const { t } = useTranslation();
  const { energy, sleep, sociality } = dimensions;

  // Status Labels logic
  const getEnergyStatus = (val: number) => {
    if (val < 0.2) return t('moodSelector.energyStatus.idle');
    if (val < 0.4) return t('moodSelector.energyStatus.calm');
    if (val < 0.6) return t('moodSelector.energyStatus.balanced');
    if (val < 0.8) return t('moodSelector.energyStatus.flowing');
    return t('moodSelector.energyStatus.blazing');
  };

  const getSleepStatus = (val: number) => {
    if (val < 0.2) return t('moodSelector.sleepStatus.foggy');
    if (val < 0.4) return t('moodSelector.sleepStatus.resting');
    if (val < 0.6) return t('moodSelector.sleepStatus.balanced');
    if (val < 0.8) return t('moodSelector.sleepStatus.clear');
    return t('moodSelector.sleepStatus.peak');
  };

  const getSocialityStatus = (val: number) => {
    if (val < 0.2) return t('moodSelector.socialStatus.ownWorld');
    if (val < 0.4) return t('moodSelector.socialStatus.introverted');
    if (val < 0.6) return t('moodSelector.socialStatus.selective');
    if (val < 0.8) return t('moodSelector.socialStatus.sharing');
    return t('moodSelector.socialStatus.everyone');
  };

  const currentPalette = generatePaletteFromDimensions(energy, sleep, sociality);
  const currentPhrase = t(getPhraseKeyFromDimensions(energy, sleep, sociality));

  return (
    <View style={styles.container}>
      {/* 1. Enerji Slider */}
      <SingleSlider
        title={t('moodSelector.energyTitle')}
        value={energy}
        statusLabel={getEnergyStatus(energy)}
        minLabel={t('moodSelector.energyMin')}
        maxLabel={t('moodSelector.energyMax')}
        gradientColors={['#607590', '#F0A23B']}
        gradientId="energyGrad"
        onChange={(val) => onChange({ ...dimensions, energy: val })}
      />

      {/* 2. Uyku / Zihin Slider */}
      <SingleSlider
        title={t('moodSelector.sleepTitle')}
        value={sleep}
        statusLabel={getSleepStatus(sleep)}
        minLabel={t('moodSelector.sleepMin')}
        maxLabel={t('moodSelector.sleepMax')}
        gradientColors={['#7E6CC9', '#95D4A2']}
        gradientId="sleepGrad"
        onChange={(val) => onChange({ ...dimensions, sleep: val })}
      />

      {/* 3. Sosyallik Slider */}
      <SingleSlider
        title={t('moodSelector.socialityTitle')}
        value={sociality}
        statusLabel={getSocialityStatus(sociality)}
        minLabel={t('moodSelector.socialMin')}
        maxLabel={t('moodSelector.socialMax')}
        gradientColors={['#D86B93', '#FF2A6D']}
        gradientId="socialGrad"
        onChange={(val) => onChange({ ...dimensions, sociality: val })}
      />

      {/* Live Palette Card Preview */}
      <View style={styles.paletteCard}>
        <Text style={styles.paletteHeader}>{t('moodSelector.livePreviewLabel')}</Text>

        <View style={styles.swatchRow}>
          {currentPalette.map((color, index) => (
            <View key={color + index} style={[styles.swatch, { backgroundColor: color }]} />
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.phraseTitle}>{currentPhrase}</Text>
          <Text style={styles.hexCodesText}>
            {currentPalette.map((c) => c.toLowerCase()).join('  ')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 24,
  },
  sliderBlock: {
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statusText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  track: {
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
    marginVertical: 4,
  } as any,
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#333339',
    borderWidth: 3,
    borderColor: '#EFEFEF',
    top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minMaxText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  paletteCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    gap: 14,
  },
  paletteHeader: {
    fontSize: 13,
    color: '#A0A0A6',
    fontWeight: '500',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  swatch: {
    flex: 1,
    height: 64,
    borderRadius: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  phraseTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hexCodesText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#8E8E93',
  },
});
