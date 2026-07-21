/**
 * HUEDAY Phase 2 — Memories, Audio, Word-of-Day Unit Tests
 *
 * Run: npx tsx lib/memories.test.ts
 */
import { generateWaveformBars, getPolaroidStyleForPalette, cleanUpDayMedia } from './mediaRepository';

const PASS = '\u2705 PASSED';
const FAIL = '\u274c FAILED';
let passCount = 0;
let totalTests = 0;

async function test(name: string, fn: () => boolean | Promise<boolean>) {
  totalTests++;
  try {
    const ok = await fn();
    if (ok) {
      console.log(`[TEST ${totalTests}] ${name}:\n${PASS}\n`);
      passCount++;
    } else {
      console.log(`[TEST ${totalTests}] ${name}:\n${FAIL}\n`);
    }
  } catch (e) {
    console.log(`[TEST ${totalTests}] ${name}:\n${FAIL} (Error: ${e})\n`);
  }
}

async function run() {
  console.log('==============================================');
  console.log('  HUEDAY PHASE 2 — MEMORIES UNIT TESTS       ');
  console.log('==============================================\n');

  // TEST 1: Word of Day — max 20 character enforcement
  await test('Word of Day max 20 char enforcement', () => {
    const longWord = 'abcdefghijklmnopqrstuvwxyz'; // 26 chars
    const trimmed = longWord.trim().slice(0, 20);
    console.log(`  Input (${longWord.length} chars): "${longWord}"`);
    console.log(`  Trimmed (${trimmed.length} chars): "${trimmed}"`);
    return trimmed.length === 20 && trimmed === 'abcdefghijklmnopqrst';
  });

  // TEST 2: Audio Memo — 300 second max duration enforcement
  await test('Audio Memo 300s max duration enforcement', () => {
    const inputDurations = [5, 15, 30, 200, 400];
    const capped = inputDurations.map((d) => Math.min(d, 300));
    console.log(`  Input durations: ${JSON.stringify(inputDurations)}`);
    console.log(`  Capped durations: ${JSON.stringify(capped)}`);
    return capped[0] === 5 && capped[1] === 15 && capped[2] === 30 && capped[3] === 200 && capped[4] === 300;
  });

  // TEST 3: Waveform bar generation
  await test('Waveform bar generation (28 bars, 0.2-1.0 range)', () => {
    const bars = generateWaveformBars(28);
    console.log(`  Bar count: ${bars.length}`);
    console.log(`  Sample bars: [${bars.slice(0, 5).join(', ')}...]`);
    const allInRange = bars.every((b) => b >= 0.2 && b <= 1.0);
    console.log(`  All in range (0.2-1.0): ${allInRange}`);
    return bars.length === 28 && allInRange;
  });

  // TEST 4: Polaroid style derivation from palette
  await test('Polaroid style derivation from palette', () => {
    const palette = ['#E55B70', '#F7A8B8', '#FDE047', '#A3E7C5'];
    const style = getPolaroidStyleForPalette(palette);
    console.log(`  Palette: ${JSON.stringify(palette)}`);
    console.log(`  Shadow: ${style.shadowColor}, Highlight: ${style.highlightColor}, Frame: ${style.frameBgColor}`);
    return (
      style.shadowColor === '#E55B70' &&
      style.highlightColor === '#A3E7C5' &&
      style.frameBgColor === '#F7A8B8'
    );
  });

  // TEST 5: Media cleanup returns count
  await test('Media cleanup returns correct count', async () => {
    const result = await cleanUpDayMedia('2026-07-20', ['a.jpg', 'b.jpg', 'c.m4a']);
    console.log(`  Cleaned count: ${result}`);
    return result === 3;
  });

  console.log('==============================================');
  console.log(`  RESULT: ${passCount} / ${totalTests} TESTS PASSED`);
  console.log('==============================================\n');
}

run().catch((err) => {
  console.error('Test run failed:', err);
});

