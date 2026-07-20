(globalThis as any).__DEV__ = true;

import { CRYSTALS, getCrystalById } from '../constants/crystals';
import type { DayCard } from '../types/card';
import { blendStoneColorIntoPalette, calculateDaySealProgress } from './threeRituals';

function runThreeRitualsUnitTests() {
  console.log('==============================================');
  console.log('  HUEDAY THREE RITUALS PHASE 1 UNIT TESTS     ');
  console.log('==============================================');

  let passedCount = 0;
  let totalCount = 0;

  // TEST 1: Stone Catalog Integrity & Language Policy
  totalCount++;
  console.log(`\n[TEST 1] Crystal Catalog & Language Rules Check:`);
  let forbiddenWordsFound = false;

  if (CRYSTALS.length === 8) {
    CRYSTALS.forEach((stone) => {
      const text = (stone.tagline + ' ' + stone.affirmations.join(' ')).toLowerCase();
      if (text.includes('iyileştirir') || text.includes('enerji verir') || text.includes('tedavi')) {
        forbiddenWordsFound = true;
        console.error(`❌ Forbidden medical claim found in stone ${stone.name}`);
      }
    });

    if (!forbiddenWordsFound) {
      console.log('✅ PASSED: 8 crystal stones defined with strict symbol/intent language (no medical claims).');
      passedCount++;
    }
  } else {
    console.error(`❌ FAILED: Expected 8 stones, found ${CRYSTALS.length}`);
  }

  // TEST 2: Stone Color Tint Palette Blending
  totalCount++;
  const originalPalette = ['#5DC552', '#95D4A2', '#6EA931', '#F0A23B'];
  const ametist = getCrystalById('ametist')!;
  const blendedPalette = blendStoneColorIntoPalette(originalPalette, ametist.color, 0.18);

  console.log(`\n[TEST 2] Stone Color Tint Blending:`);
  console.log(`  Original Swatch 1: ${originalPalette[0]}`);
  console.log(`  Blended Swatch 1 (Ametist #9B51E0): ${blendedPalette[0]}`);

  if (
    blendedPalette.length === originalPalette.length &&
    blendedPalette[0] !== originalPalette[0] &&
    blendedPalette[0].startsWith('#')
  ) {
    console.log('✅ PASSED: Stone color blended 18% into card palette successfully.');
    passedCount++;
  } else {
    console.error('❌ FAILED: Palette color blending failed.');
  }

  // TEST 3: Day Seal Progress Ring Quarter Calculator
  totalCount++;
  const mockCardBase: DayCard = {
    date: '2026-07-20',
    mood: 0.8,
    tags: {},
    palette: ['#5DC552', '#95D4A2'],
    styleId: 'minimal-gradient',
    phrase: 'Dengede bir gün.',
    seed: 12345,
    createdAt: new Date().toISOString(),
  };

  const p0 = calculateDaySealProgress(undefined);
  const p1 = calculateDaySealProgress(mockCardBase); // 1 layer (Mood) = 0.25
  const p2 = calculateDaySealProgress({ ...mockCardBase, stoneId: 'ametist' }); // 2 layers = 0.50
  const p3 = calculateDaySealProgress({ ...mockCardBase, stoneId: 'ametist' }, { hasMemories: true }); // 3 layers = 0.75
  const p4 = calculateDaySealProgress({ ...mockCardBase, stoneId: 'ametist', song: { title: 'Test', artist: 'Artist' } }, { hasMemories: true, hasGratitude: true }); // 4 layers = 1.0

  console.log(`\n[TEST 3] Day Seal Progress Quarters:`);
  console.log(`  Empty: ${p0}`);
  console.log(`  1 Layer (Mood): ${p1}`);
  console.log(`  2 Layers (Mood + Stone): ${p2}`);
  console.log(`  3 Layers (+ Memories): ${p3}`);
  console.log(`  4 Layers (All Rituals): ${p4}`);

  if (p0 === 0.0 && p1 === 0.25 && p2 === 0.5 && p3 === 0.75 && p4 === 1.0) {
    console.log('✅ PASSED: Day Seal progress ring accurately calculates 4 quarters.');
    passedCount++;
  } else {
    console.error('❌ FAILED: Day Seal progress calculation mismatch.');
  }

  console.log(`\n==============================================`);
  console.log(`  RESULT: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log(`==============================================\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runThreeRitualsUnitTests();
