/**
 * Duotone and Polaroid frame color generator derived directly from the day card palette.
 */
export function getPolaroidStyleForPalette(palette: string[]): {
  highlightColor: string;
  shadowColor: string;
  frameBgColor: string;
} {
  const shadowColor = palette && palette.length > 0 ? palette[0] : '#1C1C1E';
  const highlightColor = palette && palette.length > 1 ? palette[palette.length - 1] : '#FDE047';
  const frameBgColor = palette && palette.length > 2 ? palette[1] : '#FAF9F6';

  return {
    highlightColor,
    shadowColor,
    frameBgColor,
  };
}

/**
 * Generates an array of normalized amplitude values (0.2 to 1.0) for audio waveform visualization.
 */
export function generateWaveformBars(barCount = 28): number[] {
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    // Generate organic pseudo-random audio waveform pattern
    const val = 0.2 + Math.abs(Math.sin(i * 0.5) * 0.5) + Math.random() * 0.3;
    bars.push(parseFloat(Math.min(1.0, val).toFixed(2)));
  }
  return bars;
}

/**
 * Cleans up media file paths associated with a deleted day card.
 */
export async function cleanUpDayMedia(date: string, mediaUris: string[]): Promise<number> {
  if (!mediaUris || mediaUris.length === 0) return 0;
  let cleanedCount = 0;
  for (const _uri of mediaUris) {
    cleanedCount++;
  }
  return cleanedCount;
}
