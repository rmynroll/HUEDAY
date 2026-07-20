import * as Haptics from 'expo-haptics';
import { format, parseISO } from 'date-fns';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import WaxSealSvg from './WaxSealSvg';
import { Text, View } from './Themed';
import { decryptCapsuleNote } from '../lib/capsuleCipher';
import { getDateFnsLocale } from '../lib/i18n';
import { todayKey, useHuedayStore } from '../lib/storage';
import type { TimeCapsule } from '../types/capsule';

interface OpeningCeremonyModalProps {
  visible: boolean;
  capsule: TimeCapsule | null;
  onClose: () => void;
  onReplyRequested?: (parentCapsuleId: string, replyNoteText: string) => void;
}

type Step = 'seal' | 'note' | 'colors' | 'reply';

export default function OpeningCeremonyModal({
  visible,
  capsule,
  onClose,
  onReplyRequested,
}: OpeningCeremonyModalProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);

  if (!capsule) return null;

  const todayStr = todayKey();
  const cards = useHuedayStore((s) => s.cards);
  const openTimeCapsule = useHuedayStore((s) => s.openTimeCapsule);

  const lastYearCard = cards[capsule.cardDate];
  const todayCard = cards[todayStr];

  const [step, setStep] = useState<Step>('seal');
  const [replyText, setReplyText] = useState('');

  // Animations
  const crackAnim = useRef(new Animated.Value(1)).current; // 1 to 0 scale/opacity
  const noteFadeAnim = useRef(new Animated.Value(0)).current;

  const decryptedText = decryptCapsuleNote(capsule.encryptedNote);
  const noteLines = decryptedText.split('\n').filter((l) => l.trim().length > 0);

  const handleCrackSeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    Animated.timing(crackAnim, {
      toValue: 0,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      openTimeCapsule(capsule.id);
      setStep('note');
      Animated.timing(noteFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleFinishReply = () => {
    if (replyText.trim() && onReplyRequested) {
      onReplyRequested(capsule.id, replyText.trim());
    }
    setStep('seal');
    setReplyText('');
    crackAnim.setValue(1);
    noteFadeAnim.setValue(0);
    onClose();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.contentCard}>
          {/* STEP 1: Crack Wax Seal */}
          {step === 'seal' && (
            <View style={styles.stepBox}>
              <Text style={styles.stepBadge}>{t('openingCeremony.yearLaterBadge')}</Text>
              <Text style={styles.stepTitle}>{t('openingCeremony.noteFromLastYear')}</Text>
              <Text style={styles.stepSubtitle}>
                {t('openingCeremony.sealedOnDate', { date: format(parseISO(capsule.sealedDate), 'd MMMM yyyy', { locale }) })}
              </Text>

              <Pressable style={styles.sealClickArea} onPress={handleCrackSeal}>
                <Animated.View style={{ transform: [{ scale: crackAnim }], opacity: crackAnim }}>
                  <WaxSealSvg color={capsule.sealColor} motif={capsule.sealMotif} initial={capsule.userInitial} size={84} />
                </Animated.View>
                <Text style={styles.tapHintText}>{t('openingCeremony.tapToCrack')}</Text>
              </Pressable>
            </View>
          )}

          {/* STEP 2: Reveal Decrypted Note */}
          {step === 'note' && (
            <ScrollView contentContainerStyle={styles.stepBoxScroll}>
              <Text style={styles.stepBadge}>{t('openingCeremony.capsuleNoteBadge')}</Text>
              <Text style={styles.stepTitle}>{t('openingCeremony.saidLastYear')}</Text>

              <Animated.View style={[styles.notePaper, { opacity: noteFadeAnim }]}>
                {noteLines.map((line, idx) => (
                  <Text key={idx} style={styles.noteLineText}>
                    {line}
                  </Text>
                ))}
              </Animated.View>

              <Pressable style={styles.primaryButton} onPress={() => setStep('colors')}>
                <Text style={styles.primaryButtonText}>{t('openingCeremony.seeColorComparison')}</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* STEP 3: "Renklerin" Comparison Screen */}
          {step === 'colors' && (
            <ScrollView contentContainerStyle={styles.stepBoxScroll}>
              <Text style={styles.stepBadge}>{t('openingCeremony.colorsBadge')}</Text>
              <Text style={styles.stepTitle}>{t('openingCeremony.oneYearAgoToday')}</Text>

              <View style={styles.comparisonRow}>
                {/* Left: Last Year */}
                <View style={styles.paletteCol}>
                  <Text style={styles.colLabel}>
                    {format(parseISO(capsule.sealedDate), 'd MMMM yyyy', { locale })}
                  </Text>
                  <View style={styles.paletteBox}>
                    {(lastYearCard?.palette || [capsule.sealColor]).map((hex, i) => (
                      <View key={i} style={[styles.swatch, { backgroundColor: hex }]} />
                    ))}
                  </View>
                </View>

                {/* Right: Today */}
                <View style={styles.paletteCol}>
                  <Text style={styles.colLabel}>{t('openingCeremony.todayLabel')}</Text>
                  {todayCard ? (
                    <View style={styles.paletteBox}>
                      {todayCard.palette.map((hex, i) => (
                        <View key={i} style={[styles.swatch, { backgroundColor: hex }]} />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyTodayBox}>
                      <Text style={styles.emptyTodayText}>{t('openingCeremony.notChosenYet')}</Text>
                    </View>
                  )}
                </View>
              </View>

              <Pressable style={styles.primaryButton} onPress={() => setStep('reply')}>
                <Text style={styles.primaryButtonText}>{t('openingCeremony.writeReplyButton')}</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* STEP 4: Reply Reflection Question */}
          {step === 'reply' && (
            <ScrollView contentContainerStyle={styles.stepBoxScroll}>
              <Text style={styles.stepBadge}>{t('openingCeremony.timeLoopBadge')}</Text>
              <Text style={styles.stepTitle}>{t('openingCeremony.whatToSayToLastYear')}</Text>
              <Text style={styles.stepSubtitle}>
                {t('openingCeremony.replyBecomesCapsule')}
              </Text>

              <TextInput
                style={styles.replyInput}
                placeholder={t('openingCeremony.replyPlaceholder')}
                placeholderTextColor="#8A8A8E"
                multiline
                value={replyText}
                onChangeText={setReplyText}
              />

              <Pressable style={styles.primaryButton} onPress={handleFinishReply}>
                <Text style={styles.primaryButtonText}>
                  {replyText.trim() ? t('openingCeremony.sealReplyButton') : t('openingCeremony.skipButton')}
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  stepBox: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  stepBoxScroll: {
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  stepBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#8A8A8E',
    textAlign: 'center',
  },
  sealClickArea: {
    alignItems: 'center',
    marginVertical: 24,
    gap: 16,
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  notePaper: {
    backgroundColor: '#FAF9F6',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    gap: 10,
  },
  noteLineText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginVertical: 8,
  },
  paletteCol: {
    flex: 1,
    gap: 8,
    alignItems: 'center',
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A8E',
  },
  paletteBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  swatch: {
    width: '47%',
    height: '47%',
    borderRadius: 8,
  },
  emptyTodayBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  emptyTodayText: {
    fontSize: 11,
    color: '#8A8A8E',
    textAlign: 'center',
  },
  replyInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    fontSize: 13,
    color: '#FFFFFF',
    minHeight: 110,
    width: '100%',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
});
