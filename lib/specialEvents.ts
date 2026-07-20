import { getMeteorEvents, getMoonEvents, getSeasonalEvents } from './astronomy';
import i18n from './i18n';
import type { DayCard } from '../types/card';
import type { SpecialEvent, UserProfile } from '../types/specialEvents';
import { checkFirstSnowEvent, LocationCoords } from './weather';

/**
 * Returns all special events occurring on a given date (dateStr: 'yyyy-MM-dd').
 */
export async function getTodaysSpecialEvents(
  dateStr: string,
  location?: LocationCoords,
  userProfile?: UserProfile,
  userCards?: Record<string, DayCard>
): Promise<SpecialEvent[]> {
  const events: SpecialEvent[] = [];
  const year = parseInt(dateStr.split('-')[0], 10) || new Date().getFullYear();
  const monthDay = dateStr.slice(5); // 'MM-dd'

  // 1. Seasonal Events
  const seasonalList = getSeasonalEvents(year);
  for (const s of seasonalList) {
    if (s.date === dateStr) events.push(s);
  }

  // 2. Astronomical Events (Moon & Meteors)
  const moonList = getMoonEvents(year);
  for (const m of moonList) {
    if (m.date === dateStr) events.push(m);
  }

  const meteorList = getMeteorEvents(year);
  for (const met of meteorList) {
    if (met.date === dateStr) events.push(met);
  }

  // 3. Personal Milestones
  if (userProfile?.birthday && userProfile.birthday === monthDay) {
    events.push({
      id: `birthday-${year}`,
      title: i18n.t('specialEvents.birthdayTitle'),
      category: 'personal',
      rarityRank: 5,
      badgeIcon: '🎂',
      date: dateStr,
      textureVariant: 'birthday',
      description: i18n.t('specialEvents.birthdayDesc'),
    });
  }

  if (userProfile?.createdAt) {
    const createdMonthDay = userProfile.createdAt.slice(5, 10);
    const createdYear = parseInt(userProfile.createdAt.split('-')[0], 10);
    if (createdMonthDay === monthDay && year > createdYear) {
      const yearsDiff = year - createdYear;
      events.push({
        id: `anniversary-${year}`,
        title: i18n.t('specialEvents.anniversaryTitle', { years: yearsDiff }),
        category: 'personal',
        rarityRank: 4,
        badgeIcon: '🌟',
        date: dateStr,
        textureVariant: 'milestone',
        description: i18n.t('specialEvents.anniversaryDesc', { years: yearsDiff }),
      });
    }
  }

  if (userCards) {
    const cardCount = Object.keys(userCards).length + 1; // including today
    if (cardCount === 100) {
      events.push({
        id: `milestone-100-${dateStr}`,
        title: i18n.t('specialEvents.milestone100Title'),
        category: 'personal',
        rarityRank: 5,
        badgeIcon: '💯',
        date: dateStr,
        textureVariant: 'milestone',
        description: i18n.t('specialEvents.milestone100Desc'),
      });
    } else if (cardCount === 365) {
      events.push({
        id: `milestone-365-${dateStr}`,
        title: i18n.t('specialEvents.milestone365Title'),
        category: 'personal',
        rarityRank: 5,
        badgeIcon: '👑',
        date: dateStr,
        textureVariant: 'milestone',
        description: i18n.t('specialEvents.milestone365Desc'),
      });
    }
  }

  // 4. Instant Weather Event (First Snow)
  const snowEvent = await checkFirstSnowEvent(dateStr, location);
  if (snowEvent) {
    events.push(snowEvent);
  }

  // Sort events by rarityRank descending
  events.sort((a, b) => b.rarityRank - a.rarityRank);

  return events;
}

/**
 * Returns all possible calendar events for a given year (for Album view future silhouettes).
 */
export function getAllPossibleEventsForYear(year: number, userProfile?: UserProfile): SpecialEvent[] {
  const events: SpecialEvent[] = [];

  events.push(...getSeasonalEvents(year));
  events.push(...getMoonEvents(year));
  events.push(...getMeteorEvents(year));

  if (userProfile?.birthday) {
    events.push({
      id: `birthday-${year}`,
      title: i18n.t('specialEvents.birthdayTitle'),
      category: 'personal',
      rarityRank: 5,
      badgeIcon: '🎂',
      date: `${year}-${userProfile.birthday}`,
      textureVariant: 'birthday',
      description: i18n.t('specialEvents.birthdayDesc'),
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
