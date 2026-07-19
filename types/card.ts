export interface MoodTags {
  energy?: number; // 0-1, düşük enerji -> yüksek enerji
  sleep?: number; // 0-1, yorgun -> dinlenmiş
  sociality?: number; // 0-1, içe dönük -> dışa dönük
}

export interface SongInfo {
  title: string;
  artist: string;
}

export interface MoodEntry {
  date: string; // yyyy-MM-dd
  mood: number; // 0-1
  tags: MoodTags;
  note?: string;
  styleId?: CardStyleId;
  song?: SongInfo;
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
}

