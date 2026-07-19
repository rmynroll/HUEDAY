import type { DayCard, MoodEntry } from '../types/card';
import { clamp, hslToHex, lerp, mulberry32, normalizeHue } from './color';
import { getStyle, pickStyle } from './cardStyles';

// Ruh hali eksenini soğuk/koyu (düşük) -> ılık/canlı (yüksek) bir hue yoluna eşler.
const MOOD_HUE_STOPS = [255, 210, 165, 95, 35];

function moodToBaseHue(mood: number): number {
  const m = clamp(mood, 0, 1);
  const idx = m * (MOOD_HUE_STOPS.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(MOOD_HUE_STOPS.length - 1, lo + 1);
  return lerp(MOOD_HUE_STOPS[lo], MOOD_HUE_STOPS[hi], idx - lo);
}

const LOW_MOOD_PHRASES = ['Bugün yavaşladın.', 'Sessiz bir gündü.', 'İçine döndüğün bir gün.', 'Kendine nazik davran.'];
const MID_MOOD_PHRASES = ['Dengede bir gün.', 'Sakin ve istikrarlı.', 'Ortada bir yerdeydin.', 'Alışıldık bir ritim.'];
const HIGH_MOOD_PHRASES = ['Bugün parlaktın.', 'Enerjin yüksekti.', 'Işıltılı bir gündü.', 'Kendini bulduğun bir gün.'];

function pickPhrase(mood: number, rng: () => number): string {
  const pool = mood < 0.34 ? LOW_MOOD_PHRASES : mood < 0.67 ? MID_MOOD_PHRASES : HIGH_MOOD_PHRASES;
  return pool[Math.floor(rng() * pool.length)];
}

export interface GenerateCardInput extends MoodEntry {
  /** Huday+ olmayan kullanıcılar yalnızca ücretsiz stilleri görür. */
  freeStylesOnly?: boolean;
  seed?: number;
}

/**
 * Ruh hali + etiketlerden benzersiz bir gün kartı üretir. Her çağrıda rastgele bir
 * seed kullanılır, bu yüzden aynı mood iki kez girilse bile kart asla aynı çıkmaz
 * (bkz. HUEDAY.pdf 4.1 "Hue Motoru").
 */
export function generateCard(input: GenerateCardInput): DayCard {
  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);

  const mood = clamp(input.mood, 0, 1);
  const energy = input.tags.energy ?? 0.5;
  const restedness = input.tags.sleep ?? 0.5;
  const sociality = input.tags.sociality ?? 0.5;

  const socialShift = (sociality - 0.5) * 40; // dışa dönüklük -> ılık ton kayması
  const baseHue = normalizeHue(moodToBaseHue(mood) + socialShift + (rng() - 0.5) * 24);

  const baseSaturation = 35 + energy * 45; // 35-80
  const baseLightness = 38 + restedness * 26; // 38-64

  const colorCount = rng() > 0.5 ? 5 : 4;
  const palette: string[] = [];
  for (let i = 0; i < colorCount; i++) {
    const spread = (i - (colorCount - 1) / 2) * (16 + rng() * 12);
    const hue = normalizeHue(baseHue + spread + (rng() - 0.5) * 10);
    const saturation = clamp(baseSaturation + (rng() - 0.5) * 22, 12, 96);
    const lightness = clamp(baseLightness + (rng() - 0.5) * 26 + i * (8 / colorCount), 12, 90);
    palette.push(hslToHex(hue, saturation, lightness));
  }

  const style = (() => {
    if (input.styleId) {
      const selected = pickStyle(false, rng); // get style pool
      const matched = getStyle(input.styleId);
      if (input.freeStylesOnly && !matched.free) {
        return pickStyle(true, rng);
      }
      return matched;
    }
    return pickStyle(input.freeStylesOnly ?? true, rng);
  })();

  return {
    date: input.date,
    mood,
    tags: input.tags,
    note: input.note,
    palette,
    styleId: style.id,
    phrase: pickPhrase(mood, rng),
    seed,
    song: input.song,
    createdAt: new Date().toISOString(),
  };
}
