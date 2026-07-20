export type SealMotif = 'standard' | 'moon' | 'star' | 'snow' | 'sun' | 'fire';

export interface TimeCapsule {
  id: string;
  cardDate: string; // yyyy-MM-dd (Mood card date)
  sealedDate: string; // yyyy-MM-dd (Date capsule was sealed)
  openDate: string; // yyyy-MM-dd (Date capsule unlocks, exactly 1 year later)
  encryptedNote: string;
  sealColor: string; // Hex color from card palette
  sealMotif: SealMotif;
  userInitial: string;
  parentCapsuleId?: string; // If this capsule is a response to last year's capsule
  isOpened: boolean;
  openedAt?: string; // ISO timestamp when unsealed
}
