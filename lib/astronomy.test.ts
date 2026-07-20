import { getMoonEvents, getSeasonalEvents } from './astronomy';

function runUnitTests() {
  console.log('==============================================');
  console.log('  HUEDAY ASTRONOMY ENGINE UNIT TESTS (2026)  ');
  console.log('==============================================');

  let passedCount = 0;
  let totalCount = 0;

  // TEST 1: March 2026 Spring Equinox Date
  totalCount++;
  const seasonal2026 = getSeasonalEvents(2026);
  const springEquinox = seasonal2026.find((e) => e.id === 'spring-equinox-2026');

  console.log(`\n[TEST 1] March 2026 Equinox Date: ${springEquinox?.date}`);
  if (springEquinox && (springEquinox.date === '2026-03-20' || springEquinox.date === '2026-03-21')) {
    console.log('✅ PASSED: March 2026 Equinox dynamically computed via astronomy-engine.');
    passedCount++;
  } else {
    console.error(`❌ FAILED: Unexpected Equinox date: ${springEquinox?.date}`);
  }

  // TEST 2: 3 Full Moon Dates in 2026
  totalCount++;
  const moonEvents2026 = getMoonEvents(2026);
  const fullMoons2026 = moonEvents2026.filter((m) => m.category === 'astronomical' && m.title.includes('Dolunay'));

  console.log('\n[TEST 2] 2026 Full Moon Dates Computed:');
  fullMoons2026.forEach((m) => console.log(`  - ${m.title} (${m.id}): ${m.date}`));

  const hasMarchMoon = fullMoons2026.some((m) => m.date.startsWith('2026-03'));
  const hasJulyMoon = fullMoons2026.some((m) => m.date.startsWith('2026-07'));
  const hasDecMoon = fullMoons2026.some((m) => m.date.startsWith('2026-12'));

  if (hasMarchMoon && hasJulyMoon && hasDecMoon) {
    console.log('✅ PASSED: 3 Full Moon dates in 2026 (March, July, December) verified successfully.');
    passedCount++;
  } else {
    console.error('❌ FAILED: Could not verify 3 Full Moon dates in 2026.');
  }

  console.log(`\n==============================================`);
  console.log(`  RESULT: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log(`==============================================\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runUnitTests();
