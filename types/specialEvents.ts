export type SpecialCategory = 'standard' | 'seasonal' | 'astronomical' | 'personal' | 'weather';

export type RareTextureVariant =
  | 'spring-equinox'
  | 'summer-solstice'
  | 'autumn-equinox'
  | 'winter-solstice'
  | 'full-moon'
  | 'supermoon'
  | 'new-moon'
  | 'meteor-shower'
  | 'first-snow'
  | 'birthday'
  | 'milestone';

export interface SpecialEvent {
  id: string;
  title: string;
  category: SpecialCategory;
  rarityRank: number; // 1 (Standard) -> 5 (Highest)
  badgeIcon: string;
  date: string; // yyyy-MM-dd
  textureVariant?: RareTextureVariant;
  description?: string;
  isUnlocked?: boolean;
}

export interface UserProfile {
  birthday?: string; // MM-dd (ör: '07-20')
  createdAt?: string; // ISO timestamp
}
