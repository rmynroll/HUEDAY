import { addYears, differenceInDays, format, parseISO } from 'date-fns';
import type { SealMotif } from '../types/capsule';

/**
 * Calculates open date (exactly 1 year after sealedDate).
 * Handles Feb 29 leap year -> Feb 28 non-leap year correctly.
 */
export function calculateCapsuleOpenDate(sealedDateStr: string): string {
  const [yearStr, monthStr, dayStr] = sealedDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const nextYear = year + 1;

  // Leap year Feb 29 check
  if (month === 2 && day === 29) {
    const isNextYearLeap = (nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0;
    if (!isNextYearLeap) {
      return `${nextYear}-02-28`;
    }
  }

  const sealedDate = parseISO(sealedDateStr);
  const openDate = addYears(sealedDate, 1);
  return format(openDate, 'yyyy-MM-dd');
}

/**
 * Calculates remaining days until open date relative to current date (Math.ceil).
 */
export function calculateDaysRemaining(openDateStr: string, currentDateStr: string): number {
  if (openDateStr <= currentDateStr) return 0;

  const current = parseISO(currentDateStr);
  const open = parseISO(openDateStr);
  const diffDays = differenceInDays(open, current);

  return Math.max(0, Math.ceil(diffDays));
}

/**
 * Determines envelope aging stage based on days passed since sealing:
 * - 0-90 days (0-3 months): 'fresh' (smooth clean paper)
 * - 91-180 days (3-6 months): 'aged' (subtle paper texture)
 * - 181+ days (6-12 months): 'ancient' (aged vintage texture + deckled edges)
 */
export function getEnvelopeAgingStage(
  sealedDateStr: string,
  currentDateStr: string
): 'fresh' | 'aged' | 'ancient' {
  const sealed = parseISO(sealedDateStr);
  const current = parseISO(currentDateStr);
  const daysPassed = Math.max(0, differenceInDays(current, sealed));

  if (daysPassed <= 90) return 'fresh';
  if (daysPassed <= 180) return 'aged';
  return 'ancient';
}

/**
 * Determines the wax seal motif based on SpecialEvent metadata.
 */
export function determineSealMotif(
  eventCategory?: string,
  textureVariant?: string
): SealMotif {
  if (textureVariant === 'full-moon' || textureVariant === 'supermoon' || eventCategory === 'astronomical') {
    return 'moon';
  }
  if (textureVariant === 'birthday' || textureVariant === 'milestone' || eventCategory === 'personal') {
    return 'star';
  }
  if (textureVariant === 'first-snow' || textureVariant === 'winter-solstice' || eventCategory === 'weather') {
    return 'snow';
  }
  if (textureVariant === 'summer-solstice') {
    return 'sun';
  }
  if (textureVariant === 'meteor-shower') {
    return 'fire';
  }
  return 'standard';
}
