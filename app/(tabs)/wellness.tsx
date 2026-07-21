import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Easing,
  View as RNView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from '@/components/Themed';
import { useHuedayStore, todayKey } from '@/lib/storage';
import { getDominantEmotion, MOOD_MUSIC_MAP } from '@/lib/spotify';
import type { DayCard, ColorMoodEmotion } from '@/types/card';
import * as Haptics from 'expo-haptics';

// Breathing phases for box breathing
type BreathingPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export default function WellnessScreen() {
  const { t } = useTranslation();
  const cards = useHuedayStore((s) => s.cards || {});
  const cardList = Object.values(cards);

  // 1. Get today's or most recent card
  const todayDate = todayKey();
  const currentCard = cards[todayDate] || (cardList.length > 0 ? cardList[cardList.length - 1] : null);
  const currentEmotion = currentCard ? getDominantEmotion(currentCard) : 'calm';

  // 2. State for Breathing Exercise
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('inhale');
  const [breathTimer, setBreathTimer] = useState(4);
  const breatheAnim = useRef(new Animated.Value(1)).current; // For visual circle breathing scaling
  const timerRef = useRef<any>(null);

  // 3. State for "Scream/Vent" Box (Anger)
  const [ventText, setVentText] = useState('');
  const [isVented, setIsVented] = useState(false);

  // 4. Aura Breathing Animation Refs
  const auraScale = useRef(new Animated.Value(1)).current;
  const auraOpacity = useRef(new Animated.Value(0.4)).current;

  // Statistics calculation
  const totalDays = cardList.length;
  const emotionCounts = cardList.reduce((acc, card) => {
    const emo = getDominantEmotion(card);
    acc[emo] = (acc[emo] || 0) + 1;
    return acc;
  }, {} as Record<ColorMoodEmotion, number>);

  // Aura breathing loop animation (Inhale/Exhale 4s each)
  useEffect(() => {
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(auraScale, {
          toValue: 1.4,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auraScale, {
          toValue: 1.0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const opacityAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(auraOpacity, {
          toValue: 0.75,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auraOpacity, {
          toValue: 0.35,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    scaleAnim.start();
    opacityAnim.start();

    return () => {
      scaleAnim.stop();
      opacityAnim.stop();
    };
  }, [auraScale, auraOpacity]);

  // Breathing Box Cycle Logic
  useEffect(() => {
    if (breathingActive) {
      // Setup interval timer
      timerRef.current = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev <= 1) {
            // Transition to next phase
            setBreathingPhase((currentPhase) => {
              let nextPhase: BreathingPhase = 'inhale';
              let targetScale = 1;

              if (currentPhase === 'inhale') {
                nextPhase = 'holdIn';
                targetScale = 1.6; // Keep expanded
              } else if (currentPhase === 'holdIn') {
                nextPhase = 'exhale';
                targetScale = 1.0; // Shrink
              } else if (currentPhase === 'exhale') {
                nextPhase = 'holdOut';
                targetScale = 1.0; // Keep shrunk
              } else if (currentPhase === 'holdOut') {
                nextPhase = 'inhale';
                targetScale = 1.6; // Expand
              }

              // Animate visual circle
              Animated.timing(breatheAnim, {
                toValue: targetScale,
                duration: 4000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }).start();

              return nextPhase;
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            return 4; // Reset to 4 seconds
          }
          return prev - 1;
        });
      }, 1000);

      // Start initial animation
      Animated.timing(breatheAnim, {
        toValue: 1.6,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setBreathTimer(4);
      setBreathingPhase('inhale');
      breatheAnim.setValue(1);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [breathingActive]);

  const handleStartBreathing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBreathingActive(!breathingActive);
  };

  const handleVentRelease = () => {
    if (!ventText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsVented(true);
    setVentText('');
    setTimeout(() => {
      setIsVented(false);
    }, 3000);
  };

  // Get localized info or fallbacks
  const getBreathingLabel = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Nefes Al...';
      case 'holdIn': return 'Nefesini Tut...';
      case 'exhale': return 'Nefes Ver...';
      case 'holdOut': return 'Boşta Bekle...';
    }
  };

  const currentAccent = MOOD_MUSIC_MAP[currentEmotion]?.accentColor || '#6FBF73';

  // Static emotional suggestions database
  const suggestions = {
    joy: {
      quote: "Mutluluk paylaşıldıkça çoğalır. Bugün bu güzel enerjiyi çevrendekilere de hissettirmeyi unutma!",
      affirmation: "Bugün içimdeki neşe ve canlılık çevremdeki her şeyi aydınlatıyor.",
      activity: "Günün enerjisini kutlamak için hızlıca bir anı fotoğrafı çekebilir veya sevdiğin birine teşekkür mesajı atabilirsin."
    },
    excitement: {
      quote: "İçindeki kıvılcım büyük işlerin başlangıcıdır. Bu yüksek motivasyonu yaratıcılığa dönüştür!",
      affirmation: "Önümdeki tüm heyecan verici olasılıklara ve başarılara hazırım.",
      activity: "Aklına gelen yeni fikirleri hemen ajanda sayfana yaz ve bugün bir adım at!"
    },
    sadness: {
      quote: "Hüzün de mevsimler gibidir; gelir, toprağı besler ve vakti geldiğinde yerini bahara bırakır. Kendine karşı nazik ol.",
      affirmation: "Tüm duygularımı kabul ediyorum ve kendime iyileşmek için zaman tanıyorum.",
      activity: "Sıcak bir içecek hazırla, kendini güvende hissettiğin bir alanda derin dinlenmeye geç."
    },
    anger: {
      quote: "Öfke güçlü bir rüzgardır, ancak onu yönlendirmeyi bilirsen yelkenlerini doldurabilir.",
      affirmation: "Öfkemi fark ediyorum, onu serbest bırakıyor ve içsel huzurumu koruyorum.",
      activity: "Düşüncelerini aşağıdaki kutuya dökerek serbest bırak. Veya fiziksel bir yürüyüşe çıkıp enerjiyi dağıt."
    },
    anxiety: {
      quote: "Geleceğin kontrolünü elinde tutamazsın, ama şu anki nefesini kontrol edebilirsin. Güvendesin.",
      affirmation: "Buradayım, şimdideyim ve güvendeyim. Her şey yoluna giriyor.",
      activity: "Aşağıdaki Kutu Nefesi egzersizini en az 2 dakika boyunca uygulayarak zihnini sakinleştir."
    },
    calm: {
      quote: "Sakin bir zihin, tüm fırtınaların ortasında parlayan sarsılmaz bir deniz feneridir.",
      affirmation: "Zihnim berrak, bedenim dengede ve ruhum huzurlu.",
      activity: "Bugün seni huzurlu hissettiren 3 küçük detayı düşün ve minnettarlık duy."
    }
  };

  const currentSuggestion = suggestions[currentEmotion] || suggestions.calm;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.heading}>🧘 Duygu Rehberi & Aura</Text>
      <Text style={styles.subheading}>Renklerinizden süzülen istatistikler ve günün rehberliği.</Text>

      {/* 0. BREATHING AURA ORB CARD */}
      <View style={styles.auraCard}>
        <View style={styles.auraContainer}>
          {/* Pulsing Aura Light background glow circles */}
          <Animated.View
            style={[
              styles.auraGlowCircle,
              {
                transform: [{ scale: auraScale }],
                opacity: auraOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={['#E24B4A', '#5B9BD5', '#6FBF73', '#F5C445']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.auraInnerCircle,
              {
                transform: [
                  {
                    scale: auraScale.interpolate({
                      inputRange: [1, 1.4],
                      outputRange: [0.75, 0.95],
                    }),
                  },
                ],
                opacity: Animated.multiply(auraOpacity, 1.3),
              },
            ]}
          >
            <LinearGradient
              colors={['#F5C445', '#E24B4A', '#5B9BD5', '#6FBF73']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            />
          </Animated.View>
          {/* Central glassy orb */}
          <View style={[styles.auraOrb, { borderColor: 'rgba(255, 255, 255, 0.4)' }]}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            />
          </View>
        </View>
        <Text style={styles.auraTitle}>Ruhunuzun Ritmi</Text>
        <Text style={styles.auraSubtitle}>Zihninizi dinginleştirmek için auranın nefes alma ritmine odaklanın.</Text>
      </View>

      {/* 1. EMOTION STATISTICS SECTION */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>📊 Duygu İstatistikleriniz</Text>
        {totalDays === 0 ? (
          <Text style={styles.emptyText}>Henüz gün kartı oluşturulmamış. İstatistikleriniz burada listelenecektir.</Text>
        ) : (
          <View style={styles.statsContainer}>
            <Text style={styles.totalDaysText}>Toplam Kaydedilen Gün: <Text style={styles.highlightText}>{totalDays}</Text></Text>
            
            <View style={styles.barChart}>
              {(Object.keys(MOOD_MUSIC_MAP) as ColorMoodEmotion[]).map((emo) => {
                const count = emotionCounts[emo] || 0;
                const percentage = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
                const meta = MOOD_MUSIC_MAP[emo];

                return (
                  <View key={emo} style={styles.barRow}>
                    <RNView style={[styles.barIndicator, { backgroundColor: meta.accentColor }]} />
                    <Text style={styles.barLabel}>
                      {t(`colorMood.emotions.${emo}`, { defaultValue: emo })}
                    </Text>
                    <View style={styles.barTrack}>
                      <RNView style={[styles.barFill, { width: `${percentage}%`, backgroundColor: meta.accentColor }]} />
                    </View>
                    <Text style={styles.barPercent}>%{percentage}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* 2. DYNAMIC RECOMMENDATION SECTION */}
      <View style={[styles.sectionCard, { borderColor: currentAccent + '40', backgroundColor: currentAccent + '05' }]}>
        <View style={styles.recommendationHeader}>
          <Text style={styles.cardTitle}>✨ Günün Duygu Rehberi</Text>
          <Text style={[styles.emotionBadge, { backgroundColor: currentAccent + '20', color: '#1C1C1E' }]}>
            {t(`colorMood.emotions.${currentEmotion}`, { defaultValue: currentEmotion })}
          </Text>
        </View>

        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>"{currentSuggestion.quote}"</Text>
        </View>

        <View style={styles.affirmationBox}>
          <Text style={styles.affirmationLabel}>Bugünün Olumlaması:</Text>
          <Text style={styles.affirmationText}>{currentSuggestion.affirmation}</Text>
        </View>

        <View style={styles.divider} />
        
        <Text style={styles.activityLabel}>Önerilen Aktivite / Uygulama:</Text>
        <Text style={styles.activityText}>• {currentSuggestion.activity}</Text>

        {/* ANXIETY (Breathing Exercise Widget) */}
        {currentEmotion === 'anxiety' && (
          <View style={styles.breathingCard}>
            <Text style={styles.breathingTitle}>💨 Kutu Nefesi Egzersizi</Text>
            <Text style={styles.breathingDesc}>Kaygıyı azaltmak ve sinir sistemini dengelemek için idealdir.</Text>

            <View style={styles.animationArea}>
              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    borderColor: currentAccent,
                    transform: [{ scale: breatheAnim }],
                    backgroundColor: breathingActive ? currentAccent + '15' : 'transparent',
                  },
                ]}
              >
                {breathingActive ? (
                  <View style={styles.breathingLabelBox}>
                    <Text style={styles.breathTimeText}>{breathTimer}s</Text>
                    <Text style={styles.breathLabelText}>{getBreathingLabel()}</Text>
                  </View>
                ) : (
                  <Text style={styles.startEmoji}>🧘</Text>
                )}
              </Animated.View>
            </View>

            <Pressable
              style={[styles.breathingBtn, { backgroundColor: breathingActive ? '#E24B4A' : currentAccent }]}
              onPress={handleStartBreathing}
            >
              <Text style={styles.breathingBtnText}>
                {breathingActive ? 'Egzersizi Durdur' : 'Egzersize Başla (4s Döngü)'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ANGER (Venting scream box) */}
        {currentEmotion === 'anger' && (
          <View style={styles.ventCard}>
            <Text style={styles.ventTitle}>💥 Öfkeni Buraya Dök</Text>
            <Text style={styles.ventDesc}>İçindeki kızgınlığı, yargılamadan bu kutuya yaz ve havaya uçur.</Text>

            <TextInput
              style={styles.ventInput}
              multiline
              numberOfLines={4}
              placeholder="Seni öfkelendiren şeyi buraya sınırsızca yazabilirsin..."
              placeholderTextColor="#8A8A8E"
              value={ventText}
              onChangeText={setVentText}
            />

            <Pressable style={styles.ventBtn} onPress={handleVentRelease}>
              <Text style={styles.ventBtnText}>🔥 Serbest Bırak ve Uçur!</Text>
            </Pressable>

            {isVented && (
              <View style={styles.ventGlowBox}>
                <Text style={styles.ventGlowText}>✨ Öfkeniz havaya uçtu ve serbest bırakıldı. Derin bir nefes alın. ✨</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 40,
    gap: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  subheading: {
    fontSize: 13,
    color: '#8A8A8E',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 12,
    color: '#8A8A8E',
    textAlign: 'center',
    paddingVertical: 12,
  },
  statsContainer: {
    backgroundColor: 'transparent',
    gap: 16,
  },
  totalDaysText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636366',
  },
  highlightText: {
    fontWeight: '800',
    color: '#1C1C1E',
  },
  barChart: {
    backgroundColor: 'transparent',
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  barIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A3A3C',
    width: 70,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A8E',
    width: 32,
    textAlign: 'right',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  emotionBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  quoteBox: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#636366',
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#3A3A3C',
    lineHeight: 18,
  },
  affirmationBox: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  affirmationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A8E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  affirmationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 12,
  },
  activityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A8E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activityText: {
    fontSize: 13,
    color: '#3A3A3C',
    lineHeight: 18,
  },
  breathingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  breathingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  breathingDesc: {
    fontSize: 11,
    color: '#8A8A8E',
    textAlign: 'center',
    marginBottom: 8,
  },
  animationArea: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  breathingCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingLabelBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  breathTimeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  breathLabelText: {
    fontSize: 6,
    fontWeight: '700',
    color: '#636366',
    textAlign: 'center',
    marginTop: 1,
    width: 45,
  },
  startEmoji: {
    fontSize: 24,
  },
  breathingBtn: {
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  breathingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginTop: 16,
    gap: 8,
  },
  ventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  ventDesc: {
    fontSize: 11,
    color: '#8A8A8E',
    marginBottom: 4,
  },
  ventInput: {
    borderColor: '#E5E5EA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1C1C1E',
    backgroundColor: '#FAF9F6',
    textAlignVertical: 'top',
    height: 90,
  },
  ventBtn: {
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ventBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ventGlowBox: {
    backgroundColor: '#E6F4FE',
    borderColor: '#BEE3F8',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  ventGlowText: {
    fontSize: 11,
    color: '#1A365D',
    fontWeight: '600',
    textAlign: 'center',
  },
  auraCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  auraContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  auraGlowCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  auraInnerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  auraOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  gradientFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
  },
  auraTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  auraSubtitle: {
    fontSize: 12,
    color: '#8A8A8E',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
