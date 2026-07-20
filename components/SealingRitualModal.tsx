import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import WaxSealSvg from './WaxSealSvg';
import { Text, View } from './Themed';
import { determineSealMotif } from '../lib/capsule';
import { useHuedayStore } from '../lib/storage';
import type { DayCard } from '../types/card';

interface SealingRitualModalProps {
  visible: boolean;
  card: DayCard;
  parentCapsuleId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SealingRitualModal({
  visible,
  card,
  parentCapsuleId,
  onClose,
  onSuccess,
}: SealingRitualModalProps) {
  const { t } = useTranslation();
  const sealTimeCapsule = useHuedayStore((s) => s.sealTimeCapsule);
  const [noteText, setNoteText] = useState('');
  const [isSealingAnimation, setIsSealingAnimation] = useState(false);

  // Animations
  const foldAnim = useRef(new Animated.Value(0)).current; // 0 to 1
  const sealDropAnim = useRef(new Animated.Value(-100)).current; // -100 to 0
  const sealScaleAnim = useRef(new Animated.Value(0)).current; // 0 to 1

  const accentColor = card.palette[0] || '#E55B70';
  const motif = determineSealMotif(
    card.primaryEvent?.category,
    card.primaryEvent?.textureVariant
  );

  const handleSeal = async () => {
    if (!noteText.trim()) return;

    setIsSealingAnimation(true);

    // 1. Envelope Fold Animation (~600ms)
    Animated.timing(foldAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // 2. Wax Seal Drop & Expand (~800ms)
      Animated.parallel([
        Animated.spring(sealDropAnim, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(sealScaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        // Haptic feedback when seal hardens
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

        // Save capsule in store
        await sealTimeCapsule(card.date, noteText.trim(), 'K', parentCapsuleId);

        setTimeout(() => {
          setIsSealingAnimation(false);
          setNoteText('');
          foldAnim.setValue(0);
          sealDropAnim.setValue(-100);
          sealScaleAnim.setValue(0);
          onSuccess();
        }, 500);
      });
    });
  };

  const foldRotateX = foldAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.cardBox}>
          <Text style={styles.modalBadge}>{t('sealingRitual.badge')}</Text>
          <Text style={styles.modalTitle}>{t('sealingRitual.title')}</Text>

          {!isSealingAnimation ? (
            <>
              <Text style={styles.warningText}>
                {t('sealingRitual.warning')}
              </Text>

              <TextInput
                style={styles.noteInput}
                placeholder={t('sealingRitual.notePlaceholder')}
                placeholderTextColor="#8A8A8E"
                multiline
                value={noteText}
                onChangeText={setNoteText}
              />

              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.sealButton, { backgroundColor: accentColor }]}
                  onPress={handleSeal}
                >
                  <Text style={styles.sealButtonText}>{t('sealingRitual.sealButton')}</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>{t('sealingRitual.cancelButton')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.animationArea}>
              <Animated.View
                style={[
                  styles.envelopeFlap,
                  { transform: [{ perspective: 800 }, { rotateX: foldRotateX }] },
                ]}
              >
                <Text style={styles.envelopeIcon}>✉️</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.waxSealWrapper,
                  {
                    transform: [
                      { translateY: sealDropAnim },
                      { scale: sealScaleAnim },
                    ],
                  },
                ]}
              >
                <WaxSealSvg color={accentColor} motif={motif} initial="K" size={72} />
              </Animated.View>

              <Text style={styles.sealingStatusText}>{t('sealingRitual.freezing')}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 14,
    alignItems: 'center',
  },
  modalBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 17,
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    fontSize: 13,
    color: '#FFFFFF',
    minHeight: 120,
    width: '100%',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actionsRow: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  sealButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sealButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8A8A8E',
    fontSize: 13,
  },
  animationArea: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  envelopeFlap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  envelopeIcon: {
    fontSize: 64,
  },
  waxSealWrapper: {
    position: 'absolute',
  },
  sealingStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
  },
});
