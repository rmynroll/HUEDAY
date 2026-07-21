import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { format, parseISO } from 'date-fns';

import AudioMemoPlayer from '@/components/AudioMemoPlayer';
import AutoDayStamp from '@/components/AutoDayStamp';
import CrystalSelectorDrawer from '@/components/CrystalSelectorDrawer';
import DayCard from '@/components/DayCard';
import PolaroidFilmstrip from '@/components/PolaroidFilmstrip';
import SealingRitualModal from '@/components/SealingRitualModal';
import MoodMusic from '@/components/MoodMusic';
import { Text, View } from '@/components/Themed';
import { getCrystalById } from '@/constants/crystals';
import { getDateFnsLocale } from '@/lib/i18n';
import { useHuedayStore, todayKey } from '@/lib/storage';

type WallpaperTone = 'original' | 'golden' | 'midnight' | 'pastel' | 'vibrant';

const TONE_PRESETS: { id: WallpaperTone; i18nKey: string; colors: string[] }[] = [
  { id: 'original', i18nKey: 'original', colors: ['#5DC552', '#95D4A2', '#6EA931'] },
  { id: 'golden', i18nKey: 'golden', colors: ['#F5A623', '#F8E71C', '#E55B70'] },
  { id: 'midnight', i18nKey: 'midnight', colors: ['#1F1C2C', '#928DAB', '#4A00E0'] },
  { id: 'pastel', i18nKey: 'pastel', colors: ['#FFD1DC', '#E2F0CB', '#B5EAD7'] },
  { id: 'vibrant', i18nKey: 'vibrant', colors: ['#FF007F', '#7F00FF', '#00F0FF'] },
];

import type { AgendaTask } from '@/types/agenda';

const EMPTY_TASKS: AgendaTask[] = [];

export default function CardScreen() {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const { date } = useLocalSearchParams<{ date: string }>();
  const dateKey = date || todayKey();

  const card = useHuedayStore((s) => s.cards?.[dateKey]);
  const rawTasks = useHuedayStore((s) => s.tasks?.[dateKey]);
  const tasks = rawTasks || EMPTY_TASKS;
  const agendaNote = useHuedayStore((s) => s.agendaNotes?.[dateKey]) || '';

  // Memories & Audio & Word & Stamps
  const memories = useHuedayStore((s) => s.memories?.[dateKey]) || [];
  const photos = useHuedayStore((s) => s.photos?.[dateKey]) || [];
  const audioMemo = useHuedayStore((s) => s.audioMemos?.[dateKey]);
  const wordOfDay = useHuedayStore((s) => s.wordOfDay?.[dateKey]) || '';
  const stamp = useHuedayStore((s) => s.stamps?.[dateKey]);

  const addDayMemory = useHuedayStore((s) => s.addDayMemory);
  const setWordOfDay = useHuedayStore((s) => s.setWordOfDay);
  const updatePhotoCaption = useHuedayStore((s) => s.updatePhotoCaption);
  const addPhoto = useHuedayStore((s) => s.addPhoto);

  const isPremium = useHuedayStore((s) => s.isPremium);
  const togglePremium = useHuedayStore((s) => s.togglePremium);

  const addTask = useHuedayStore((s) => s.addTask);
  const toggleTask = useHuedayStore((s) => s.toggleTask);
  const deleteTask = useHuedayStore((s) => s.deleteTask);
  const carryTaskToTomorrow = useHuedayStore((s) => s.carryTaskToTomorrow);
  const setAgendaNote = useHuedayStore((s) => s.setAgendaNote);

  const viewShotRef = useRef<React.ElementRef<typeof ViewShot>>(null);
  const wallpaperShotRef = useRef<React.ElementRef<typeof ViewShot>>(null);

  const [sharing, setSharing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showSameVibeModal, setShowSameVibeModal] = useState(false);
  const [showSealingModal, setShowSealingModal] = useState(false);
  const [showCrystalDrawer, setShowCrystalDrawer] = useState(false);
  const [generatingWallpaper, setGeneratingWallpaper] = useState(false);

  const [wallpaperQuote, setWallpaperQuote] = useState<string>('');
  const [wallpaperTone, setWallpaperTone] = useState<WallpaperTone>('original');

  // Task & Note inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskReminder, setNewTaskReminder] = useState('');
  const [noteText, setNoteText] = useState(agendaNote);

  // Memory & Word inputs
  const [newMemoryText, setNewMemoryText] = useState('');
  const [wordInput, setWordInput] = useState(wordOfDay);

  const isFutureDate = dateKey > todayKey();
  const accentColor = card?.palette[0] || '#007AFF';
  const motivationalQuotes = t('card.motivationalQuotes', { returnObjects: true }) as string[];

  const handlePickPhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        addPhoto(dateKey, result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch {
      // User cancelled or permission denied — fail silently
    }
  }, [dateKey, addPhoto]);

  const activeWallpaperPalette = useMemo(() => {
    if (!card) return ['#1C1C1E', '#2C2C2E'];
    switch (wallpaperTone) {
      case 'golden':
        return ['#F5A623', '#E58A2B', '#D0021B', '#F8E71C'];
      case 'midnight':
        return ['#1F1C2C', '#4A00E0', '#8E2DE2', '#121215'];
      case 'pastel':
        return ['#FFD1DC', '#E2F0CB', '#B5EAD7', '#C7CEEA'];
      case 'vibrant':
        return ['#FF007F', '#7F00FF', '#00F0FF', '#FFD700'];
      default:
        return card.palette;
    }
  }, [card, wallpaperTone]);

  const hasSameVibe = useMemo(() => {
    if (!card) return false;
    return card.mood >= 0.4 && card.mood <= 0.8;
  }, [card]);

  const handleShare = async () => {
    if (!viewShotRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } else {
        if (Platform.OS === 'web') {
          const link = document.createElement('a');
          link.download = `hueday-card-${dateKey}.png`;
          link.href = uri;
          link.click();
        }
      }
    } catch {
      // User cancelled
    } finally {
      setSharing(false);
    }
  };

  const handleWallpaperPress = () => {
    if (!isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setShowUpgradeModal(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setShowWallpaperModal(true);
    }
  };

  const handleShareWallpaper = async () => {
    if (!wallpaperShotRef.current) return;
    setGeneratingWallpaper(true);
    try {
      const uri = await captureRef(wallpaperShotRef, { format: 'png', quality: 1 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } else {
        if (Platform.OS === 'web') {
          const link = document.createElement('a');
          link.download = `hueday-wallpaper-${dateKey}.png`;
          link.href = uri;
          link.click();
        }
      }
    } catch {
      // Failed or cancelled
    } finally {
      setGeneratingWallpaper(false);
    }
  };

  const handleUpgrade = () => {
    togglePremium();
    setShowUpgradeModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await addTask(dateKey, newTaskTitle, newTaskReminder);
    setNewTaskTitle('');
    setNewTaskReminder('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const wallpaperGradientId = `wall-grad-${dateKey}`;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Stack.Screen options={{ title: format(parseISO(dateKey), 'd MMMM yyyy', { locale }) }} />

      {/* Same Vibe Banner */}
      {hasSameVibe && (
        <Pressable
          style={styles.sameVibeBanner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setShowSameVibeModal(true);
          }}
        >
          <Text style={styles.sameVibeText}>{t('card.sameVibeBanner')}</Text>
        </Pressable>
      )}

      {/* Top Section: Day Card OR Inviting Empty State */}
      {card ? (
        <>
          <ViewShot ref={viewShotRef} style={styles.cardWrapper} options={{ format: 'png', quality: 1 }}>
            <DayCard card={card} />
          </ViewShot>

          <View style={styles.actionsContainer}>
            <Pressable style={styles.primaryButton} onPress={handleShare} disabled={sharing}>
              <Text style={styles.primaryButtonText}>{sharing ? t('common.sharing') : t('card.shareStory')}</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleWallpaperPress}>
              <Text style={styles.secondaryButtonText}>{t('card.wallpaperButton')}</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => setShowSealingModal(true)}>
              <Text style={styles.secondaryButtonText}>{t('card.capsuleButton')}</Text>
            </Pressable>
          </View>

          {/* Mood-Music Integration */}
          <MoodMusic card={card} />

          {/* RITUAL 1: SABAH (Taş & Niyet) */}
          {card?.stoneId ? (
            <View style={styles.morningRitualBox}>
              <View style={styles.morningHeaderRow}>
                <View style={styles.morningTitleRow}>
                  <Text style={styles.morningBadge}>{t('card.morningRitualBadge')}</Text>
                  <Text style={styles.morningStoneTitle}>
                    {getCrystalById(card.stoneId)?.icon} {t(`crystals.${card.stoneId}.name`)}
                  </Text>
                </View>
                <Pressable style={styles.editRitualBtn} onPress={() => setShowCrystalDrawer(true)}>
                  <Text style={styles.editRitualBtnText}>{t('card.editRitual')}</Text>
                </Pressable>
              </View>

              {card.manifestText && (
                <View style={styles.manifestQuoteBox}>
                  <Text style={styles.manifestQuoteText}>"{card.manifestText}"</Text>
                  {card.isManifestSealed && (
                    <Text style={styles.sealedTag}>{t('card.sealedUntilMonthEnd')}</Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <Pressable style={styles.addRitualBar} onPress={() => setShowCrystalDrawer(true)}>
              <Text style={styles.addRitualBarText}>{t('card.addRitualButton')}</Text>
            </Pressable>
          )}
        </>
      ) : (
        <View style={styles.invitingEmptyBox}>
          <Text style={styles.invitingEmptyIcon}>{isFutureDate ? '🌤️' : '🎨'}</Text>
          <Text style={styles.invitingEmptyTitle}>
            {isFutureDate ? t('card.emptyFutureTitle') : t('card.emptyPastTitle')}
          </Text>
          <Text style={styles.invitingEmptyDesc}>
            {isFutureDate
              ? t('card.emptyFutureDesc')
              : t('card.emptyPastDesc')}
          </Text>
          {!isFutureDate && (
            <Pressable style={styles.createMoodButton} onPress={() => router.push('/')}>
              <Text style={styles.createMoodButtonText}>{t('card.createTodayButton')}</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ---- GÜN İÇİ RİTÜELİ: Anı, Fotoğraf, Ses, Kelime, Damga ---- */}
      {card && (
        <View style={styles.dayRitualSection}>
          <Text style={styles.ritualSectionTitle}>{t('card.memoriesTitle')}</Text>

          {/* Audio Memo Player */}
          <AudioMemoPlayer date={dateKey} palette={card.palette} />

          {/* Polaroid Filmstrip — always show with add button */}
          <PolaroidFilmstrip
            photos={photos.map((p) => ({ id: p.id, uri: p.processedUri || p.originalUri, caption: p.caption }))}
            palette={card.palette}
            onAddPhoto={handlePickPhoto}
            onUpdateCaption={(photoId, caption) => updatePhotoCaption(dateKey, photoId, caption)}
          />

          {/* Text Memories */}
          {memories.length > 0 && (
            <View style={styles.memoriesListBox}>
              {memories.map((m) => (
                <View key={m.id} style={[styles.memoryItem, { borderLeftColor: card.palette[0] + '60' }]}>
                  <Text style={styles.memoryText}>{m.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add Memory Input */}
          <View style={styles.addMemoryRow}>
            <TextInput
              style={styles.memoryTextInput}
              placeholder={t('card.memoryPlaceholder')}
              placeholderTextColor="#636366"
              value={newMemoryText}
              onChangeText={setNewMemoryText}
              onSubmitEditing={() => {
                if (newMemoryText.trim()) {
                  addDayMemory(dateKey, newMemoryText);
                  setNewMemoryText('');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }
              }}
            />
            <Pressable
              style={[styles.addMemoryBtn, { backgroundColor: card.palette[0] + '20' }]}
              onPress={() => {
                if (newMemoryText.trim()) {
                  addDayMemory(dateKey, newMemoryText);
                  setNewMemoryText('');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }
              }}
            >
              <Text style={[styles.addMemoryBtnText, { color: card.palette[0] }]}>+</Text>
            </Pressable>
          </View>

          {/* Word of Day */}
          <View style={styles.wordOfDayRow}>
            <Text style={styles.wordOfDayLabel}>{t('card.wordOfDayLabel')}</Text>
            <TextInput
              style={[styles.wordOfDayInput, { borderColor: card.palette[0] + '30' }]}
              placeholder={t('card.wordOfDayPlaceholder')}
              placeholderTextColor="#636366"
              value={wordInput}
              maxLength={20}
              onChangeText={(word) => {
                setWordInput(word);
                setWordOfDay(dateKey, word);
              }}
            />
          </View>

          {/* Auto Stamp */}
          <AutoDayStamp stamp={stamp} palette={card.palette} />
        </View>
      )}

      {/* ---- Agenda Section (Tasks & Notes) ---- */}
      <View style={styles.agendaSection}>
        <View style={styles.agendaHeaderRow}>
          <Text style={styles.agendaSectionTitle}>{t('card.agendaTitle')}</Text>
          {tasks.length > 0 && (
            <Text style={styles.agendaStatsText}>
              {t('card.agendaStats', { completed: tasks.filter((task) => task.completed).length, total: tasks.length })}
            </Text>
          )}
        </View>

        {/* Task Input Box */}
        <View style={styles.taskInputRow}>
          <TextInput
            style={styles.taskTextInput}
            placeholder={t('card.taskPlaceholder')}
            placeholderTextColor="#8A8A8E"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleAddTask}
          />
          <TextInput
            style={styles.taskReminderInput}
            placeholder={t('card.timePlaceholder')}
            placeholderTextColor="#8A8A8E"
            value={newTaskReminder}
            onChangeText={setNewTaskReminder}
            maxLength={5}
          />
          <Pressable
            style={[styles.addTaskButton, { backgroundColor: accentColor }]}
            onPress={handleAddTask}
          >
            <Text style={styles.addTaskButtonText}>{t('card.addButton')}</Text>
          </Pressable>
        </View>

        {/* Task List */}
        <View style={styles.taskListContainer}>
          {tasks.length === 0 ? (
            <View style={styles.emptyAgendaBox}>
              <Text style={styles.emptyAgendaIcon}>🌱</Text>
              <Text style={styles.emptyAgendaText}>
                {t('card.emptyAgenda')}
              </Text>
            </View>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskItemCard}>
                <Pressable
                  style={styles.taskCheckWrapper}
                  onPress={() => {
                    toggleTask(dateKey, task.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      task.completed ? { backgroundColor: accentColor, borderColor: accentColor } : styles.checkboxEmpty,
                    ]}
                  >
                    {task.completed && <Text style={styles.checkmarkIcon}>✓</Text>}
                  </View>
                  <View style={styles.taskTextCol}>
                    <Text
                      style={[
                        styles.taskTitleText,
                        task.completed && styles.taskTitleTextCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>
                    {task.reminderTime && (
                      <Text style={styles.taskReminderBadge}>⏰ {task.reminderTime}</Text>
                    )}
                  </View>
                </Pressable>

                <View style={styles.taskActionsRow}>
                  {!task.completed && (
                    <Pressable
                      style={styles.carryButton}
                      onPress={() => {
                        carryTaskToTomorrow(dateKey, task.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                      }}
                    >
                      <Text style={styles.carryButtonText}>{t('card.carryToTomorrow')}</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.deleteTaskButton}
                    onPress={() => {
                      deleteTask(dateKey, task.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    }}
                  >
                    <Text style={styles.deleteTaskText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Free-text Day Note Area */}
        <View style={styles.noteSection}>
          <Text style={styles.noteSectionTitle}>{t('card.noteAreaTitle')}</Text>
          <TextInput
            style={styles.agendaNoteTextArea}
            placeholder={t('card.noteAreaPlaceholder')}
            placeholderTextColor="#8A8A8E"
            multiline
            value={noteText}
            onChangeText={(text) => {
              setNoteText(text);
              setAgendaNote(dateKey, text);
            }}
          />
        </View>
      </View>

      {/* Wallpaper Preview Modal */}
      {card && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={showWallpaperModal}
          onRequestClose={() => setShowWallpaperModal(false)}
        >
          <View style={styles.wallpaperModalContainer}>
            <ViewShot
              ref={wallpaperShotRef}
              style={styles.wallpaperCaptureArea}
              options={{ format: 'png', quality: 1 }}
            >
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id={wallpaperGradientId} x1="0" y1="0" x2="1" y2="1">
                    {activeWallpaperPalette.map((hex, i) => (
                      <Stop
                        key={i}
                        offset={`${(i / (activeWallpaperPalette.length - 1)) * 100}%`}
                        stopColor={hex}
                      />
                    ))}
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${wallpaperGradientId})`} />
              </Svg>

              <View style={styles.wallpaperContent}>
                <Text style={styles.wallpaperBrandText}>{t('card.wallpaperModal.brand')}</Text>
                <Text style={styles.wallpaperDateText}>
                  {format(parseISO(card.date), 'd MMMM yyyy', { locale })}
                </Text>
                {wallpaperQuote !== '' && (
                  <Text style={styles.wallpaperQuoteText}>"{wallpaperQuote}"</Text>
                )}
                <Text style={styles.wallpaperPhraseText}>"{card.phrase}"</Text>
              </View>
            </ViewShot>

            <View style={styles.wallpaperControlsDrawer}>
              <Text style={styles.drawerSectionTitle}>{t('card.wallpaperModal.addQuoteTitle')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quoteChipRow}>
                <Pressable
                  style={[styles.quoteChip, wallpaperQuote === '' && styles.quoteChipSelected]}
                  onPress={() => setWallpaperQuote('')}
                >
                  <Text style={[styles.quoteChipText, wallpaperQuote === '' && styles.quoteChipTextSelected]}>
                    {t('card.wallpaperModal.noQuote')}
                  </Text>
                </Pressable>
                {motivationalQuotes.map((q) => (
                  <Pressable
                    key={q}
                    style={[styles.quoteChip, wallpaperQuote === q && styles.quoteChipSelected]}
                    onPress={() => setWallpaperQuote(q)}
                  >
                    <Text style={[styles.quoteChipText, wallpaperQuote === q && styles.quoteChipTextSelected]}>
                      {q}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <TextInput
                style={styles.customQuoteInput}
                placeholder={t('card.wallpaperModal.customQuotePlaceholder')}
                placeholderTextColor="#8A8A8E"
                value={wallpaperQuote}
                onChangeText={setWallpaperQuote}
              />

              <Text style={styles.drawerSectionTitle}>{t('card.wallpaperModal.toneTitle')}</Text>
              <View style={styles.tonePresetRow}>
                {TONE_PRESETS.map((tone) => (
                  <Pressable
                    key={tone.id}
                    style={[
                      styles.toneChip,
                      wallpaperTone === tone.id && styles.toneChipSelected,
                    ]}
                    onPress={() => setWallpaperTone(tone.id)}
                  >
                    <Text
                      style={[
                        styles.toneChipText,
                        wallpaperTone === tone.id && styles.toneChipTextSelected,
                      ]}
                    >
                      {t(`card.tonePresets.${tone.i18nKey}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.wallpaperActionRow}>
                <Pressable style={styles.wallpaperShareButton} onPress={handleShareWallpaper} disabled={generatingWallpaper}>
                  <Text style={styles.wallpaperShareButtonText}>
                    {generatingWallpaper ? t('card.wallpaperModal.savingButton') : t('card.wallpaperModal.downloadButton')}
                  </Text>
                </Pressable>
                <Pressable style={styles.wallpaperCloseButton} onPress={() => setShowWallpaperModal(false)}>
                  <Text style={styles.wallpaperCloseButtonText}>{t('card.wallpaperModal.closeButton')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Upgrade Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showUpgradeModal}
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>HUEDAY+</Text>
            <Text style={styles.modalTitle}>{t('card.wallpaperUpgradeModal.title')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('card.wallpaperUpgradeModal.subtitle')}
            </Text>
            <Pressable style={styles.modalButton} onPress={handleUpgrade}>
              <Text style={styles.modalButtonText}>{t('card.wallpaperUpgradeModal.tryButton')}</Text>
            </Pressable>
            <Pressable style={styles.modalCloseButton} onPress={() => setShowUpgradeModal(false)}>
              <Text style={styles.modalCloseButtonText}>{t('card.wallpaperUpgradeModal.cancelButton')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Crystal Selector Drawer */}
      <CrystalSelectorDrawer
        visible={showCrystalDrawer}
        date={dateKey}
        initialStoneId={card?.stoneId}
        initialManifestText={card?.manifestText}
        initialSealed={card?.isManifestSealed}
        onClose={() => setShowCrystalDrawer(false)}
        onSaved={() => setShowCrystalDrawer(false)}
      />

      {/* Sealing Ritual Modal */}
      {card && (
        <SealingRitualModal
          visible={showSealingModal}
          card={card}
          onClose={() => setShowSealingModal(false)}
          onSuccess={() => {
            setShowSealingModal(false);
            router.push('/album');
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    gap: 20,
    backgroundColor: '#FAF9F6',
  },
  sameVibeBanner: {
    backgroundColor: '#FFF0F5',
    borderColor: '#FFB6C1',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  sameVibeText: {
    color: '#D81B60',
    fontSize: 13,
    fontWeight: '700',
  },
  cardWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 24,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '600',
  },
  invitingEmptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
  },
  invitingEmptyIcon: {
    fontSize: 40,
  },
  invitingEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  invitingEmptyDesc: {
    fontSize: 13,
    color: '#8A8A8E',
    textAlign: 'center',
    lineHeight: 18,
  },
  createMoodButton: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 6,
  },
  createMoodButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  agendaSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 16,
  },
  agendaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agendaSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  agendaStatsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8E',
  },
  taskInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  taskTextInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1C1C1E',
  },
  taskReminderInput: {
    width: 80,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 12,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  addTaskButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  taskListContainer: {
    gap: 8,
  },
  emptyAgendaBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyAgendaIcon: {
    fontSize: 24,
  },
  emptyAgendaText: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  taskItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  taskCheckWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    borderColor: '#C7C7CC',
    backgroundColor: '#FFFFFF',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  taskTextCol: {
    flex: 1,
    gap: 2,
  },
  taskTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  taskTitleTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#8A8A8E',
  },
  taskReminderBadge: {
    fontSize: 10,
    color: '#8A8A8E',
    fontWeight: '500',
  },
  taskActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carryButton: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  carryButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  deleteTaskButton: {
    padding: 6,
  },
  deleteTaskText: {
    fontSize: 14,
    color: '#8A8A8E',
    fontWeight: '600',
  },
  noteSection: {
    gap: 8,
    marginTop: 8,
  },
  noteSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  agendaNoteTextArea: {
    backgroundColor: '#F9F9FB',
    borderRadius: 16,
    padding: 14,
    fontSize: 13,
    color: '#1C1C1E',
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  wallpaperModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  wallpaperCaptureArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallpaperContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  wallpaperBrandText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    opacity: 0.7,
  },
  wallpaperDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  wallpaperQuoteText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  wallpaperPhraseText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  wallpaperControlsDrawer: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    gap: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  drawerSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quoteChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quoteChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  quoteChipSelected: {
    backgroundColor: '#FFFFFF',
  },
  quoteChipText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  quoteChipTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  customQuoteInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
  },
  tonePresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toneChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toneChipSelected: {
    backgroundColor: '#FFFFFF',
  },
  toneChipText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  toneChipTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  wallpaperActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  wallpaperShareButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  wallpaperShareButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  wallpaperCloseButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  wallpaperCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  modalBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FDE047',
    letterSpacing: 2,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8A8A8E',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  morningRitualBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    marginVertical: 8,
  },
  morningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  morningTitleRow: {
    gap: 2,
  },
  morningBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 1.5,
  },
  morningStoneTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editRitualBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editRitualBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manifestQuoteBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FDE047',
  },
  manifestQuoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  sealedTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8A8E',
  },
  addRitualBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 8,
  },
  addRitualBarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
  modalCloseButtonText: {
    color: '#8A8A8E',
    fontSize: 13,
  },

  // ---- Gün İçi Ritüeli Styles ----
  dayRitualSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 18,
    marginVertical: 8,
    gap: 8,
  },
  ritualSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  memoriesListBox: {
    gap: 6,
    marginVertical: 4,
  },
  memoryItem: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
  },
  memoryText: {
    fontSize: 13,
    color: '#E5E5EA',
    lineHeight: 18,
  },
  addMemoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  memoryTextInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
  },
  addMemoryBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMemoryBtnText: {
    fontSize: 22,
    fontWeight: '600',
  },
  wordOfDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  wordOfDayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  wordOfDayInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});
