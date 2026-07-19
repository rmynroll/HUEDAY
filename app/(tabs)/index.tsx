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

import DayCard from '@/components/DayCard';
import MoodSlider from '@/components/MoodSlider';
import TagPicker from '@/components/TagPicker';
import { Text, View } from '@/components/Themed';
import { scheduleDailyReminder } from '@/lib/notifications';
import { todayKey, useHuedayStore } from '@/lib/storage';
import { CARD_STYLES } from '@/lib/cardStyles';
import { generateCard } from '@/lib/hueMotor';
import type { MoodTags, CardStyleId } from '@/types/card';

export default function TodayScreen() {
  const date = todayKey();
  const existingCard = useHuedayStore((s) => s.cards[date]);
  const submitMood = useHuedayStore((s) => s.submitMood);
  const isPremium = useHuedayStore((s) => s.isPremium);
  const togglePremium = useHuedayStore((s) => s.togglePremium);
  const lastSelectedStyle = useHuedayStore((s) => s.lastSelectedStyle);
  const setLastSelectedStyle = useHuedayStore((s) => s.setLastSelectedStyle);

  const [mood, setMood] = useState(0.5);
  const [tags, setTags] = useState<MoodTags>({ energy: 0.5, sleep: 0.5, sociality: 0.5 });
  const [note, setNote] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [styleId, setStyleId] = useState<CardStyleId>(lastSelectedStyle);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Stable seed for preview session so phrase and colors don't jump wildly
  const [previewSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));

  // Sync with store preference
  useEffect(() => {
    setStyleId(lastSelectedStyle);
  }, [lastSelectedStyle]);

  // Spring animation for preview card hover/pop
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function useRef<T>(initialValue: T): { current: T } {
    return useMemo(() => ({ current: initialValue }), []);
  }

  // Generate real-time card preview
  const previewCard = useMemo(() => {
    return generateCard({
      date,
      mood,
      tags,
      note: note.trim() || undefined,
      styleId,
      song: songTitle.trim() && songArtist.trim() ? { title: songTitle.trim(), artist: songArtist.trim() } : undefined,
      seed: previewSeed,
      freeStylesOnly: false, // Allow previewing premium styles
    });
  }, [date, mood, tags, note, styleId, songTitle, songArtist, previewSeed]);

  const handleSave = async () => {
    const selectedStyleDef = CARD_STYLES.find((s) => s.id === styleId);
    if (selectedStyleDef && !selectedStyleDef.free && !isPremium) {
      // Trigger Hueday+ upgrade modal
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
    
    // Save mood
    submitMood({
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

  if (existingCard) {
    return (
      <ScrollView contentContainerStyle={styles.filledContainer}>
        <Text style={styles.heading}>Bugünün kartı hazır ✨</Text>
        <Text style={styles.subheading}>Ruh halin bir sanat eserine dönüştü.</Text>
        <Pressable style={styles.cardPreview} onPress={() => router.push(`/card/${date}`)}>
          <DayCard card={existingCard} />
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => router.push(`/card/${date}`)}>
          <Text style={styles.primaryButtonText}>Kartı Görüntüle</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FAF9F6' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Dynamic Card Preview */}
        <Animated.View style={[styles.previewSection, { transform: [{ scale: scaleAnim }] }]}>
          <DayCard card={previewCard} />
        </Animated.View>

        <View style={styles.formContainer}>
          <Text style={styles.heading}>Bugün hangi renktesin?</Text>
          <Text style={styles.subheading}>Aşağıdaki kaydırıcı ve etiketlerle ruh halini yansıt.</Text>

          {/* Mood Slider */}
          <View style={styles.section}>
            <MoodSlider value={mood} onChange={setMood} />
          </View>

          {/* Style Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kart Stili Seç</Text>
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
                      {style.name}
                    </Text>
                    {isLocked && <Text style={styles.lockBadge}>👑</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Tags Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Etiketler</Text>
            <View style={styles.tagsContainer}>
              <TagPicker label="Enerji" value={tags.energy} onChange={(v) => setTags((t) => ({ ...t, energy: v }))} />
              <TagPicker label="Uyku" value={tags.sleep} onChange={(v) => setTags((t) => ({ ...t, sleep: v }))} />
              <TagPicker
                label="Sosyallik"
                value={tags.sociality}
                onChange={(v) => setTags((t) => ({ ...t, sociality: v }))}
              />
            </View>
          </View>

          {/* Note Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Günün Notu</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Tek satırlık bir his yaz... (isteğe bağlı)"
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
              <Text style={styles.sectionTitle}>🎵 Günün Şarkısı {isMusicExpanded ? '▲' : '▼'}</Text>
            </Pressable>
            {isMusicExpanded && (
              <View style={styles.musicFields}>
                <TextInput
                  style={styles.musicInput}
                  placeholder="Şarkı Adı"
                  placeholderTextColor="#8A8A8E"
                  value={songTitle}
                  onChangeText={setSongTitle}
                />
                <TextInput
                  style={styles.musicInput}
                  placeholder="Sanatçı"
                  placeholderTextColor="#8A8A8E"
                  value={songArtist}
                  onChangeText={setSongArtist}
                />
              </View>
            )}
          </View>

          {/* Create Button */}
          <Pressable style={styles.primaryButton} onPress={handleSave} disabled={submitting}>
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Kartın Dokunuyor…' : 'Kartımı Oluştur'}
            </Text>
          </Pressable>
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
            <Text style={styles.modalTitle}>hueday+ ile sınırları kaldır 👑</Text>
            <Text style={styles.modalSubtitle}>
              Kendini renklerle ifade etmenin en estetik yolunu keşfet.
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🎨</Text>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>Tüm Kart Stilleri</Text>
                  <Text style={styles.benefitDesc}>Y2K Krom, Sulu Boya ve Gece Neonu stillerine erişin.</Text>
                </View>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📱</Text>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>Duvar Kağıdı Seti</Text>
                  <Text style={styles.benefitDesc}>Günün kartından kilit ve ana ekran duvar kağıdı oluşturun.</Text>
                </View>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>💫</Text>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>Same Vibe Eşleşmesi</Text>
                  <Text style={styles.benefitDesc}>Arkadaşlarınızla aynı gün benzer moodları yakalayın.</Text>
                </View>
              </View>
            </View>

            <Text style={styles.pricingText}>Aylık sadece 29.99 TL</Text>

            <Pressable style={styles.modalButton} onPress={handleUpgrade}>
              <Text style={styles.modalButtonText}>Hueday+ Sürümüne Yükselt</Text>
            </Pressable>

            <Pressable style={styles.modalCloseButton} onPress={() => setShowUpgradeModal(false)}>
              <Text style={styles.modalCloseButtonText}>Ücretsiz Devam Et</Text>
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
  filledContainer: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flexGrow: 1,
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
    marginBottom: 20,
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
  tagsContainer: {
    gap: 12,
    backgroundColor: 'transparent',
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
  cardPreview: {
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
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
