import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';

import { CRYSTALS, getCrystalById, type CrystalStone } from '../constants/crystals';
import { useHuedayStore } from '../lib/storage';
import { Text, View } from './Themed';

interface CrystalSelectorDrawerProps {
  visible: boolean;
  date: string;
  initialStoneId?: string;
  initialManifestText?: string;
  initialSealed?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function CrystalSelectorDrawer({
  visible,
  date,
  initialStoneId = 'ametist',
  initialManifestText = '',
  initialSealed = false,
  onClose,
  onSaved,
}: CrystalSelectorDrawerProps) {
  const { t } = useTranslation();
  const setDayStoneAndManifest = useHuedayStore((s) => s.setDayStoneAndManifest);

  const [selectedStoneId, setSelectedStoneId] = useState(initialStoneId);
  const [manifestText, setManifestText] = useState(initialManifestText);
  const [sealManifest, setSealManifest] = useState(initialSealed);
  const [saving, setSaving] = useState(false);

  // Slide-up Animation (~500ms)
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      setSelectedStoneId(initialStoneId || 'ametist');
      setManifestText(initialManifestText || '');
      setSealManifest(initialSealed || false);

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible, initialStoneId, initialManifestText, initialSealed, slideAnim]);

  const activeCrystal = getCrystalById(selectedStoneId) || CRYSTALS[0];

  const handleSelectStone = (stone: CrystalStone) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedStoneId(stone.id);
  };

  const handleSelectAffirmation = (affText: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setManifestText(affText);
  };

  const handleSave = async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    await setDayStoneAndManifest(date, selectedStoneId, manifestText.trim(), sealManifest);

    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSaving(false);
      onSaved();
    });
  };

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropDismiss} onPress={onClose} />

        <Animated.View style={[styles.drawerContent, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dragHandle} />

          <Text style={styles.badgeLabel}>{t('crystal.morningRitualBadge')}</Text>
          <Text style={styles.headerTitle}>{t('crystal.chooseStoneTitle')}</Text>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Horizontal Stone Picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stonesRow}>
              {CRYSTALS.map((stone) => {
                const isSelected = stone.id === selectedStoneId;
                return (
                  <Pressable
                    key={stone.id}
                    style={[
                      styles.stoneCard,
                      { borderColor: stone.color },
                      isSelected && { backgroundColor: stone.color + '22', borderWidth: 2.5 },
                    ]}
                    onPress={() => handleSelectStone(stone)}
                  >
                    <View style={[styles.stoneGem, { backgroundColor: stone.color }]}>
                      <Text style={styles.stoneEmoji}>{stone.icon}</Text>
                    </View>
                    <Text style={[styles.stoneName, isSelected && { color: stone.color }]}>
                      {t(`crystals.${stone.id}.name`)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Selected Stone Tagline */}
            <View style={[styles.taglineBox, { borderColor: activeCrystal.color }]}>
              <Text style={styles.taglineText}>{t(`crystals.${activeCrystal.id}.tagline`)}</Text>
            </View>

            {/* Ready Affirmations */}
            <Text style={styles.subSectionTitle}>{t('crystal.suggestedAffirmations')}</Text>
            <View style={styles.affirmationChipsRow}>
              {(t(`crystals.${activeCrystal.id}.affirmations`, { returnObjects: true }) as string[]).map((aff, i) => (
                <Pressable
                  key={i}
                  style={[
                    styles.affChip,
                    manifestText === aff && { backgroundColor: activeCrystal.color, borderColor: activeCrystal.color },
                  ]}
                  onPress={() => handleSelectAffirmation(aff)}
                >
                  <Text style={[styles.affChipText, manifestText === aff && { color: '#FFFFFF' }]}>
                    "{aff}"
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Free Text Manifest Input */}
            <Text style={styles.subSectionTitle}>{t('crystal.orWriteOwn')}</Text>
            <TextInput
              style={styles.manifestInput}
              placeholder={t('crystal.intentPlaceholder')}
              placeholderTextColor="#8A8A8E"
              multiline
              value={manifestText}
              onChangeText={setManifestText}
            />

            {/* Seal Manifest Checkbox / Switch */}
            <View style={styles.sealRow}>
              <View style={styles.sealTextCol}>
                <Text style={styles.sealTitle}>{t('crystal.sealMonthTitle')}</Text>
                <Text style={styles.sealDesc}>{t('crystal.sealMonthDesc')}</Text>
              </View>
              <Switch
                value={sealManifest}
                onValueChange={setSealManifest}
                trackColor={{ false: '#3A3A3C', true: activeCrystal.color }}
              />
            </View>

            {/* Action Buttons */}
            <Pressable
              style={[styles.saveButton, { backgroundColor: activeCrystal.color }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? t('crystal.saving') : t('crystal.saveButton')}</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  drawerContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
    gap: 12,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollBody: {
    gap: 14,
    paddingBottom: 20,
  },
  stonesRow: {
    gap: 12,
    paddingVertical: 6,
  },
  stoneCard: {
    width: 80,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 8,
  },
  stoneGem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stoneEmoji: {
    fontSize: 20,
  },
  stoneName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  taglineBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
  },
  taglineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8A8E',
    marginTop: 4,
  },
  affirmationChipsRow: {
    gap: 8,
  },
  affChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  affChipText: {
    fontSize: 12,
    color: '#E5E5EA',
    fontWeight: '600',
  },
  manifestInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    fontSize: 13,
    color: '#FFFFFF',
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
  },
  sealTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: 10,
  },
  sealTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sealDesc: {
    fontSize: 11,
    color: '#8A8A8E',
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
