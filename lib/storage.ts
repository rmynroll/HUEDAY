import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DayCard, MoodEntry, CardStyleId } from '../types/card';
import { generateCard } from './hueMotor';

interface HuedayState {
  /** yyyy-MM-dd -> o günün kartı */
  cards: Record<string, DayCard>;
  hasHydrated: boolean;
  isPremium: boolean;
  lastSelectedStyle: CardStyleId;
  submitMood: (entry: MoodEntry) => DayCard;
  getCard: (date: string) => DayCard | undefined;
  setHasHydrated: (value: boolean) => void;
  togglePremium: () => void;
  setLastSelectedStyle: (styleId: CardStyleId) => void;
  clearAllCards: () => void;
}

export const useHuedayStore = create<HuedayState>()(
  persist(
    (set, get) => ({
      cards: {},
      hasHydrated: false,
      isPremium: false,
      lastSelectedStyle: 'minimal-gradient',
      submitMood: (entry) => {
        // If user is premium, pass all styles; otherwise restrict to free styles (minimal-gradient and paper-texture)
        const isUserPremium = get().isPremium;
        const card = generateCard({ ...entry, freeStylesOnly: !isUserPremium });
        set((state) => ({ cards: { ...state.cards, [entry.date]: card } }));
        return card;
      },
      getCard: (date) => get().cards[date],
      setHasHydrated: (value) => set({ hasHydrated: value }),
      togglePremium: () => set((state) => ({ isPremium: !state.isPremium })),
      setLastSelectedStyle: (styleId) => set({ lastSelectedStyle: styleId }),
      clearAllCards: () => set({ cards: {} }),
    }),
    {
      name: 'hueday-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cards: state.cards,
        isPremium: state.isPremium,
        lastSelectedStyle: state.lastSelectedStyle,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
