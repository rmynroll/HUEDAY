export interface DayMemory {
  id: string;
  date: string; // yyyy-MM-dd
  text: string;
  order: number;
  createdAt: string; // ISO
}

export interface MemoryPhoto {
  id: string;
  date: string; // yyyy-MM-dd
  memoryId?: string;
  originalUri: string;
  processedUri: string;
  filterPreset: 'duotone-palette' | 'film-grain' | 'none';
  caption?: string; // Polaroid alt not
  createdAt: string; // ISO
}

export interface AudioMemo {
  id: string;
  date: string; // yyyy-MM-dd
  audioUri: string;
  durationSeconds: number; // Max 300s (5 minutes)
  waveformBars: number[]; // e.g. [0.4, 0.7, 0.3, 0.9, 0.5, ...]
  createdAt: string; // ISO
}

export interface AutoStamp {
  temp?: number; // °C
  condition?: string; // e.g. "Güneşli", "Kar Yağışlı", "Bulutlu"
  city?: string;
  date: string;
}
