import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, ScrollView, StyleSheet } from 'react-native';
import { format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';

import DayCard from '@/components/DayCard';
import OpeningCeremonyModal from '@/components/OpeningCeremonyModal';
import WaxSealSvg from '@/components/WaxSealSvg';
import { Text, View } from '@/components/Themed';
import { calculateDaysRemaining, getEnvelopeAgingStage } from '@/lib/capsule';
import { getDateFnsLocale } from '@/lib/i18n';
import { useHuedayStore, todayKey } from '@/lib/storage';
import { getAllPossibleEventsForYear } from '@/lib/specialEvents';
import type { TimeCapsule } from '@/types/capsule';
import type { SpecialCategory, SpecialEvent } from '@/types/specialEvents';

const CATEGORY_FILTERS: { id: SpecialCategory | 'all'; i18nKey: string }[] = [
  { id: 'all', i18nKey: 'album.filters.all' },
  { id: 'seasonal', i18nKey: 'album.filters.seasonal' },
  { id: 'astronomical', i18nKey: 'album.filters.astronomical' },
  { id: 'personal', i18nKey: 'album.filters.personal' },
  { id: 'weather', i18nKey: 'album.filters.weather' },
];

export default function AlbumScreen() {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const cards = useHuedayStore((s) => s.cards || {});
  const userProfile = useHuedayStore((s) => s.userProfile);
  const capsules = useHuedayStore((s) => s.capsules || {});
  const sealTimeCapsule = useHuedayStore((s) => s.sealTimeCapsule);

  const [activeSegment, setActiveSegment] = useState<'cards' | 'capsules'>('cards');
  const [activeCategory, setActiveCategory] = useState<SpecialCategory | 'all'>('all');
  const [selectedCapsuleForOpening, setSelectedCapsuleForOpening] = useState<TimeCapsule | null>(null);

  // Shake animation map for locked envelopes
  const shakeAnims = useRef<Record<string, Animated.Value>>({}).current;
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const todayStr = todayKey();

  const getShakeAnim = (id: string) => {
    if (!shakeAnims[id]) {
      shakeAnims[id] = new Animated.Value(0);
    }
    return shakeAnims[id];
  };

  const triggerEnvelopeShake = (capsule: TimeCapsule) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveTooltipId(capsule.id);

    const anim = getShakeAnim(capsule.id);
    Animated.sequence([
      Animated.timing(anim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -4, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 3, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -3, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => setActiveTooltipId(null), 2500);
    });
  };

  // Card collection lists
  const earnedRareCards = useMemo(() => {
    return Object.values(cards).filter((c) => c.primaryEvent || c.rarity);
  }, [cards]);

  const allPossibleYearEvents = useMemo(() => {
    return getAllPossibleEventsForYear(currentYear, userProfile);
  }, [currentYear, userProfile]);

  const albumItems = useMemo(() => {
    const earnedDatesMap = new Map<string, (typeof earnedRareCards)[0]>();
    earnedRareCards.forEach((c) => earnedDatesMap.set(c.date, c));

    const items: {
      type: 'earned' | 'upcoming';
      event: SpecialEvent;
      card?: (typeof earnedRareCards)[0];
    }[] = [];

    earnedRareCards.forEach((card) => {
      if (card.primaryEvent) {
        items.push({ type: 'earned', event: card.primaryEvent, card });
      }
    });

    allPossibleYearEvents.forEach((ev) => {
      if (ev.date >= todayStr && !earnedDatesMap.has(ev.date)) {
        items.push({ type: 'upcoming', event: ev });
      }
    });

    if (activeCategory !== 'all') {
      return items.filter((item) => item.event.category === activeCategory);
    }

    return items;
  }, [earnedRareCards, allPossibleYearEvents, todayStr, activeCategory]);

  const progressPercent = useMemo(() => {
    const totalPossible = allPossibleYearEvents.length || 1;
    const earnedCount = earnedRareCards.length;
    return Math.min(100, Math.round((earnedCount / totalPossible) * 100));
  }, [allPossibleYearEvents, earnedRareCards]);

  // Capsules lists
  const capsuleList = useMemo(() => {
    return Object.values(capsules).sort((a, b) => b.sealedDate.localeCompare(a.sealedDate));
  }, [capsules]);

  const pendingCapsules = useMemo(() => {
    return capsuleList.filter((c) => !c.isOpened);
  }, [capsuleList]);

  const openedCapsules = useMemo(() => {
    return capsuleList.filter((c) => c.isOpened);
  }, [capsuleList]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header & Segment Control */}
      <View style={styles.headerBox}>
        <Text style={styles.title}>{t('album.title')}</Text>

        <View style={styles.segmentSwitcher}>
          <Pressable
            style={[styles.segmentBtn, activeSegment === 'cards' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('cards')}
          >
            <Text style={[styles.segmentBtnText, activeSegment === 'cards' && styles.segmentBtnTextActive]}>
              {t('album.cardsSegment')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, activeSegment === 'capsules' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('capsules')}
          >
            <Text style={[styles.segmentBtnText, activeSegment === 'capsules' && styles.segmentBtnTextActive]}>
              {t('album.capsulesSegment')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* SEGMENT 1: CARD COLLECTION */}
      {activeSegment === 'cards' && (
        <>
          <View style={styles.progressCard}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressLabel}>{t('album.yearCollection', { year: currentYear })}</Text>
              <Text style={styles.progressValue}>%{progressPercent}</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressStats}>
              {t('album.rareCardsProgress', { earned: earnedRareCards.length, total: allPossibleYearEvents.length })}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORY_FILTERS.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                    {t(cat.i18nKey)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.grid}>
            {albumItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>{t('album.emptyCategory')}</Text>
              </View>
            ) : (
              albumItems.map((item, idx) => {
                if (item.type === 'earned' && item.card) {
                  return (
                    <Pressable
                      key={item.event.id + idx}
                      style={styles.cardItem}
                      onPress={() => router.push(`/card/${item.card!.date}`)}
                    >
                      <View style={styles.miniCardWrapper}>
                        <DayCard card={item.card} />
                      </View>
                      <View style={styles.itemMeta}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.event.title}
                        </Text>
                        <Text style={styles.itemDate}>
                          {format(parseISO(item.event.date), 'd MMMM yyyy', { locale })}
                        </Text>
                      </View>
                    </Pressable>
                  );
                }

                return (
                  <View key={item.event.id + idx} style={[styles.cardItem, styles.silhouetteItem]}>
                    <View style={styles.silhouetteCard}>
                      <Text style={styles.silhouetteLockIcon}>🔒</Text>
                      <Text style={styles.silhouetteBadgeIcon}>{item.event.badgeIcon}</Text>
                      <Text style={styles.silhouetteHint}>{t('album.upcomingEvent')}</Text>
                    </View>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemTitleSilhouette} numberOfLines={1}>
                        {item.event.title}
                      </Text>
                      <Text style={styles.itemDate}>
                        {format(parseISO(item.event.date), 'd MMMM yyyy', { locale })}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}

      {/* SEGMENT 2: TIME CAPSULES */}
      {activeSegment === 'capsules' && (
        <View style={styles.capsulesContainer}>
          {capsuleList.length === 0 ? (
            <View style={styles.emptyCapsuleIntro}>
              <Text style={styles.emptyCapsuleIcon}>📜</Text>
              <Text style={styles.emptyCapsuleTitle}>{t('album.capsuleEmptyTitle')}</Text>
              <Text style={styles.emptyCapsuleDesc}>
                {t('album.capsuleEmptyDesc')}
              </Text>
              <Pressable style={styles.createCapsuleBtn} onPress={() => router.push('/')}>
                <Text style={styles.createCapsuleBtnText}>{t('album.capsuleEmptyButton')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Bekleyen Kapsüller (Pending Envelopes) */}
              <Text style={styles.sectionHeading}>{t('album.pendingCapsules', { count: pendingCapsules.length })}</Text>

              <View style={styles.grid}>
                {pendingCapsules.map((capsule) => {
                  const daysLeft = calculateDaysRemaining(capsule.openDate, todayStr);
                  const isReady = daysLeft <= 0;
                  const agingStage = getEnvelopeAgingStage(capsule.sealedDate, todayStr);
                  const shakeAnim = getShakeAnim(capsule.id);
                  const showTooltip = activeTooltipId === capsule.id;
                  const isLastWeek = daysLeft > 0 && daysLeft <= 7;

                  return (
                    <View key={capsule.id} style={styles.envelopeCardItem}>
                      {showTooltip && (
                        <View style={styles.tooltipBox}>
                          <Text style={styles.tooltipText}>{t('album.openingIn', { days: daysLeft })}</Text>
                        </View>
                      )}

                      <Animated.View style={{ transform: [{ rotate: shakeAnim.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) }] }}>
                        <Pressable
                          style={[
                            styles.envelopeBox,
                            agingStage === 'aged' && styles.envelopeAged,
                            agingStage === 'ancient' && styles.envelopeAncient,
                            isReady && styles.envelopeReadyGlow,
                            isLastWeek && { borderColor: capsule.sealColor, borderWidth: 2 },
                          ]}
                          onPress={() => {
                            if (isReady) {
                              setSelectedCapsuleForOpening(capsule);
                            } else {
                              triggerEnvelopeShake(capsule);
                            }
                          }}
                        >
                          <WaxSealSvg color={capsule.sealColor} motif={capsule.sealMotif} initial={capsule.userInitial} size={54} />

                          <Text style={styles.envelopeDateLabel}>
                            {format(parseISO(capsule.sealedDate), 'd MMMM yyyy', { locale })}
                          </Text>

                          {isReady ? (
                            <View style={styles.readyBadge}>
                              <Text style={styles.readyBadgeText}>{t('album.readyNow')}</Text>
                            </View>
                          ) : (
                            <Text style={styles.daysLeftText}>{t('album.daysLeft', { days: daysLeft })}</Text>
                          )}
                        </Pressable>
                      </Animated.View>
                    </View>
                  );
                })}
              </View>

              {/* Açılmış Kapsüller Zinciri (Opened Chain View) */}
              {openedCapsules.length > 0 && (
                <View style={styles.chainSection}>
                  <Text style={styles.sectionHeading}>{t('album.openedChain')}</Text>
                  <View style={styles.chainTimeline}>
                    {openedCapsules.map((cap, idx) => (
                      <View key={cap.id} style={styles.chainNodeRow}>
                        <View style={[styles.nodeDot, { backgroundColor: cap.sealColor }]} />
                        {idx < openedCapsules.length - 1 && <View style={styles.chainLine} />}
                        <View style={styles.nodeMetaBox}>
                          <Text style={styles.nodeDateText}>
                            {format(parseISO(cap.sealedDate), 'd MMMM yyyy', { locale })} → {format(parseISO(cap.openDate), 'yyyy')}
                          </Text>
                          <Text style={styles.nodeTitleText}>
                            {t('album.sealedAndOpened')} {cap.parentCapsuleId ? t('album.replyCapsuleTag') : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Opening Ceremony Modal */}
      <OpeningCeremonyModal
        visible={selectedCapsuleForOpening !== null}
        capsule={selectedCapsuleForOpening}
        onClose={() => setSelectedCapsuleForOpening(null)}
        onReplyRequested={async (parentId, replyText) => {
          await sealTimeCapsule(todayStr, replyText, 'K', parentId);
          setSelectedCapsuleForOpening(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#FAF9F6',
  },
  headerBox: {
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  segmentSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8E',
  },
  segmentBtnTextActive: {
    color: '#1C1C1E',
    fontWeight: '800',
  },
  progressCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    gap: 10,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FDE047',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FDE047',
    borderRadius: 5,
  },
  progressStats: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipSelected: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardItem: {
    width: '47%',
    gap: 8,
  },
  miniCardWrapper: {
    width: '100%',
    aspectRatio: 100 / 178,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemMeta: {
    gap: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  itemTitleSilhouette: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8E',
  },
  itemDate: {
    fontSize: 11,
    color: '#8A8A8E',
    fontWeight: '500',
  },
  silhouetteItem: {
    opacity: 0.85,
  },
  silhouetteCard: {
    width: '100%',
    aspectRatio: 100 / 178,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    borderWidth: 2,
    borderColor: '#D1D1D6',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  silhouetteLockIcon: {
    fontSize: 20,
  },
  silhouetteBadgeIcon: {
    fontSize: 28,
  },
  silhouetteHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8A8E',
    textTransform: 'uppercase',
  },
  emptyState: {
    width: '100%',
    padding: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8A8A8E',
  },
  capsulesContainer: {
    gap: 20,
  },
  emptyCapsuleIntro: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
  },
  emptyCapsuleIcon: {
    fontSize: 40,
  },
  emptyCapsuleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  emptyCapsuleDesc: {
    fontSize: 13,
    color: '#8A8A8E',
    textAlign: 'center',
    lineHeight: 18,
  },
  createCapsuleBtn: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 6,
  },
  createCapsuleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  envelopeCardItem: {
    width: '47%',
    position: 'relative',
  },
  tooltipBox: {
    position: 'absolute',
    top: -32,
    alignSelf: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 10,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  envelopeBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  envelopeAged: {
    backgroundColor: '#FAF6EE',
    borderColor: '#E6DEC9',
  },
  envelopeAncient: {
    backgroundColor: '#F3E9D2',
    borderColor: '#D4C3A3',
    borderRadius: 24,
  },
  envelopeReadyGlow: {
    borderColor: '#FDE047',
    borderWidth: 3,
  },
  envelopeDateLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A8A8E',
  },
  daysLeftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  readyBadge: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  readyBadgeText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
  },
  chainSection: {
    marginTop: 16,
    gap: 12,
  },
  chainTimeline: {
    paddingLeft: 12,
    gap: 20,
  },
  chainNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
  },
  nodeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  chainLine: {
    position: 'absolute',
    left: 6,
    top: 14,
    width: 2,
    height: 28,
    backgroundColor: '#D1D1D6',
  },
  nodeMetaBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  nodeDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A8E',
  },
  nodeTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 2,
  },
});
