import { hslToHex } from './color';

export function generatePaletteFromDimensions(energy: number, sleep: number, sociality: number): string[] {
  // Energy controls warm gold/amber (35-60)
  const energyHue = 35 + energy * 25;
  // Sleep controls cool teal/mint/lavender (160-260)
  const sleepHue = 165 + sleep * 95;
  // Sociality controls distinct vivid pink/magenta (320-350)
  const socialHue = 328 + (sociality - 0.5) * 35;

  // Distinct, prominent pink color driven by sociality slider (vivid & clear)
  const pinkColor = hslToHex(socialHue, 60 + sociality * 35, 50 + (1 - sociality) * 12);
  const energyColor = hslToHex(energyHue, 65 + energy * 25, 48 + energy * 12);
  const sleepColor = hslToHex(sleepHue, 45 + sleep * 35, 45 + sleep * 18);

  // Harmonized warm rose/violet blend
  const blendHue = (socialHue + energyHue) / 2;
  const blendColor = hslToHex(blendHue, 70, 56);

  return [pinkColor, energyColor, sleepColor, blendColor];
}

/** Returns an i18n key under `dimensions.*` — translate with t() at the point of render. */
export function getPhraseKeyFromDimensions(energy: number, sleep: number, sociality: number): string {
  if (energy > 0.65 && sleep > 0.65) return 'dimensions.flowingNoon';
  if (energy > 0.7 && sociality > 0.7) return 'dimensions.blazingJoy';
  if (energy > 0.7) return 'dimensions.highFrequency';
  if (sleep > 0.7 && sociality < 0.35) return 'dimensions.clearRetreat';
  if (sleep > 0.7) return 'dimensions.balancedAndClear';
  if (energy < 0.35 && sleep < 0.35) return 'dimensions.foggyFocus';
  if (energy < 0.35) return 'dimensions.idleCalm';
  if (sociality > 0.7) return 'dimensions.openCircle';
  if (sociality < 0.35) return 'dimensions.ownUniverse';
  return 'dimensions.calmBalance';
}
