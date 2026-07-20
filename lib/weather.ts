import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n';
import type { SpecialEvent } from '../types/specialEvents';

const WEATHER_CACHE_KEY = 'hueday_weather_cache_v1';
const FIRST_SNOW_KEY = 'hueday_first_snow_season';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  date: string;
  snowfallSum: number; // in cm
  tempMax: number;
  weatherCode: number;
}

/**
 * Fetches daily weather data from Open-Meteo API (free, no API key required).
 * Caches results in AsyncStorage so max 1 request is made per day.
 */
export async function getDailyWeatherData(
  dateStr: string,
  coords?: LocationCoords
): Promise<WeatherData | null> {
  if (!coords || !coords.latitude || !coords.longitude) {
    return null; // Silent fallback if location permission/coords missing
  }

  try {
    // Check local cache first
    const cachedRaw = await AsyncStorage.getItem(`${WEATHER_CACHE_KEY}_${dateStr}`);
    if (cachedRaw) {
      return JSON.parse(cachedRaw) as WeatherData;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&daily=snowfall_sum,temperature_2m_max,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.daily || !data.daily.time) return null;

    const dateIndex = data.daily.time.indexOf(dateStr);
    const targetIdx = dateIndex !== -1 ? dateIndex : 0;

    const weatherData: WeatherData = {
      date: dateStr,
      snowfallSum: data.daily.snowfall_sum?.[targetIdx] ?? 0,
      tempMax: data.daily.temperature_2m_max?.[targetIdx] ?? 20,
      weatherCode: data.daily.weather_code?.[targetIdx] ?? 0,
    };

    // Cache in AsyncStorage
    await AsyncStorage.setItem(`${WEATHER_CACHE_KEY}_${dateStr}`, JSON.stringify(weatherData));
    return weatherData;
  } catch {
    // Silent fallback on network error or offline mode
    return null;
  }
}

/**
 * Checks if today qualifies for "Yılın İlk Karı" (First Snow of the Season).
 * Season runs from September 1 to August 31 of the next year.
 */
export async function checkFirstSnowEvent(
  dateStr: string,
  coords?: LocationCoords
): Promise<SpecialEvent | null> {
  const weather = await getDailyWeatherData(dateStr, coords);
  if (!weather || weather.snowfallSum <= 0) {
    return null;
  }

  const dateObj = new Date(dateStr);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth(); // 0-indexed

  // Season identifier (e.g. "2025-2026")
  const seasonId = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

  try {
    const lastTriggeredSeason = await AsyncStorage.getItem(FIRST_SNOW_KEY);
    if (lastTriggeredSeason === seasonId) {
      // Already triggered for this season
      return null;
    }

    // Record this season as triggered
    await AsyncStorage.setItem(FIRST_SNOW_KEY, seasonId);

    return {
      id: `first-snow-${dateStr}`,
      title: i18n.t('weather.firstSnowTitle'),
      category: 'weather',
      rarityRank: 5, // Highest surprise rarity
      badgeIcon: '❄️',
      date: dateStr,
      textureVariant: 'first-snow',
      description: i18n.t('weather.firstSnowDesc'),
    };
  } catch {
    return null;
  }
}
