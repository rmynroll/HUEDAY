(globalThis as any).__DEV__ = true;

import type { AgendaTask } from '../types/agenda';
import { carryTaskToTomorrowLogic, getMonthlyTaskSummaries } from './taskRepository';

function runAgendaUnitTests() {
  console.log('==============================================');
  console.log('    HUEDAY DIGITAL AGENDA UNIT TESTS (2026)   ');
  console.log('==============================================');

  let passedCount = 0;
  let totalCount = 0;

  // TEST 1: Carry Task to Tomorrow
  totalCount++;
  const originalTask: AgendaTask = {
    id: 'task_101',
    date: '2026-07-20',
    title: 'Tasarım taslağını tamamla',
    completed: true, // Should reset to uncompleted on tomorrow
    createdAt: '2026-07-20T10:00:00.000Z',
    reminderTime: '15:00',
    order: 0,
  };

  const carriedTask = carryTaskToTomorrowLogic(originalTask);
  console.log(`\n[TEST 1] Carry Task to Tomorrow:`);
  console.log(`  Orijinal Tarih: ${originalTask.date} -> Yeni Tarih: ${carriedTask.date}`);
  console.log(`  Orijinal Status: ${originalTask.completed} -> Yeni Status: ${carriedTask.completed}`);

  if (carriedTask.date === '2026-07-21' && carriedTask.completed === false && carriedTask.id !== originalTask.id) {
    console.log('✅ PASSED: Carry task to tomorrow successfully shifted date to 2026-07-21 and reset completion state.');
    passedCount++;
  } else {
    console.error('❌ FAILED: Carry task to tomorrow logic returned incorrect date or state.');
  }

  // TEST 2: Monthly Task Summaries Aggregator
  totalCount++;
  const sampleTasksRecord: Record<string, AgendaTask[]> = {
    '2026-07-01': [
      { id: 't1', date: '2026-07-01', title: 'Task 1', completed: true, createdAt: '', order: 0 },
      { id: 't2', date: '2026-07-01', title: 'Task 2', completed: true, createdAt: '', order: 1 },
    ],
    '2026-07-14': [
      { id: 't3', date: '2026-07-14', title: 'Task 3', completed: true, createdAt: '', order: 0 },
      { id: 't4', date: '2026-07-14', title: 'Task 4', completed: false, createdAt: '', order: 1 },
      { id: 't5', date: '2026-07-14', title: 'Task 5', completed: true, createdAt: '', order: 2 },
    ],
    '2026-08-01': [
      { id: 't6', date: '2026-08-01', title: 'Task in August', completed: true, createdAt: '', order: 0 },
    ],
  };

  const summaries = getMonthlyTaskSummaries('2026-07', sampleTasksRecord);
  console.log('\n[TEST 2] Monthly Task Summaries for 2026-07:');
  console.log('  Summaries Output:', JSON.stringify(summaries));

  const day1Ok = summaries['2026-07-01']?.total === 2 && summaries['2026-07-01']?.completed === 2;
  const day14Ok = summaries['2026-07-14']?.total === 3 && summaries['2026-07-14']?.completed === 2;
  const augExcluded = !summaries['2026-08-01'];

  if (day1Ok && day14Ok && augExcluded) {
    console.log('✅ PASSED: Monthly task summaries calculated correctly in a single pass.');
    passedCount++;
  } else {
    console.error('❌ FAILED: Monthly task summaries calculation mismatch.');
  }

  console.log(`\n==============================================`);
  console.log(`  RESULT: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log(`==============================================\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runAgendaUnitTests();
