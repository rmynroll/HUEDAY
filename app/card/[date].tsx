import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

import DayCard from '@/components/DayCard';
import { Text, View } from '@/components/Themed';
import { useHuedayStore } from '@/lib/storage';

export default function CardScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const card = useHuedayStore((s) => (date ? s.cards[date] : undefined));
  const isPremium = useHuedayStore((s) => s.isPremium);
  const togglePremium = useHuedayStore((s) => s.togglePremium);

  const viewShotRef = useRef<React.ElementRef<typeof ViewShot>>(null);
  const wallpaperShotRef = useRef<React.ElementRef<typeof ViewShot>>(null);

  const [sharing, setSharing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showSameVibeModal, setShowSameVibeModal] = useState(false);
  const [generatingWallpaper, setGeneratingWallpaper] = useState(false);

  // Determine if there is a simulated "same vibe" match (mood-based)
  const hasSameVibe = useMemo(() => {
    if (!card) return false;
    // Simulate vibe match if mood is in a mid-to-high range (e.g. 0.4 to 0.8)
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
        // Fallback for Web/Simulators
        if (Platform.OS === 'web') {
          const link = document.createElement('a');
          link.download = `hueday-card-${date}.png`;
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
          link.download = `hueday-wallpaper-${date}.png`;
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

  if (!card) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Gün Kartı' }} />
        <Text style={styles.emptyText}>Bu gün için henüz bir kart yok.</Text>
      </View>
    );
  }

  const wallpaperGradientId = `wall-grad-${card.date}`;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Stack.Screen options={{ title: 'Gün Kartı' }} />

      {/* Same Vibe Banner */}
      {hasSameVibe && (
        <Pressable
          style={styles.sameVibeBanner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setShowSameVibeModal(true);
          }}
        >
          <Text style={styles.sameVibeText}>💫 Deniz ile Aynı Vibe'dasınız! Eşleşmeyi Gör</Text>
        </Pressable>
      )}

      {/* Day Card View */}
      <ViewShot ref={viewShotRef} style={styles.cardWrapper} options={{ format: 'png', quality: 1 }}>
        <DayCard card={card} />
      </ViewShot>

      {/* Interactive Actions */}
      <View style={styles.actionsContainer}>
        <Pressable style={styles.primaryButton} onPress={handleShare} disabled={sharing}>
          <Text style={styles.primaryButtonText}>{sharing ? 'Hazırlanıyor…' : 'Story Olarak Paylaş'}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleWallpaperPress}>
          <Text style={styles.secondaryButtonText}>📱 Duvar Kağıdı Seti Oluştur</Text>
        </Pressable>
      </View>

      {/* Wallpaper Preview Modal */}
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
            {/* Background Gradient */}
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id={wallpaperGradientId} x1="0" y1="0" x2="1" y2="1">
                  {card.palette.map((hex, i) => (
                    <Stop
                      key={hex + i}
                      offset={`${(i / Math.max(card.palette.length - 1, 1)) * 100}%`}
                      stopColor={hex}
                    />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${wallpaperGradientId})`} />
            </Svg>

            {/* Lock Screen UI Overlays */}
            <View style={styles.wallpaperOverlay}>
              <View style={styles.wallpaperHeader}>
                <Text style={styles.lockClock}>09:41</Text>
                <Text style={styles.lockDate}>
                  {format(parseISO(card.date), 'EEEE, d MMMM', { locale: tr })}
                </Text>
              </View>

              <View style={styles.wallpaperFooter}>
                <Text style={styles.wallpaperQuote}>"{card.phrase}"</Text>
                <Text style={styles.wallpaperLogo}>hueday</Text>
              </View>
            </View>
          </ViewShot>

          {/* Controls */}
          <View style={styles.wallpaperControls}>
            <Pressable
              style={styles.wallpaperShareButton}
              onPress={handleShareWallpaper}
              disabled={generatingWallpaper}
            >
              <Text style={styles.wallpaperShareButtonText}>
                {generatingWallpaper ? 'Kaydediliyor…' : 'Duvar Kağıdını Kaydet / Paylaş'}
              </Text>
            </Pressable>
            <Pressable style={styles.wallpaperCloseButton} onPress={() => setShowWallpaperModal(false)}>
              <Text style={styles.wallpaperCloseButtonText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Same Vibe Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSameVibeModal}
        onRequestClose={() => setShowSameVibeModal(false)}
      >
        <View style={styles.vibeModalOverlay}>
          <View style={styles.vibeModalContent}>
            <Text style={styles.vibeTitle}>Bugün Aynı Vibe'dasınız! 💫</Text>
            <Text style={styles.vibeSubtitle}>
              Senin ve Deniz'in ruh hali bugün birbirine çok benziyor. İşte ortak estetiğiniz:
            </Text>

            <View style={styles.vibeCardsRow}>
              <View style={styles.vibeCardMini}>
                <Text style={styles.vibeCardOwner}>Senin Kartın</Text>
                <View style={styles.miniCardContainer}>
                  <DayCard card={card} />
                </View>
              </View>

              <View style={styles.vibeCardMini}>
                <Text style={styles.vibeCardOwner}>Deniz'in Kartı</Text>
                <View style={styles.miniCardContainer}>
                  <DayCard
                    card={{
                      ...card,
                      palette: [card.palette[1] || card.palette[0], card.palette[2] || card.palette[0], '#FFFFFF'],
                      phrase: 'Uyumlu bir enerji.',
                      seed: card.seed + 1,
                    }}
                  />
                </View>
              </View>
            </View>

            <Pressable style={styles.vibeCloseButton} onPress={() => setShowSameVibeModal(false)}>
              <Text style={styles.vibeCloseButtonText}>Harika</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  cardWrapper: {
    width: '85%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 24,
  },
  sameVibeBanner: {
    backgroundColor: '#E6F4FE',
    borderWidth: 1,
    borderColor: '#B3DDFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },
  sameVibeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsContainer: {
    width: '85%',
    maxWidth: 340,
    gap: 12,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#8A8A8E',
  },

  // Wallpaper Modal styling
  wallpaperModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  wallpaperCaptureArea: {
    flex: 1,
    width: '100%',
  },
  wallpaperOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 80 : 50,
    paddingBottom: 60,
    paddingHorizontal: 30,
    backgroundColor: 'transparent',
  },
  wallpaperHeader: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  lockClock: {
    fontSize: 74,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  lockDate: {
    fontSize: 20,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  wallpaperFooter: {
    alignItems: 'center',
    gap: 20,
    backgroundColor: 'transparent',
  },
  wallpaperQuote: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  wallpaperLogo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    opacity: 0.6,
    letterSpacing: 2,
  },
  wallpaperControls: {
    padding: 24,
    backgroundColor: '#1C1C1E',
    gap: 12,
  },
  wallpaperShareButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  wallpaperShareButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  wallpaperCloseButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  wallpaperCloseButtonText: {
    color: '#8A8A8E',
    fontSize: 14,
    fontWeight: '600',
  },

  // Same Vibe Modal Styling
  vibeModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 24,
  },
  vibeModalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  vibeTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  vibeSubtitle: {
    color: '#8A8A8E',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  vibeCardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  vibeCardMini: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  vibeCardOwner: {
    color: '#E5E5EA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  miniCardContainer: {
    width: '100%',
    aspectRatio: 100 / 178,
  },
  vibeCloseButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  vibeCloseButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },

  // Generic Hueday+ modal styles (same as index)
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
