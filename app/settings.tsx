import React from 'react';
import { StyleSheet, Pressable, ScrollView, Alert, Switch, Platform } from 'react-native';
import { router, Stack } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useHuedayStore } from '@/lib/storage';
import { scheduleDailyReminder } from '@/lib/notifications';

export default function SettingsScreen() {
  const isPremium = useHuedayStore((s) => s.isPremium);
  const togglePremium = useHuedayStore((s) => s.togglePremium);
  const clearAllCards = useHuedayStore((s) => s.clearAllCards);

  const [reminderEnabled, setReminderEnabled] = React.useState(true);

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
    const performReset = () => {
      clearAllCards();
      Alert.alert('Başarılı', 'Tüm geçmiş kartlarınız sıfırlandı.', [{ text: 'Tamam' }]);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tüm verilerinizi sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
        performReset();
      }
    } else {
      Alert.alert(
        'Verileri Sıfırla',
        'Tüm geçmiş kartlarınız silinecek. Bu işlem geri alınamaz. Emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Evet, Sıfırla', style: 'destructive', onPress: performReset },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Ayarlar', headerRight: () => null }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hueday+ Premium Section */}
        <View style={[styles.premiumCard, isPremium && styles.premiumCardActive]}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumTitle}>
              {isPremium ? 'hueday+ üyesi 👑' : 'hueday+ sürümüne geç'}
            </Text>
            <Switch
              value={isPremium}
              onValueChange={togglePremium}
              trackColor={{ false: '#3A3A3C', true: '#E6F4FE' }}
              thumbColor={isPremium ? '#007AFF' : '#8E8E93'}
            />
          </View>
          <Text style={styles.premiumDescription}>
            {isPremium
              ? 'Premium özelliklerin keyfini çıkarın! Tüm kart stilleri, Duvar Kağıdı Seti ve daha fazlası açık.'
              : 'Tüm kart stillerini (Y2K Krom, Sulu Boya, Neon), Duvar Kağıdı Setini, Widget ve Hue Blend özelliklerini açın.'}
          </Text>
          {!isPremium && (
            <Pressable style={styles.upgradeButton} onPress={togglePremium}>
              <Text style={styles.upgradeButtonText}>Hueday+\'ı Dene</Text>
            </Pressable>
          )}
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Bildirimler</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Günlük Akşam Hatırlatıcısı</Text>
              <Text style={styles.rowSub}>Saat 21:00\'de günün rengini sorar.</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Veri ve Gizlilik</Text>
          <Pressable style={styles.dangerRow} onPress={handleResetData}>
            <Text style={styles.dangerText}>Tüm Verileri Sıfırla</Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.aboutContainer}>
          <Text style={styles.appName}>hueday</Text>
          <Text style={styles.appVersion}>Sürüm 1.0.0 (v57.0.0)</Text>
          <Text style={styles.appQuote}>"Her günün bir rengi var."</Text>
        </View>
      </ScrollView>
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
});
