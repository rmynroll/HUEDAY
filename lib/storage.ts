import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getArtistPaletteById } from '../constants/artistPalettes';
import { getCrystalById } from '../constants/crystals';
import enTranslation from '../src/locales/en/translation.json';
import trTranslation from '../src/locales/tr/translation.json';
import type { AgendaTask } from '../types/agenda';
import type { ColorMoodEmotion, DayCard, MoodEntry, CardStyleId, ChatMessage } from '../types/card';
import type { TimeCapsule } from '../types/capsule';
import type { DayMemory, AudioMemo, MemoryPhoto, AutoStamp } from '../types/memories';
import type { DrawingPath } from '../types/journal';
import type { UserProfile } from '../types/specialEvents';
import { calculateCapsuleOpenDate, determineSealMotif } from './capsule';
import { encryptCapsuleNote } from './capsuleCipher';
import { COLOR_MOOD_BASE, shadeForIntensity } from './colorMood';
import { generateCard } from './hueMotor';
import i18n from './i18n';
import { getTodaysSpecialEvents } from './specialEvents';
import { carryTaskToTomorrowLogic, scheduleTaskReminder } from './taskRepository';
import { blendStoneColorIntoPalette } from './threeRituals';
import type { LocationCoords } from './weather';

/**
 * Store creation runs at module-eval time — before initI18n() has resolved,
 * so i18next.t() would return undefined here. Read the device locale directly
 * from the raw translation JSON instead for this one-time seed value.
 */
const seedStrings = Localization.getLocales()[0]?.languageCode === 'tr' ? trTranslation : enTranslation;

export interface User {
  name: string;
  email: string;
  birthday: string;
}

export interface RegisteredUserData {
  name: string;
  email: string;
  passwordHash: string;
  birthday: string;
}

interface HuedayState {
  /** yyyy-MM-dd -> o günün kartı */
  cards: Record<string, DayCard>;
  /** yyyy-MM-dd -> o günün görev listesi */
  tasks: Record<string, AgendaTask[]>;
  /** yyyy-MM-dd -> o günün serbest ajanda notu */
  agendaNotes: Record<string, string>;
  /** capsuleId -> kapsül */
  capsules: Record<string, TimeCapsule>;

  /** yyyy-MM-dd -> günün anıları (metin) */
  memories: Record<string, DayMemory[]>;
  /** yyyy-MM-dd -> günün fotoğrafları */
  photos: Record<string, MemoryPhoto[]>;
  /** yyyy-MM-dd -> günün sesli anısı (tek kayıt, max 30s) */
  audioMemos: Record<string, AudioMemo>;
  /** yyyy-MM-dd -> günün kelimesi (max 20 karakter) */
  wordOfDay: Record<string, string>;
  /** yyyy-MM-dd -> otomatik gün damgası */
  stamps: Record<string, AutoStamp>;
  handwritingJournals: Record<string, DrawingPath[]>;

  userProfile: UserProfile;
  hasHydrated: boolean;
  isPremium: boolean;
  lastSelectedStyle: CardStyleId;
  chats: Record<string, ChatMessage[]>;
  streaks: Record<string, number>;

  // Authentication State
  user: User | null;
  registeredUsers: Record<string, RegisteredUserData>;

  // Spotify Auth State
  spotifyAccessToken: string | null;
  spotifyRefreshToken: string | null;
  spotifyTokenExpiresAt: string | null;

  // Authentication Actions
  signUp: (name: string, email: string, password: string, birthday: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Mood Actions
  submitMood: (entry: MoodEntry, location?: LocationCoords) => Promise<DayCard>;
  getCard: (date: string) => DayCard | undefined;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setHasHydrated: (value: boolean) => void;
  togglePremium: () => void;
  setLastSelectedStyle: (styleId: CardStyleId) => void;
  clearAllCards: () => void;
  sendMessage: (friend: string, text: string, sender?: 'user' | 'friend') => void;
  incrementStreak: (friend: string) => void;

  // Spotify Actions
  setSpotifyAuth: (accessToken: string | null, refreshToken: string | null, expiresAt: string | null) => void;
  clearSpotifyAuth: () => void;

  // Morning Ritual Actions
  setDayStoneAndManifest: (
    date: string,
    stoneId: string,
    manifestText?: string,
    sealManifest?: boolean
  ) => Promise<DayCard | null>;

  // Agenda Actions
  addTask: (date: string, title: string, reminderTime?: string) => Promise<AgendaTask>;
  toggleTask: (date: string, taskId: string) => void;
  deleteTask: (date: string, taskId: string) => void;
  carryTaskToTomorrow: (date: string, taskId: string) => Promise<AgendaTask | null>;
  setAgendaNote: (date: string, text: string) => void;

  // Memory Actions
  addDayMemory: (date: string, text: string) => DayMemory;
  deleteDayMemory: (date: string, memoryId: string) => void;

  // Photo Actions
  addPhoto: (date: string, uri: string) => MemoryPhoto;
  deletePhoto: (date: string, photoId: string) => void;
  updatePhotoCaption: (date: string, photoId: string, caption: string) => void;

  // Audio Memo Actions
  saveAudioMemo: (date: string, audioUri: string, durationSeconds: number, waveformBars: number[]) => AudioMemo;
  deleteAudioMemo: (date: string) => void;

  // Color Mood (Hızlı Giriş) Actions
  setColorMoodEntry: (date: string, emotion: ColorMoodEmotion, intensity: 1 | 2 | 3) => Promise<DayCard>;
  removeColorMoodEntry: (date: string, emotion: ColorMoodEmotion) => void;

  // Sanatçı Stüdyosu Actions
  applyArtistPalette: (date: string, paletteId: string) => Promise<DayCard | null>;

  // Word of Day
  setWordOfDay: (date: string, word: string) => boolean;

  // Auto Stamp
  setStampData: (date: string, stamp: Omit<AutoStamp, 'date'>) => void;

  // Time Capsule Actions
  sealTimeCapsule: (
    cardDate: string,
    rawNote: string,
    userInitial?: string,
    parentCapsuleId?: string
  ) => Promise<TimeCapsule>;
  openTimeCapsule: (capsuleId: string) => void;

  // Handwriting Journal Actions
  saveHandwritingJournal: (date: string, paths: DrawingPath[]) => void;
}

export const useHuedayStore = create<HuedayState>()(
  persist(
    (set, get) => ({
      cards: {},
      tasks: {},
      agendaNotes: {},
      capsules: {},
      memories: {},
      photos: {},
      audioMemos: {},
      wordOfDay: {},
      stamps: {},
      handwritingJournals: {},
      userProfile: {
        birthday: '07-20',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      hasHydrated: false,
      isPremium: false,
      lastSelectedStyle: 'minimal-gradient',
      chats: {
        'Deniz': [
          { id: 'd1', sender: 'friend', text: seedStrings.storageSeed.chats.deniz1, timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
          { id: 'd2', sender: 'user', text: seedStrings.storageSeed.chats.deniz2, timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
          { id: 'd3', sender: 'friend', text: seedStrings.storageSeed.chats.deniz3, timestamp: new Date(Date.now() - 3600000).toISOString() },
        ],
        'Elif': [
          { id: 'e1', sender: 'friend', text: seedStrings.storageSeed.chats.elif1, timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
        ],
        'Merve': [
          { id: 'm1', sender: 'friend', text: seedStrings.storageSeed.chats.merve1, timestamp: new Date(Date.now() - 3600000 * 12).toISOString() },
        ],
      },
      streaks: {
        'Deniz': 5,
        'Elif': 2,
        'Merve': 0,
      },
      user: null,
      registeredUsers: {},
      spotifyAccessToken: null,
      spotifyRefreshToken: null,
      spotifyTokenExpiresAt: null,
      submitMood: async (entry, location) => {
        const isUserPremium = get().isPremium;
        const profile = get().userProfile;
        const currentCards = get().cards;
        const existingCard = currentCards[entry.date];
        // Hızlı giriş sekmesinde ayarlanan colorMoods, detaylı form entry'de taşımadığı için burada korunur.
        const mergedEntry = { ...entry, colorMoods: entry.colorMoods ?? existingCard?.colorMoods };
        const specialEvents = await getTodaysSpecialEvents(entry.date, location, profile, currentCards);
        const card = generateCard({ ...mergedEntry, freeStylesOnly: !isUserPremium, specialEvents });
        set((state) => ({ cards: { ...state.cards, [entry.date]: card } }));
        return card;
      },
      getCard: (date) => get().cards[date],
      updateUserProfile: (profile) =>
        set((state) => ({ userProfile: { ...state.userProfile, ...profile } })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      togglePremium: () => set((state) => ({ isPremium: !state.isPremium })),
      setLastSelectedStyle: (styleId) => set({ lastSelectedStyle: styleId }),
      clearAllCards: () => set({ cards: {}, tasks: {}, agendaNotes: {}, capsules: {}, memories: {}, photos: {}, audioMemos: {}, wordOfDay: {}, stamps: {} }),
      sendMessage: (friend, text, sender = 'user') => {
        const newMessage: ChatMessage = {
          id: String(Math.random()),
          sender,
          text,
          timestamp: new Date().toISOString(),
        };
        set((state) => {
          const friendChats = state.chats[friend] || [];
          return {
            chats: {
              ...state.chats,
              [friend]: [...friendChats, newMessage],
            },
          };
        });
      },
      incrementStreak: (friend) => {
        set((state) => {
          const current = state.streaks[friend] || 0;
          return {
            streaks: {
              ...state.streaks,
              [friend]: current + 1,
            },
          };
        });
      },
      setSpotifyAuth: (accessToken, refreshToken, expiresAt) =>
        set({
          spotifyAccessToken: accessToken,
          spotifyRefreshToken: refreshToken,
          spotifyTokenExpiresAt: expiresAt,
        }),
      clearSpotifyAuth: () =>
        set({
          spotifyAccessToken: null,
          spotifyRefreshToken: null,
          spotifyTokenExpiresAt: null,
        }),

      signUp: async (name, email, password, birthday) => {
        const users = get().registeredUsers;
        if (users[email]) return false;
        const newUser = {
          name,
          email,
          passwordHash: password,
          birthday,
        };
        set((state) => ({
          registeredUsers: { ...state.registeredUsers, [email]: newUser },
          user: { name, email, birthday },
          userProfile: { ...state.userProfile, birthday },
        }));
        return true;
      },

      login: async (email, password) => {
        const users = get().registeredUsers;
        const matched = users[email];
        if (matched && matched.passwordHash === password) {
          set((state) => ({
            user: { name: matched.name, email: matched.email, birthday: matched.birthday },
            userProfile: { ...state.userProfile, birthday: matched.birthday },
          }));
          return true;
        }
        return false;
      },

      logout: () => {
        set({
          user: null,
          spotifyAccessToken: null,
          spotifyRefreshToken: null,
          spotifyTokenExpiresAt: null,
        });
      },

      setDayStoneAndManifest: async (date, stoneId, manifestText, sealManifest) => {
        const currentCard = get().cards[date];
        let cardToUpdate: DayCard;

        if (!currentCard) {
          const newEntry: MoodEntry = {
            date,
            mood: 0.7,
            tags: { energy: 0.5, sleep: 0.5, sociality: 0.5 },
            stoneId,
            manifestText,
            isManifestSealed: sealManifest,
          };
          cardToUpdate = await get().submitMood(newEntry);
        } else {
          const crystal = getCrystalById(stoneId);
          const newPalette = crystal
            ? blendStoneColorIntoPalette(currentCard.palette, crystal.color, 0.18)
            : currentCard.palette;

          cardToUpdate = {
            ...currentCard,
            stoneId,
            manifestText: manifestText ?? currentCard.manifestText,
            isManifestSealed: sealManifest ?? currentCard.isManifestSealed,
            palette: newPalette,
          };

          set((state) => ({
            cards: {
              ...state.cards,
              [date]: cardToUpdate,
            },
          }));
        }

        if (sealManifest && manifestText) {
          await get().sealTimeCapsule(date, i18n.t('storageSeed.capsuleNotePrefix', { text: manifestText }), 'K');
        }

        return cardToUpdate;
      },

      // Agenda Actions
      addTask: async (date, title, reminderTime) => {
        const dayTasks = get().tasks[date] || [];
        const newTask: AgendaTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          date,
          title: title.trim(),
          completed: false,
          createdAt: new Date().toISOString(),
          reminderTime: reminderTime?.trim() || undefined,
          order: dayTasks.length,
        };

        set((state) => ({
          tasks: {
            ...state.tasks,
            [date]: [...(state.tasks[date] || []), newTask],
          },
        }));

        if (newTask.reminderTime) {
          scheduleTaskReminder(newTask).catch(() => {});
        }

        return newTask;
      },

      toggleTask: (date, taskId) => {
        set((state) => {
          const dayTasks = state.tasks[date] || [];
          const updated = dayTasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
          return {
            tasks: {
              ...state.tasks,
              [date]: updated,
            },
          };
        });
      },

      deleteTask: (date, taskId) => {
        set((state) => {
          const dayTasks = state.tasks[date] || [];
          const updated = dayTasks.filter((t) => t.id !== taskId);
          return {
            tasks: {
              ...state.tasks,
              [date]: updated,
            },
          };
        });
      },

      carryTaskToTomorrow: async (date, taskId) => {
        const dayTasks = get().tasks[date] || [];
        const targetTask = dayTasks.find((t) => t.id === taskId);
        if (!targetTask) return null;

        const carried = carryTaskToTomorrowLogic(targetTask);

        set((state) => {
          const currentDayTasks = state.tasks[date] || [];
          const currentDayFiltered = currentDayTasks.filter((t) => t.id !== taskId);
          const nextDayTasks = state.tasks[carried.date] || [];

          return {
            tasks: {
              ...state.tasks,
              [date]: currentDayFiltered,
              [carried.date]: [...nextDayTasks, carried],
            },
          };
        });

        if (carried.reminderTime) {
          scheduleTaskReminder(carried).catch(() => {});
        }

        return carried;
      },

      setAgendaNote: (date, text) => {
        set((state) => ({
          agendaNotes: {
            ...state.agendaNotes,
            [date]: text,
          },
        }));
      },

      // Memory Actions
      addDayMemory: (date, text) => {
        const newMemory: DayMemory = {
          id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          date,
          text: text.trim(),
          order: (get().memories[date] || []).length,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          memories: {
            ...state.memories,
            [date]: [...(state.memories[date] || []), newMemory],
          },
        }));
        return newMemory;
      },

      deleteDayMemory: (date, memoryId) => {
        set((state) => ({
          memories: {
            ...state.memories,
            [date]: (state.memories[date] || []).filter((m) => m.id !== memoryId),
          },
        }));
      },

      // Photo Actions
      addPhoto: (date, uri) => {
        const newPhoto: MemoryPhoto = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          date,
          originalUri: uri,
          processedUri: uri,
          filterPreset: 'none',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          photos: {
            ...state.photos,
            [date]: [...(state.photos[date] || []), newPhoto],
          },
        }));
        return newPhoto;
      },

      deletePhoto: (date, photoId) => {
        set((state) => ({
          photos: {
            ...state.photos,
            [date]: (state.photos[date] || []).filter((p) => p.id !== photoId),
          },
        }));
      },

      // Audio Memo Actions
      saveAudioMemo: (date, audioUri, durationSeconds, waveformBars) => {
        const memo: AudioMemo = {
          id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          date,
          audioUri,
          durationSeconds: Math.min(durationSeconds, 300),
          waveformBars,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          audioMemos: {
            ...state.audioMemos,
            [date]: memo,
          },
        }));
        return memo;
      },

      deleteAudioMemo: (date) => {
        set((state) => {
          const { [date]: _, ...rest } = state.audioMemos;
          return { audioMemos: rest };
        });
      },

      // Color Mood (Hızlı Giriş) Actions
      setColorMoodEntry: async (date, emotion, intensity) => {
        const currentCard = get().cards[date];
        const newEntry = {
          emotion,
          intensity,
          color: shadeForIntensity(COLOR_MOOD_BASE[emotion], intensity),
          createdAt: new Date().toISOString(),
        };

        if (!currentCard) {
          const newMoodEntry: MoodEntry = {
            date,
            mood: 0.5,
            tags: {},
            colorMoods: [newEntry],
          };
          return get().submitMood(newMoodEntry);
        }

        const existingMoods = currentCard.colorMoods || [];
        const updatedMoods = [...existingMoods.filter((m) => m.emotion !== emotion), newEntry].slice(-2);
        const updatedCard: DayCard = { ...currentCard, colorMoods: updatedMoods };
        set((state) => ({ cards: { ...state.cards, [date]: updatedCard } }));
        return updatedCard;
      },

      removeColorMoodEntry: (date, emotion) => {
        set((state) => {
          const card = state.cards[date];
          if (!card) return state;
          return {
            cards: {
              ...state.cards,
              [date]: { ...card, colorMoods: (card.colorMoods || []).filter((m) => m.emotion !== emotion) },
            },
          };
        });
      },

      // Sanatçı Stüdyosu Actions
      applyArtistPalette: async (date, paletteId) => {
        const palette = getArtistPaletteById(paletteId);
        if (!palette) return null;

        const currentCard = get().cards[date];
        if (!currentCard) {
          const newMoodEntry: MoodEntry = {
            date,
            mood: 0.5,
            tags: {},
          };
          const created = await get().submitMood(newMoodEntry);
          const withPalette: DayCard = { ...created, palette: palette.colors };
          set((state) => ({ cards: { ...state.cards, [date]: withPalette } }));
          return withPalette;
        }

        const updatedCard: DayCard = { ...currentCard, palette: palette.colors };
        set((state) => ({ cards: { ...state.cards, [date]: updatedCard } }));
        return updatedCard;
      },

      // Photo Caption
      updatePhotoCaption: (date, photoId, caption) => {
        set((state) => {
          const dayPhotos = state.photos[date] || [];
          const updated = dayPhotos.map((p) =>
            p.id === photoId ? { ...p, caption: caption.trim() } : p
          );
          return {
            photos: {
              ...state.photos,
              [date]: updated,
            },
          };
        });
      },

      // Word of Day (max 20 char)
      setWordOfDay: (date, word) => {
        const trimmed = word.trim().slice(0, 20);
        if (trimmed.length === 0) return false;
        set((state) => ({
          wordOfDay: {
            ...state.wordOfDay,
            [date]: trimmed,
          },
        }));
        return true;
      },

      // Auto Stamp
      setStampData: (date, stamp) => {
        set((state) => ({
          stamps: {
            ...state.stamps,
            [date]: { ...stamp, date },
          },
        }));
      },

      // Handwriting Journal Actions
      saveHandwritingJournal: (date, paths) => {
        set((state) => ({
          handwritingJournals: {
            ...state.handwritingJournals,
            [date]: paths,
          },
        }));
      },

      // Time Capsule Actions
      sealTimeCapsule: async (cardDate, rawNote, userInitial = 'K', parentCapsuleId) => {
        const sealedDate = todayKey();
        const openDate = calculateCapsuleOpenDate(sealedDate);
        const card = get().cards[cardDate];

        const sealColor = card?.palette[0] || '#E55B70';
        const sealMotif = determineSealMotif(
          card?.primaryEvent?.category,
          card?.primaryEvent?.textureVariant
        );

        const newCapsule: TimeCapsule = {
          id: `capsule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          cardDate,
          sealedDate,
          openDate,
          encryptedNote: encryptCapsuleNote(rawNote),
          sealColor,
          sealMotif,
          userInitial,
          parentCapsuleId,
          isOpened: false,
        };

        set((state) => ({
          capsules: {
            ...state.capsules,
            [newCapsule.id]: newCapsule,
          },
        }));

        return newCapsule;
      },

      openTimeCapsule: (capsuleId) => {
        set((state) => {
          const target = state.capsules[capsuleId];
          if (!target) return state;

          return {
            capsules: {
              ...state.capsules,
              [capsuleId]: {
                ...target,
                isOpened: true,
                openedAt: new Date().toISOString(),
              },
            },
          };
        });
      },
    }),
    {
      name: 'hueday-storage',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        cards: persistedState?.cards || {},
        tasks: persistedState?.tasks || {},
        agendaNotes: persistedState?.agendaNotes || {},
        capsules: persistedState?.capsules || {},
        memories: persistedState?.memories || {},
        photos: persistedState?.photos || {},
        audioMemos: persistedState?.audioMemos || {},
        wordOfDay: persistedState?.wordOfDay || {},
        stamps: persistedState?.stamps || {},
        userProfile: { ...currentState.userProfile, ...(persistedState?.userProfile || {}) },
      }),
      partialize: (state) => ({
        cards: state.cards,
        tasks: state.tasks,
        agendaNotes: state.agendaNotes,
        capsules: state.capsules,
        memories: state.memories,
        photos: state.photos,
        audioMemos: state.audioMemos,
        wordOfDay: state.wordOfDay,
        stamps: state.stamps,
        userProfile: state.userProfile,
        isPremium: state.isPremium,
        lastSelectedStyle: state.lastSelectedStyle,
        chats: state.chats,
        streaks: state.streaks,
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
