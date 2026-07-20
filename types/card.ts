import type { SpecialEvent, SpecialCategory } from './specialEvents';

export interface MoodTags {
  energy?: number; // 0-1, düşük enerji -> yüksek enerji
  sleep?: number; // 0-1, yorgun -> dinlenmiş
  sociality?: number; // 0-1, içe dönük -> dışa dönük
}

export interface SongInfo {
  title: string;
  artist: string;
}

export type ColorMoodEmotion = 'joy' | 'sadness' | 'anger' | 'anxiety' | 'calm' | 'excitement';

export interface ColorMoodEntry {
  emotion: ColorMoodEmotion;
  intensity: 1 | 2 | 3; // 1 hafif, 2 orta, 3 yoğun
  color: string; // yoğunluğa göre üretilmiş hex ton
  createdAt: string; // ISO timestamp
}

export interface MoodEntry {
  date: string; // yyyy-MM-dd
  mood: number; // 0-1
  tags: MoodTags;
  note?: string;
  styleId?: CardStyleId;
  song?: SongInfo;
  stoneId?: string;
  manifestText?: string;
  isManifestSealed?: boolean;
  wordOfDay?: string;
  stampData?: { temp?: number; condition?: string; city?: string };
  /** Hızlı renk-duygu girişleri (Hızlı giriş sekmesi); aynı anda en fazla 2 farklı duygu tutulur. */
  colorMoods?: ColorMoodEntry[];
}

export type CardStyleId =
  | 'minimal-gradient'
  | 'paper-texture'
  | 'y2k-chrome'
  | 'cottagecore-watercolor'
  | 'night-neon';

export interface DayCard extends MoodEntry {
  palette: string[]; // hex renkler, 4-5 adet
  styleId: CardStyleId;
  phrase: string;
  seed: number;
  createdAt: string; // ISO timestamp
  rarity?: SpecialCategory;
  primaryEvent?: SpecialEvent;
  badges?: SpecialEvent[];
  stampText?: string; // ör: "Temmuz Dolunayı · 2026"
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'friend';
  text: string;
  timestamp: string;
}
