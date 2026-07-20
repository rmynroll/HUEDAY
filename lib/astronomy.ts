import * as Astronomy from 'astronomy-engine';
import i18n from './i18n';
import type { SpecialEvent } from '../types/specialEvents';

// Helper to convert an AstroTime or Date to yyyy-MM-dd in user's local timezone
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getFullMoonNames(): string[] {
  return i18n.t('astronomy.moonNames', { returnObjects: true }) as string[];
}

/**
 * Calculates equinoxes and solstices for a given year dynamically using astronomy-engine.
 */
export function getSeasonalEvents(year: number): SpecialEvent[] {
  const seasons = Astronomy.Seasons(year);

  const marEqDate = seasons.mar_equinox.date;
  const junSolDate = seasons.jun_solstice.date;
  const sepEqDate = seasons.sep_equinox.date;
  const decSolDate = seasons.dec_solstice.date;

  return [
    {
      id: `spring-equinox-${year}`,
      title: i18n.t('astronomy.springEquinoxTitle'),
      category: 'seasonal',
      rarityRank: 2,
      badgeIcon: '🌸',
      date: toLocalDateString(marEqDate),
      textureVariant: 'spring-equinox',
      description: i18n.t('astronomy.springEquinoxDesc'),
    },
    {
      id: `summer-solstice-${year}`,
      title: i18n.t('astronomy.summerSolsticeTitle'),
      category: 'seasonal',
      rarityRank: 2,
      badgeIcon: '☀️',
      date: toLocalDateString(junSolDate),
      textureVariant: 'summer-solstice',
      description: i18n.t('astronomy.summerSolsticeDesc'),
    },
    {
      id: `autumn-equinox-${year}`,
      title: i18n.t('astronomy.autumnEquinoxTitle'),
      category: 'seasonal',
      rarityRank: 2,
      badgeIcon: '🍁',
      date: toLocalDateString(sepEqDate),
      textureVariant: 'autumn-equinox',
      description: i18n.t('astronomy.autumnEquinoxDesc'),
    },
    {
      id: `winter-solstice-${year}`,
      title: i18n.t('astronomy.winterSolsticeTitle'),
      category: 'seasonal',
      rarityRank: 2,
      badgeIcon: '❄️',
      date: toLocalDateString(decSolDate),
      textureVariant: 'winter-solstice',
      description: i18n.t('astronomy.winterSolsticeDesc'),
    },
    {
      id: `new-year-${year}`,
      title: i18n.t('astronomy.newYearTitle'),
      category: 'seasonal',
      rarityRank: 2,
      badgeIcon: '🎆',
      date: `${year}-01-01`,
      textureVariant: 'milestone',
      description: i18n.t('astronomy.newYearDesc'),
    },
    {
      id: `year-end-${year}`,
      title: i18n.t('astronomy.yearEndTitle'),
      category: 'seasonal',
      rarityRank: 2,
      badgeIcon: '🥂',
      date: `${year}-12-31`,
      textureVariant: 'milestone',
      description: i18n.t('astronomy.yearEndDesc'),
    },
  ];
}

/**
 * Calculates Moon Phases (Full Moon, Supermoon, New Moon) for a given year using astronomy-engine.
 */
export function getMoonEvents(year: number): SpecialEvent[] {
  const events: SpecialEvent[] = [];
  let searchStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

  // Loop through full moons in the year
  for (let i = 0; i < 14; i++) {
    const fullMoonTime = Astronomy.SearchMoonPhase(180, searchStart, 35);
    if (!fullMoonTime || fullMoonTime.date > yearEnd) break;

    const fullMoonDate = fullMoonTime.date;
    const localDateStr = toLocalDateString(fullMoonDate);
    const monthIdx = fullMoonDate.getMonth();
    const moonName = getFullMoonNames()[monthIdx];

    // Supermoon detection: Check lunar distance in AU at time of full moon (< 0.00242 AU or ~362,000 km)
    const vector = Astronomy.GeoVector(Astronomy.Body.Moon, fullMoonTime, true);
    const distanceKm = vector.Length() * 149597870.7; // AU to KM
    const isSupermoon = distanceKm < 362000;

    if (isSupermoon) {
      events.push({
        id: `supermoon-${localDateStr}`,
        title: i18n.t('astronomy.superMoon', { moonName }),
        category: 'astronomical',
        rarityRank: 3,
        badgeIcon: '🌕',
        date: localDateStr,
        textureVariant: 'supermoon',
        description: i18n.t('astronomy.fullMoonDesc'),
      });
    } else {
      events.push({
        id: `full-moon-${localDateStr}`,
        title: `${moonName} 🌕`,
        category: 'astronomical',
        rarityRank: 3,
        badgeIcon: '🌕',
        date: localDateStr,
        textureVariant: 'full-moon',
        description: i18n.t('astronomy.fullMoonDesc'),
      });
    }

    // Advance search start date past this full moon
    searchStart = new Date(fullMoonDate.getTime() + 20 * 86400 * 1000);
  }

  // Loop through new moons in the year
  let newMoonSearchStart = new Date(Date.UTC(year, 0, 1));
  for (let i = 0; i < 14; i++) {
    const newMoonTime = Astronomy.SearchMoonPhase(0, newMoonSearchStart, 35);
    if (!newMoonTime || newMoonTime.date > yearEnd) break;

    const newMoonDateStr = toLocalDateString(newMoonTime.date);
    events.push({
      id: `new-moon-${newMoonDateStr}`,
      title: i18n.t('astronomy.newMoonTitle'),
      category: 'astronomical',
      rarityRank: 3,
      badgeIcon: '🌑',
      date: newMoonDateStr,
      textureVariant: 'new-moon',
      description: i18n.t('astronomy.newMoonDesc'),
    });

    newMoonSearchStart = new Date(newMoonTime.date.getTime() + 20 * 86400 * 1000);
  }

  return events;
}

/**
 * Calculates Meteor Shower Peak Nights for a given year.
 */
export function getMeteorEvents(year: number): SpecialEvent[] {
  return [
    {
      id: `quadrantid-${year}`,
      title: i18n.t('astronomy.meteorShower.quadrantids'),
      category: 'astronomical',
      rarityRank: 3,
      badgeIcon: '☄️',
      date: `${year}-01-04`,
      textureVariant: 'meteor-shower',
      description: i18n.t('astronomy.meteorShower.desc'),
    },
    {
      id: `perseid-${year}`,
      title: i18n.t('astronomy.meteorShower.perseids'),
      category: 'astronomical',
      rarityRank: 3,
      badgeIcon: '☄️',
      date: `${year}-08-12`,
      textureVariant: 'meteor-shower',
      description: i18n.t('astronomy.meteorShower.desc'),
    },
    {
      id: `geminid-${year}`,
      title: i18n.t('astronomy.meteorShower.geminids'),
      category: 'astronomical',
      rarityRank: 3,
      badgeIcon: '☄️',
      date: `${year}-12-14`,
      textureVariant: 'meteor-shower',
      description: i18n.t('astronomy.meteorShower.desc'),
    },
  ];
}
