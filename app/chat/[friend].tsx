import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Text, View } from '@/components/Themed';
import { useHuedayStore, todayKey } from '@/lib/storage';
import type { ChatMessage } from '@/types/card';

const FRIEND_VIBES = {
  'Deniz': { color: '#3FAE7A', emoji: '🌿', i18nKey: 'deniz' },
  'Elif': { color: '#E03F8A', emoji: '💫', i18nKey: 'elif' },
  'Merve': { color: '#8F3FE0', emoji: '🔮', i18nKey: 'merve' },
};

export default function ChatScreen() {
  const { t, i18n } = useTranslation();
  const { friend } = useLocalSearchParams<{ friend: string }>();
  const chats = useHuedayStore((s) => s.chats);
  const streaks = useHuedayStore((s) => s.streaks);
  const sendMessage = useHuedayStore((s) => s.sendMessage);
  const incrementStreak = useHuedayStore((s) => s.incrementStreak);
  
  const date = todayKey();
  const userCard = useHuedayStore((s) => s.cards[date]);

  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const messages = useMemo(() => {
    return chats[friend] || [];
  }, [chats, friend]);

  const streak = streaks[friend] || 0;
  const vibeMeta = FRIEND_VIBES[friend as keyof typeof FRIEND_VIBES] || {
    color: '#8A8A8E',
    emoji: '✨',
    i18nKey: 'unknown',
  };
  const vibeInfo = {
    color: vibeMeta.color,
    emoji: vibeMeta.emoji,
    vibe: t(`friendReplies.${vibeMeta.i18nKey}.vibe`),
    replies: t(`friendReplies.${vibeMeta.i18nKey}.replies`, { returnObjects: true }) as string[],
  };

  // User's bubble styling depending on whether they logged today
  const userBubbleBg = userCard ? userCard.palette[0] : '#1C1C1E';
  const userCardPalette = userCard ? userCard.palette : ['#1C1C1E', '#2C2C2E'];

  // Scroll to bottom on load/new message
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim()) return;

    const messageText = text.trim();
    setText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Send user message
    sendMessage(friend, messageText, 'user');
    
    // Increment streak
    incrementStreak(friend);

    // Simulate friend reply after 1.2s
    setTimeout(() => {
      const pool = vibeInfo.replies;
      const randomReply = pool[Math.floor(Math.random() * pool.length)];
      sendMessage(friend, randomReply, 'friend');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 1200);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    const timestampStr = new Date(item.timestamp).toLocaleTimeString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View style={styles.userBubble}>
            {userCard ? (
              // If user has a card today, use their gradient for their message bubble
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="user-msg-grad" x1="0" y1="0" x2="1" y2="0">
                    {userCardPalette.slice(0, 3).map((hex, i) => (
                      <Stop
                        key={hex + i}
                        offset={`${(i / Math.max(userCardPalette.slice(0, 3).length - 1, 1)) * 100}%`}
                        stopColor={hex}
                      />
                    ))}
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx={16} fill="url(#user-msg-grad)" />
              </Svg>
            ) : null}
            <View style={[styles.bubbleInner, !userCard && { backgroundColor: userBubbleBg }]}>
              <Text style={styles.userMessageText}>{item.text}</Text>
            </View>
          </View>
          <Text style={styles.timeLabel}>{timestampStr}</Text>
        </View>
      );
    }

    return (
      <View style={styles.friendMessageContainer}>
        <View style={[styles.friendBubble, { backgroundColor: `${vibeInfo.color}15`, borderColor: `${vibeInfo.color}30` }]}>
          <Text style={[styles.friendMessageText, { color: '#1C1C1E' }]}>{item.text}</Text>
        </View>
        <Text style={styles.timeLabel}>{timestampStr}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerVibeDot, { backgroundColor: vibeInfo.color }]} />
              <View style={styles.headerTextCol}>
                <Text style={styles.headerName}>{friend}</Text>
                <Text style={styles.headerStatus}>{vibeInfo.vibe}</Text>
              </View>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerStreakBadge}>
              <Text style={styles.headerStreakText}>🔥 {streak}</Text>
            </View>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input container */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('chat.inputPlaceholder', { friend })}
          placeholderTextColor="#8A8A8E"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendButton, text.trim() ? styles.sendButtonActive : styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text style={[styles.sendButtonText, text.trim() ? { color: '#FFFFFF' } : { color: '#8A8A8E' }]}>{t('chat.send')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  headerVibeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTextCol: {
    backgroundColor: 'transparent',
  },
  headerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerStatus: {
    fontSize: 9,
    color: '#8A8A8E',
  },
  headerStreakBadge: {
    backgroundColor: '#FFF0E6',
    borderColor: '#FFD9C2',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  headerStreakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B00',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
    alignSelf: 'flex-end',
    maxWidth: '80%',
    gap: 2,
  },
  userBubble: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bubbleInner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  friendMessageContainer: {
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    maxWidth: '80%',
    gap: 2,
  },
  friendBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  friendMessageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeLabel: {
    fontSize: 8,
    color: '#8A8A8E',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1C1C1E',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#1C1C1E',
  },
  sendButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  sendButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
