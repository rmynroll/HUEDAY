import type { CardStyleId } from '../types/card';

export interface CardStyleDefinition {
  id: CardStyleId;
  i18nKey: string;
  free: boolean;
  textureKind: 'flat-gradient' | 'grain' | 'chrome' | 'watercolor' | 'neon-glow';
  headingFont: string;
  bodyFont: string;
}

export const CARD_STYLES: CardStyleDefinition[] = [
  {
    id: 'minimal-gradient',
    i18nKey: 'minimalGradient',
    free: true,
    textureKind: 'flat-gradient',
    headingFont: 'System',
    bodyFont: 'System',
  },
  {
    id: 'paper-texture',
    i18nKey: 'paperTexture',
    free: true,
    textureKind: 'grain',
    headingFont: 'serif',
    bodyFont: 'System',
  },
  {
    id: 'y2k-chrome',
    i18nKey: 'y2kChrome',
    free: false,
    textureKind: 'chrome',
    headingFont: 'System',
    bodyFont: 'System',
  },
  {
    id: 'cottagecore-watercolor',
    i18nKey: 'cottagecoreWatercolor',
    free: false,
    textureKind: 'watercolor',
    headingFont: 'serif',
    bodyFont: 'serif',
  },
  {
    id: 'night-neon',
    i18nKey: 'nightNeon',
    free: false,
    textureKind: 'neon-glow',
    headingFont: 'System',
    bodyFont: 'System',
  },
];

export function getStyle(id: CardStyleId): CardStyleDefinition {
  return CARD_STYLES.find((s) => s.id === id) ?? CARD_STYLES[0];
}

export function pickStyle(freeOnly: boolean, rng: () => number): CardStyleDefinition {
  const pool = freeOnly ? CARD_STYLES.filter((s) => s.free) : CARD_STYLES;
  return pool[Math.floor(rng() * pool.length)];
}
