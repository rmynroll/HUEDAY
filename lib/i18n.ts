import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Locale } from 'date-fns';
import { de, enUS, es, fr, ja, ko, pt, tr as trLocale } from 'date-fns/locale';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de_ from '../src/locales/de/translation.json';
import en from '../src/locales/en/translation.json';
import es_ from '../src/locales/es/translation.json';
import fr_ from '../src/locales/fr/translation.json';
import ja_ from '../src/locales/ja/translation.json';
import ko_ from '../src/locales/ko/translation.json';
import pt_ from '../src/locales/pt/translation.json';
import tr from '../src/locales/tr/translation.json';

const LANGUAGE_STORAGE_KEY = 'hueday-language';

export const SUPPORTED_LANGUAGES = ['tr', 'en', 'es', 'pt', 'ja', 'ko', 'de', 'fr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Native autonym for each supported language, shown in the language picker. */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
  es: 'Español',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  fr: 'Français',
};

function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value ?? '');
}

async function detectInitialLanguage(): Promise<SupportedLanguage> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(stored)) return stored;
  } catch {
    // AsyncStorage unavailable — fall through to device locale
  }

  const deviceLanguageCode = Localization.getLocales()[0]?.languageCode;
  if (isSupportedLanguage(deviceLanguageCode)) return deviceLanguageCode;

  return 'en';
}

export async function initI18n(): Promise<void> {
  const lng = await detectInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
      es: { translation: es_ },
      pt: { translation: pt_ },
      ja: { translation: ja_ },
      ko: { translation: ko_ },
      de: { translation: de_ },
      fr: { translation: fr_ },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export async function setAppLanguage(lng: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lng);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    // Best-effort persistence
  }
}

const DATE_FNS_LOCALES: Record<SupportedLanguage, Locale> = {
  tr: trLocale,
  en: enUS,
  es,
  pt,
  ja,
  ko,
  de,
  fr,
};

/** date-fns locale matching the active i18n language (for date formatting). */
export function getDateFnsLocale(language: string) {
  return DATE_FNS_LOCALES[language as SupportedLanguage] ?? enUS;
}

export default i18n;
