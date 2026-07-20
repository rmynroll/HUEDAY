import React from 'react';
import { StyleSheet, Pressable, ScrollView, Alert, Switch, Platform, Modal } from 'react-native';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Text, View } from '@/components/Themed';
import { useHuedayStore } from '@/lib/storage';
import { scheduleDailyReminder } from '@/lib/notifications';
import { setAppLanguage, SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type SupportedLanguage } from '@/lib/i18n';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const isPremium = useHuedayStore((s) => s.isPremium);
  const togglePremium = useHuedayStore((s) => s.togglePremium);
  const clearAllCards = useHuedayStore((s) => s.clearAllCards);

  const [reminderEnabled, setReminderEnabled] = React.useState(true);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  const handleLanguageChange = (lng: SupportedLanguage) => {
    setAppLanguage(lng).catch(() => {});
  };

  const handleReminderToggle = async (value: boolean) => {
    setReminderEnabled(value);
    if (value) {
      try {
        await scheduleDailyReminder();
      } catch (e) {
        // Permissions not granted or notifications not supported
      }
    }
  };

  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    clearAllCards();
    setShowResetConfirm(false);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('nav.settings'), headerRight: () => null }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hueday+ Premium Section */}
        <View style={[styles.premiumCard, isPremium && styles.premiumCardActive]}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumTitle}>
              {isPremium ? t('settings.premiumMemberTitle') : t('settings.premiumUpgradeTitle')}
            </Text>
            <Switch
              value={isPremium}
              onValueChange={togglePremium}
              trackColor={{ false: '#3A3A3C', true: '#E6F4FE' }}
              thumbColor={isPremium ? '#007AFF' : '#8E8E93'}
            />
          </View>
          <Text style={styles.premiumDescription}>
            {isPremium ? t('settings.premiumMemberDesc') : t('settings.premiumUpgradeDesc')}
          </Text>
          {!isPremium && (
            <Pressable style={styles.upgradeButton} onPress={togglePremium}>
              <Text style={styles.upgradeButtonText}>{t('settings.tryButton')}</Text>
            </Pressable>
          )}
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.notificationsSection')}</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{t('settings.dailyReminderTitle')}</Text>
              <Text style={styles.rowSub}>{t('settings.dailyReminderDesc')}</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
            />
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.languageSection')}</Text>
          <View style={styles.languageGrid}>
            {SUPPORTED_LANGUAGES.map((lng) => {
              const isActive = i18n.language === lng;
              return (
                <Pressable
                  key={lng}
                  style={[styles.languageButton, isActive && styles.languageButtonActive]}
                  onPress={() => handleLanguageChange(lng)}
                >
                  <Text style={[styles.languageButtonText, isActive && styles.languageButtonTextActive]}>
                    {LANGUAGE_NAMES[lng]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.dataSection')}</Text>
          <Pressable style={styles.dangerRow} onPress={handleResetData}>
            <Text style={styles.dangerText}>{t('settings.resetAllButton')}</Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.aboutContainer}>
          <Text style={styles.appName}>{t('settings.appName')}</Text>
          <Text style={styles.appVersion}>{t('settings.appVersion')}</Text>
          <Text style={styles.appQuote}>{t('settings.appQuote')}</Text>
        </View>
      </ScrollView>

      {/* Reset Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showResetConfirm}
        onRequestClose={() => setShowResetConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.resetModal.title')}</Text>
            <Text style={styles.modalSubtitle}>{t('settings.resetModal.warning')}</Text>

            <View style={styles.modalButtonRow}>
              <Pressable style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setShowResetConfirm(false)}>
                <Text style={styles.modalButtonTextCancel}>{t('settings.resetModal.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalButtonConfirm]} onPress={confirmReset}>
                <Text style={styles.modalButtonTextConfirm}>{t('settings.resetModal.confirm')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  premiumCard: {
    backgroundColor: '#1A1A1C',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  premiumCardActive: {
    borderColor: '#3A3A3C',
    backgroundColor: '#121214',
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  premiumDescription: {
    color: '#E5E5EA',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8E',
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    color: '#8A8A8E',
    marginTop: 2,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    minWidth: '31%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  dangerRow: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    alignItems: 'center',
  },
  dangerText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '600',
  },
  aboutContainer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
    backgroundColor: 'transparent',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#1C1C1E',
  },
  appVersion: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  appQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#8A8A8E',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F2F2F7',
  },
  modalButtonConfirm: {
    backgroundColor: '#FF3B30',
  },
  modalButtonTextCancel: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
