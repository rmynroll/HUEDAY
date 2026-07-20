import { clamp, hexToHsl, hexToRgb, hslToHex } from './color';
import i18n from './i18n';
import type { ColorMoodEmotion, ColorMoodEntry } from '../types/card';

export const COLOR_MOOD_BASE: Record<ColorMoodEmotion, string> = {
  joy: '#F5C445',
  sadness: '#5B9BD5',
  anger: '#E24B4A',
  anxiety: '#9B7FD4',
  calm: '#6FBF73',
  excitement: '#F0997B',
};

/** i18n keys for each emotion label — translate with t() at the point of render. */
export const COLOR_MOOD_LABELS: Record<ColorMoodEmotion, string> = {
  joy: 'colorMood.emotions.joy',
  sadness: 'colorMood.emotions.sadness',
  anger: 'colorMood.emotions.anger',
  anxiety: 'colorMood.emotions.anxiety',
  calm: 'colorMood.emotions.calm',
  excitement: 'colorMood.emotions.excitement',
};

/** i18n keys for each intensity label — translate with t() at the point of render. */
export const INTENSITY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'colorMood.intensity.1',
  2: 'colorMood.intensity.2',
  3: 'colorMood.intensity.3',
};

export const COLOR_MOOD_ORDER: ColorMoodEmotion[] = [
  'joy',
  'sadness',
  'anger',
  'anxiety',
  'calm',
  'excitement',
];

/** Bir duygunun temel rengini 3 yoğunluk kademesine göre soluklaştırır/koyulaştırır. */
export function shadeForIntensity(baseHex: string, intensity: 1 | 2 | 3): string {
  const [h, s, l] = hexToHsl(baseHex);
  if (intensity === 1) return hslToHex(h, clamp(s - 25, 15, 100), clamp(l + 22, 0, 92));
  if (intensity === 3) return hslToHex(h, clamp(s + 12, 0, 96), clamp(l - 16, 8, 100));
  return hslToHex(h, s, l);
}

export interface MonthColorSummary {
  blendColor: string;
  topEmotion: ColorMoodEmotion | null;
  topEmotionLabel: string;
}

/** Bir aydaki tüm renk-duygu girişlerinden harman renk ve en sık duyguyu üretir. */
export function computeMonthColorSummary(entries: ColorMoodEntry[]): MonthColorSummary {
  if (entries.length === 0) {
    return { blendColor: '#E5E5EA', topEmotion: null, topEmotionLabel: i18n.t('colorMood.noRecordYet') };
  }

  const totals = entries.reduce(
    (acc, entry) => {
      const [r, g, b] = hexToRgb(entry.color);
      acc.r += r;
      acc.g += g;
      acc.b += b;
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );
  const count = entries.length;
  const toHex = (v: number) => Math.round(v / count).toString(16).padStart(2, '0');
  const blendColor = `#${toHex(totals.r)}${toHex(totals.g)}${toHex(totals.b)}`.toUpperCase();

  const emotionCounts = new Map<ColorMoodEmotion, number>();
  for (const entry of entries) {
    emotionCounts.set(entry.emotion, (emotionCounts.get(entry.emotion) || 0) + 1);
  }
  let topEmotion: ColorMoodEmotion | null = null;
  let topCount = 0;
  for (const [emotion, c] of emotionCounts) {
    if (c > topCount) {
      topCount = c;
      topEmotion = emotion;
    }
  }

  return {
    blendColor,
    topEmotion,
    topEmotionLabel: topEmotion ? i18n.t(COLOR_MOOD_LABELS[topEmotion]) : i18n.t('colorMood.noRecordYet'),
  };
}
