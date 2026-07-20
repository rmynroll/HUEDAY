import { router } from 'expo-router';
import React, { useState, useMemo, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import ColorMoodPicker from '@/components/ColorMoodPicker';
import DayCard from '@/components/DayCard';
import MultiDimensionMoodSelector, { MoodDimensions } from '@/components/MultiDimensionMoodSelector';
import WeekStrip from '@/components/WeekStrip';
import { Text, View } from '@/components/Themed';
import { scheduleDailyReminder } from '@/lib/notifications';
import { todayKey, useHuedayStore } from '@/lib/storage';
import { CARD_STYLES } from '@/lib/cardStyles';
import { generateCard } from '@/lib/hueMotor';
import type { ColorMoodEmotion, MoodTags, CardStyleId } from '@/types/card';
import type { AgendaTask } from '@/types/agenda';

const EMPTY_TASKS: AgendaTask[] = [];

export default function TodayScreen() {
  const { t } = useTranslation();
  const date = todayKey();
  const existingCard = useHuedayStore((s) => s.cards?.[date]);
  const rawTodayTasks = useHuedayStore((s) => s.tasks?.[date]);
  const todayTasks = rawTodayTasks || EMPTY_TASKS;
  const submitMood = useHuedayStore((s) => s.submitMood);
  const isPremium = useHuedayStore((s) => s.isPremium);
  const togglePremium = useHuedayStore((s) => s.togglePremium);
  const lastSelectedStyle = useHuedayStore((s) => s.lastSelectedStyle);
  const setLastSelectedStyle = useHuedayStore((s) => s.setLastSelectedStyle);
  const setColorMoodEntry = useHuedayStore((s) => s.setColorMoodEntry);
  const removeColorMoodEntry = useHuedayStore((s) => s.removeColorMoodEntry);

  const [entryMode, setEntryMode] = useState<'detailed' | 'quick'>('detailed');

  const completedTodayTasksCount = useMemo(() => {
    return todayTasks.filter((t) => t.completed).length;
  }, [todayTasks]);

  const [dimensions, setDimensions] = useState<MoodDimensions>({
    energy: 0.65,
    sleep: 0.65,
    sociality: 0.5,
  });
  const [mood, setMood] = useState(0.6);
  const [tags, setTags] = useState<MoodTags>({ energy: 0.65, sleep: 0.65, sociality: 0.5 });
  const [note, setNote] = useState('');
  const [songTitle, setSongTitle] = useState('Golden Hour');
  const [songArtist, setSongArtist] = useState('JVKE');
  const [styleId, setStyleId] = useState<CardStyleId>(lastSelectedStyle);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDimensionsChange = (newDims: MoodDimensions) => {
    setDimensions(newDims);
    setMood((newDims.energy + newDims.sleep + newDims.sociality) / 3);
    setTags({
      energy: newDims.energy,
      sleep: newDims.sleep,
      sociality: newDims.sociality,
    });
  };

  const [previewSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));

  useEffect(() => {
    if (existingCard) {
      if (existingCard.tags) {
        setDimensions({
          energy: existingCard.tags.energy ?? 0.65,
          sleep: existingCard.tags.sleep ?? 0.65,
          sociality: existingCard.tags.sociality ?? 0.5,
        });
        setTags(existingCard.tags);
      }
      if (existingCard.mood !== undefined) setMood(existingCard.mood);
      if (existingCard.note) setNote(existingCard.note);
      if (existingCard.song) {
        setSongTitle(existingCard.song.title);
        setSongArtist(existingCard.song.artist);
      }
      if (existingCard.styleId) setStyleId(existingCard.styleId);
    } else {
      setStyleId(lastSelectedStyle);
    }
  }, [existingCard, lastSelectedStyle]);

  const scaleAnim = useMemo(() => new Animated.Value(1), []);

  const previewCard = useMemo(() => {
    return generateCard({
      date,
      mood,
      tags,
      note: note.trim() || undefined,
      styleId,
      song: songTitle.trim() && songArtist.trim() ? { title: songTitle.trim(), artist: songArtist.trim() } : undefined,
      seed: previewSeed,
      freeStylesOnly: false,
    });
  }, [date, mood, tags, note, styleId, songTitle, songArtist, previewSeed]);

  const handleQuickColorSelect = (emotion: ColorMoodEmotion, intensity: 1 | 2 | 3) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setColorMoodEntry(date, emotion, intensity).catch(() => {});
  };

  const handleQuickColorDeselect = (emotion: ColorMoodEmotion) => {
    removeColorMoodEntry(date, emotion);
  };

  const handleSave = async () => {
    const selectedStyleDef = CARD_STYLES.find((s) => s.id === styleId);
    if (selectedStyleDef && !selectedStyleDef.free && !isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setShowUpgradeModal(true);
      return;
    }

    setSubmitting(true);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.05, friction: 3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    
    await submitMood({
      date,
      mood,
      tags,
      note: note.trim() || undefined,
      styleId,
      song: songTitle.trim() && songArtist.trim() ? { title: songTitle.trim(), artist: songArtist.trim() } : undefined,
    });
    
    scheduleDailyReminder().catch(() => {});
    
    setTimeout(() => {
      setSubmitting(false);
      router.push(`/card/${date}`);
    }, 400);
  };

  const handleStyleSelect = (id: CardStyleId) => {
    const selectedStyleDef = CARD_STYLES.find((s) => s.id === id);
    setStyleId(id);
    setLastSelectedStyle(id);
    
    if (selectedStyleDef && !selectedStyleDef.free && !isPremium) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setShowUpgradeModal(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleUpgrade = () => {
    togglePremium();
    setShowUpgradeModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FAF9F6' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Dynamic Card Preview */}
        <Animated.View style={[styles.previewSection, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.previewCardWrapper}>
            <DayCard card={previewCard} />
          </View>
        </Animated.View>

        <View style={styles.formContainer}>
          {/* Horizontal 7-Day Week Strip */}
          <WeekStrip onSelectDate={(selDate) => router.push(`/card/${selDate}`)} />

          <Text style={styles.heading}>{t('today.heading')}</Text>
          <Text style={styles.subheading}>{t('today.subheading')}</Text>

          {/* Mood Bridge Tasks Summary Info */}
          {todayTasks.length > 0 && (
            <View style={styles.taskBridgeBanner}>
              <Text style={styles.taskBridgeText}>
                {t('today.taskBridge', { completed: completedTodayTasksCount, total: todayTasks.length })}
              </Text>
            </View>
          )}

          {/* Entry Mode Toggle: Detaylı vs Hızlı Giriş */}
          <View style={styles.modeToggleRow}>
            <Pressable
              style={[styles.modeToggleButton, entryMode === 'detailed' && styles.modeToggleButtonActive]}
              onPress={() => setEntryMode('detailed')}
            >
              <Text style={[styles.modeToggleText, entryMode === 'detailed' && styles.modeToggleTextActive]}>
                {t('today.modeDetailed')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeToggleButton, entryMode === 'quick' && styles.modeToggleButtonActive]}
              onPress={() => setEntryMode('quick')}
            >
              <Text style={[styles.modeToggleText, entryMode === 'quick' && styles.modeToggleTextActive]}>
                {t('today.modeQuick')}
              </Text>
            </Pressable>
          </View>

          {entryMode === 'quick' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('today.quickPickHeading')}</Text>
              <ColorMoodPicker
                entries={existingCard?.colorMoods || []}
                onSelect={handleQuickColorSelect}
                onDeselect={handleQuickColorDeselect}
              />
            </View>
          ) : (
            <>
              {/* Multi-Dimension Mood Sliders + Live Palette Preview */}
              <View style={styles.section}>
                <MultiDimensionMoodSelector dimensions={dimensions} onChange={handleDimensionsChange} />
              </View>

              {/* Style Selector */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('today.styleSectionTitle')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylesList}>
                  {CARD_STYLES.map((style) => {
                    const isSelected = styleId === style.id;
                    const isLocked = !style.free && !isPremium;
                    return (
                      <Pressable
                        key={style.id}
                        style={[
                          styles.styleChip,
                          isSelected && styles.styleChipSelected,
                        ]}
                        onPress={() => handleStyleSelect(style.id)}
                      >
                        <Text style={[styles.styleChipText, isSelected && styles.styleChipTextSelected]}>
                          {t(`cardStyles.${style.i18nKey}`)}
                        </Text>
                        {isLocked && <Text style={styles.lockBadge}>👑</Text>}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Note Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('today.noteSectionTitle')}</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder={t('today.notePlaceholder')}
                  placeholderTextColor="#8A8A8E"
                  value={note}
                  onChangeText={setNote}
                  maxLength={80}
                />
              </View>

              {/* Music Integrations */}
              <View style={styles.section}>
                <Pressable
                  style={styles.expandHeader}
                  onPress={() => setIsMusicExpanded(!isMusicExpanded)}
                >
                  <Text style={styles.sectionTitle}>{t('today.musicSectionTitle')} {isMusicExpanded ? '▲' : '▼'}</Text>
                </Pressable>
                {isMusicExpanded && (
                  <View style={styles.musicFields}>
                    <TextInput
                      style={styles.musicInput}
                      placeholder={t('today.songNamePlaceholder')}
                      placeholderTextColor="#8A8A8E"
                      value={songTitle}
                      onChangeText={setSongTitle}
                    />
                    <TextInput
                      style={styles.musicInput}
                      placeholder={t('today.artistPlaceholder')}
                      placeholderTextColor="#8A8A8E"
                      value={songArtist}
                      onChangeText={setSongArtist}
                    />
                  </View>
                )}
              </View>

              {/* Create / Update Button */}
              <Pressable style={styles.primaryButton} onPress={handleSave} disabled={submitting}>
                <Text style={styles.primaryButtonText}>
                  {submitting ? t('today.updatingButton') : existingCard ? t('today.updateButton') : t('today.createButton')}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {/* Hueday+ Premium Upgrade Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUpgradeModal}
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('today.upgradeModal.title')}</Text>
            <Text style={styles.modalSubtitle}>{t('today.upgradeModal.subtitle')}</Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🎨</Text>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>{t('today.upgradeModal.benefit1Title')}</Text>
                  <Text style={styles.benefitDesc}>{t('today.upgradeModal.benefit1Desc')}</Text>
                </View>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📱</Text>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>{t('today.upgradeModal.benefit2Title')}</Text>
                  <Text style={styles.benefitDesc}>{t('today.upgradeModal.benefit2Desc')}</Text>
                </View>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>💫</Text>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>{t('today.upgradeModal.benefit3Title')}</Text>
                  <Text style={styles.benefitDesc}>{t('today.upgradeModal.benefit3Desc')}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.pricingText}>{t('today.upgradeModal.price')}</Text>

            <Pressable style={styles.modalButton} onPress={handleUpgrade}>
              <Text style={styles.modalButtonText}>{t('today.upgradeModal.upgradeButton')}</Text>
            </Pressable>

            <Pressable style={styles.modalCloseButton} onPress={() => setShowUpgradeModal(false)}>
              <Text style={styles.modalCloseButtonText}>{t('today.upgradeModal.continueFree')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#FAF9F6',
  },
  previewSection: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  previewCardWrapper: {
    width: '75%',
    maxWidth: 260,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: '#FAF9F6',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13,
    color: '#8A8A8E',
    marginTop: 4,
    marginBottom: 16,
  },
  taskBridgeBanner: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  taskBridgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  modeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  modeToggleButtonActive: {
    backgroundColor: '#1C1C1E',
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8A8E',
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  stylesList: {
    gap: 10,
    paddingVertical: 4,
  },
  styleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  styleChipSelected: {
    borderColor: '#1C1C1E',
    backgroundColor: '#1C1C1E',
  },
  styleChipText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  styleChipTextSelected: {
    color: '#FFFFFF',
  },
  lockBadge: {
    fontSize: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#1C1C1E',
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  musicFields: {
    gap: 8,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  musicInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#1C1C1E',
  },
  primaryButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8A8A8E',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  benefitsList: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  benefitDesc: {
    fontSize: 11,
    color: '#8A8A8E',
    marginTop: 2,
  },
  pricingText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  modalCloseButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#8A8A8E',
    fontSize: 13,
    fontWeight: '600',
  },
});
