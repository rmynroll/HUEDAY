import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { Text, View } from '@/components/Themed';
import { getDateFnsLocale } from '@/lib/i18n';
import { useHuedayStore } from '@/lib/storage';

const FRIEND_VIBES = {
  'Deniz': { color: '#3FAE7A', emoji: '🌿', vibeI18nKey: 'friendReplies.deniz.vibe' },
  'Elif': { color: '#E03F8A', emoji: '💫', vibeI18nKey: 'friendReplies.elif.vibe' },
  'Merve': { color: '#8F3FE0', emoji: '🔮', vibeI18nKey: 'friendReplies.merve.vibe' },
};

export default function ChatsListScreen() {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const chats = useHuedayStore((s) => s.chats);
  const streaks = useHuedayStore((s) => s.streaks);

  const friends = Object.keys(chats);

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return formatDistanceToNow(parseISO(isoString), { locale, addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>{t('chatsList.heading')}</Text>
        <Text style={styles.subheading}>{t('chatsList.subheading')}</Text>

        <View style={styles.list}>
          {friends.map((friend) => {
            const friendMessages = chats[friend] || [];
            const lastMessage = friendMessages[friendMessages.length - 1];
            const streak = streaks[friend] || 0;
            const vibeInfo = FRIEND_VIBES[friend as keyof typeof FRIEND_VIBES] || { color: '#8A8A8E', emoji: '✨', vibeI18nKey: 'friendReplies.unknown.vibe' };

            return (
              <Pressable
                key={friend}
                style={styles.chatRow}
                onPress={() => router.push(`/chat/${friend}`)}
              >
                {/* Vibe Status Circle Indicator */}
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatarGlow, { backgroundColor: vibeInfo.color }]} />
                  <Text style={styles.avatarText}>{vibeInfo.emoji}</Text>
                </View>

                {/* Chat details */}
                <View style={styles.chatDetails}>
                  <View style={styles.chatRowHeader}>
                    <Text style={styles.friendName}>{friend}</Text>
                    <Text style={styles.timeText}>
                      {lastMessage ? getRelativeTime(lastMessage.timestamp) : ''}
                    </Text>
                  </View>

                  <View style={styles.vibeStatusRow}>
                    <View style={[styles.vibePill, { backgroundColor: `${vibeInfo.color}15` }]}>
                      <Text style={[styles.vibePillText, { color: vibeInfo.color }]}>
                        {t(vibeInfo.vibeI18nKey)}
                      </Text>
                    </View>
                    
                    {streak > 0 && (
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakText}>🔥 {streak}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.lastMessageText} numberOfLines={1}>
                    {lastMessage
                      ? (lastMessage.sender === 'user' ? t('chatsList.youPrefix') : '') + lastMessage.text
                      : t('chatsList.noMessages')}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 72,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  subheading: {
    fontSize: 13,
    color: '#8A8A8E',
    marginTop: 4,
    marginBottom: 24,
  },
  list: {
    gap: 16,
    backgroundColor: 'transparent',
  },
  chatRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F3',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    opacity: 0.2,
  },
  avatarText: {
    fontSize: 22,
  },
  chatDetails: {
    flex: 1,
    backgroundColor: 'transparent',
    gap: 4,
  },
  chatRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  timeText: {
    fontSize: 10,
    color: '#8A8A8E',
  },
  vibeStatusRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  vibePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vibePillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  streakBadge: {
    backgroundColor: '#FFF0E6',
    borderColor: '#FFD9C2',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FF6B00',
  },
  lastMessageText: {
    fontSize: 13,
    color: '#8A8A8E',
    marginTop: 4,
  },
});
