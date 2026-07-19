import type { CardStyleId } from '../types/card';

export interface CardStyleDefinition {
  id: CardStyleId;
  name: string;
  free: boolean;
  textureKind: 'flat-gradient' | 'grain' | 'chrome' | 'watercolor' | 'neon-glow';
  headingFont: string;
  bodyFont: string;
}

export const CARD_STYLES: CardStyleDefinition[] = [
  {
    id: 'minimal-gradient',
    name: 'Minimal Gradyan',
    free: true,
    textureKind: 'flat-gradient',
    headingFont: 'System',
    bodyFont: 'System',
  },
  {
    id: 'paper-texture',
    name: 'Kâğıt Doku',
    free: true,
    textureKind: 'grain',
    headingFont: 'serif',
    bodyFont: 'System',
  },
  {
    id: 'y2k-chrome',
    name: 'Y2K Krom',
    free: false,
    textureKind: 'chrome',
    headingFont: 'System',
    bodyFont: 'System',
  },
  {
    id: 'cottagecore-watercolor',
    name: 'Cottagecore Sulu Boya',
    free: false,
    textureKind: 'watercolor',
    headingFont: 'serif',
    bodyFont: 'serif',
  },
  {
    id: 'night-neon',
    name: 'Gece Neonu',
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
