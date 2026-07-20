(globalThis as any).__DEV__ = true;

import {
  calculateCapsuleOpenDate,
  calculateDaysRemaining,
  getEnvelopeAgingStage,
} from './capsule';

function runCapsuleUnitTests() {
  console.log('==============================================');
  console.log('    HUEDAY TIME CAPSULE UNIT TESTS (2026)     ');
  console.log('==============================================');

  let passedCount = 0;
  let totalCount = 0;

  // TEST 1: Normal Year Open Date (2026-07-20 -> 2027-07-20)
  totalCount++;
  const openDateNormal = calculateCapsuleOpenDate('2026-07-20');
  console.log(`\n[TEST 1] Normal Year Open Date: '2026-07-20' -> '${openDateNormal}'`);
  if (openDateNormal === '2027-07-20') {
    console.log('✅ PASSED: Open date calculated exactly 1 year later.');
    passedCount++;
  } else {
    console.error(`❌ FAILED: Unexpected open date: ${openDateNormal}`);
  }

  // TEST 2: Leap Year Feb 29 Open Date (2024-02-29 -> 2025-02-28)
  totalCount++;
  const openDateLeap = calculateCapsuleOpenDate('2024-02-29');
  console.log(`\n[TEST 2] Leap Year Feb 29 Open Date: '2024-02-29' -> '${openDateLeap}'`);
  if (openDateLeap === '2025-02-28') {
    console.log('✅ PASSED: Feb 29 leap year date safely mapped to Feb 28 in non-leap year 2025.');
    passedCount++;
  } else {
    console.error(`❌ FAILED: Unexpected leap year open date: ${openDateLeap}`);
  }

  // TEST 3: Days Remaining Calculator
  totalCount++;
  const daysLeftFuture = calculateDaysRemaining('2027-07-20', '2026-07-20');
  const daysLeftToday = calculateDaysRemaining('2026-07-20', '2026-07-20');
  const daysLeftPast = calculateDaysRemaining('2025-07-20', '2026-07-20');

  console.log(`\n[TEST 3] Days Remaining Countdown:`);
  console.log(`  Future (365 days): ${daysLeftFuture}`);
  console.log(`  Today (0 days): ${daysLeftToday}`);
  console.log(`  Past (0 days): ${daysLeftPast}`);

  if (daysLeftFuture === 365 && daysLeftToday === 0 && daysLeftPast === 0) {
    console.log('✅ PASSED: Days remaining calculated correctly.');
    passedCount++;
  } else {
    console.error('❌ FAILED: Days remaining calculation mismatch.');
  }

  // TEST 4: Envelope Aging Stage
  totalCount++;
  const stageFresh = getEnvelopeAgingStage('2026-07-01', '2026-08-01'); // 31 days -> fresh
  const stageAged = getEnvelopeAgingStage('2026-01-01', '2026-06-01'); // ~150 days -> aged
  const stageAncient = getEnvelopeAgingStage('2025-07-01', '2026-07-01'); // 365 days -> ancient

  console.log(`\n[TEST 4] Envelope Aging Stages:`);
  console.log(`  31 days: ${stageFresh}`);
  console.log(`  150 days: ${stageAged}`);
  console.log(`  365 days: ${stageAncient}`);

  if (stageFresh === 'fresh' && stageAged === 'aged' && stageAncient === 'ancient') {
    console.log('✅ PASSED: Envelope aging stages evaluated correctly.');
    passedCount++;
  } else {
    console.error('❌ FAILED: Envelope aging stage evaluation mismatch.');
  }

  console.log(`\n==============================================`);
  console.log(`  RESULT: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log(`==============================================\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runCapsuleUnitTests();
