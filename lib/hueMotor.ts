import { getCrystalById } from '../constants/crystals';
import type { DayCard, MoodEntry } from '../types/card';
import type { SpecialEvent } from '../types/specialEvents';
import { getStyle, pickStyle } from './cardStyles';
import { clamp, hslToHex, lerp, mulberry32, normalizeHue } from './color';
import i18n from './i18n';
import { blendStoneColorIntoPalette } from './threeRituals';

// Ruh hali eksenini soğuk/koyu (düşük) -> ılık/canlı (yüksek) bir hue yoluna eşler.
const MOOD_HUE_STOPS = [255, 210, 165, 95, 35];

function moodToBaseHue(mood: number): number {
  const m = clamp(mood, 0, 1);
  const idx = m * (MOOD_HUE_STOPS.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(MOOD_HUE_STOPS.length - 1, lo + 1);
  return lerp(MOOD_HUE_STOPS[lo], MOOD_HUE_STOPS[hi], idx - lo);
}

function pickPhrase(mood: number, rng: () => number): string {
  const key = mood < 0.34 ? 'hueMotor.low' : mood < 0.67 ? 'hueMotor.mid' : 'hueMotor.high';
  const pool = i18n.t(key, { returnObjects: true }) as string[];
  return pool[Math.floor(rng() * pool.length)];
}

export interface GenerateCardInput extends MoodEntry {
  /** Huday+ olmayan kullanıcılar yalnızca ücretsiz stilleri görür. */
  freeStylesOnly?: boolean;
  seed?: number;
  specialEvents?: SpecialEvent[];
}

/**
 * Ruh hali + etiketler + özel nadir olaylardan benzersiz bir gün kartı üretir.
 */
export function generateCard(input: GenerateCardInput): DayCard {
  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);

  const mood = clamp(input.mood, 0, 1);
  const energy = input.tags.energy ?? 0.5;
  const restedness = input.tags.sleep ?? 0.5;
  const sociality = input.tags.sociality ?? 0.5;

  const primaryEvent = input.specialEvents && input.specialEvents.length > 0 ? input.specialEvents[0] : undefined;
  const badges = input.specialEvents && input.specialEvents.length > 1 ? input.specialEvents.slice(1) : undefined;
  const rarity = primaryEvent ? primaryEvent.category : 'standard';

  const yearStr = input.date.split('-')[0] || String(new Date().getFullYear());
  const cleanTitle = primaryEvent
    ? primaryEvent.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}]/gu, '').trim()
    : '';
  const stampText = primaryEvent ? `${cleanTitle} · ${yearStr}` : undefined;

  const baseHue = normalizeHue(moodToBaseHue(mood) + (rng() - 0.5) * 20);
  const baseSaturation = 45 + energy * 40;
  const baseLightness = 42 + restedness * 24;

  const colorCount = 4;
  const palette: string[] = [];

  // Dedicated vibrant pink/rose swatch driven directly by sociality
  const socialPinkHue = normalizeHue(328 + (sociality - 0.5) * 35);
  const socialPinkSat = clamp(55 + sociality * 40, 45, 95);
  const socialPinkLight = clamp(50 + (1 - sociality) * 12, 38, 70);
  palette.push(hslToHex(socialPinkHue, socialPinkSat, socialPinkLight));

  // If there's a special rare texture variant, inject a thematic accent color
  if (primaryEvent?.textureVariant === 'full-moon' || primaryEvent?.textureVariant === 'supermoon') {
    palette.push('#E2E8F0'); // Silver lunar highlight
  } else if (primaryEvent?.textureVariant === 'first-snow') {
    palette.push('#E0F2FE'); // Ice crystal highlight
  } else if (primaryEvent?.textureVariant === 'birthday') {
    palette.push('#FDE047'); // Birthday golden sparkle
  }

  for (let i = palette.length; i < colorCount; i++) {
    const spread = (i - (colorCount - 1) / 2) * (28 + rng() * 14);
    const hue = normalizeHue(baseHue + spread);
    const saturation = clamp(baseSaturation + (rng() - 0.5) * 20, 25, 95);
    const lightness = clamp(baseLightness + (rng() - 0.5) * 20, 25, 85);
    palette.push(hslToHex(hue, saturation, lightness));
  }

  // If a crystal stone is selected, blend 18% of the stone color into the palette
  let finalPalette = palette;
  if (input.stoneId) {
    const crystal = getCrystalById(input.stoneId);
    if (crystal) {
      finalPalette = blendStoneColorIntoPalette(palette, crystal.color, 0.18);
    }
  }

  const style = (() => {
    if (input.styleId) {
      const selected = pickStyle(false, rng);
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
    palette: finalPalette,
    styleId: style.id,
    phrase: pickPhrase(mood, rng),
    seed,
    song: input.song,
    stoneId: input.stoneId,
    manifestText: input.manifestText,
    isManifestSealed: input.isManifestSealed,
    createdAt: new Date().toISOString(),
    rarity,
    primaryEvent,
    badges,
    stampText,
    colorMoods: input.colorMoods,
  };
}
