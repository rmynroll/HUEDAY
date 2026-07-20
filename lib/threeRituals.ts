import type { DayCard } from '../types/card';
import { getCrystalById } from '../constants/crystals';

/**
 * Converts Hex color string to RGB object.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts RGB numbers to Hex color string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Blends a stone's accent color into an existing palette array with a given blendFactor (default 18%).
 */
export function blendStoneColorIntoPalette(
  palette: string[],
  stoneHex: string,
  blendFactor = 0.18
): string[] {
  if (!palette || palette.length === 0 || !stoneHex) return palette;

  const stoneRgb = hexToRgb(stoneHex);

  return palette.map((colorHex) => {
    const originalRgb = hexToRgb(colorHex);

    const r = originalRgb.r * (1 - blendFactor) + stoneRgb.r * blendFactor;
    const g = originalRgb.g * (1 - blendFactor) + stoneRgb.g * blendFactor;
    const b = originalRgb.b * (1 - blendFactor) + stoneRgb.b * blendFactor;

    return rgbToHex(r, g, b);
  });
}

/**
 * Calculates the Day Seal Progress Ring completion fraction (0.0 to 1.0 in 4 quarters).
 * Quarters:
 * - 0.25: Mood logged (DayCard exists)
 * - 0.25: Morning ritual (Stone or Manifest set)
 * - 0.25: Midday ritual (Memories, Photos, Word of Day set)
 * - 0.25: Evening ritual (Gratitude or Song set)
 */
export function calculateDaySealProgress(
  card?: DayCard,
  extraLayers?: { hasMemories?: boolean; hasGratitude?: boolean }
): number {
  if (!card) return 0.0;

  let count = 1; // Mood logged is 1st layer

  // Layer 2: Morning Ritual (Stone or Manifest)
  if (card.stoneId || card.manifestText) {
    count++;
  }

  // Layer 3: Midday Ritual (Memories, Photos, Word of Day)
  if (card.wordOfDay || extraLayers?.hasMemories) {
    count++;
  }

  // Layer 4: Evening Ritual (Gratitude, Song)
  if (card.song || extraLayers?.hasGratitude) {
    count++;
  }

  return Math.min(1.0, count * 0.25);
}
