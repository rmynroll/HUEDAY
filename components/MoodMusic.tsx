import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, Pressable, ActivityIndicator, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useHuedayStore } from '../lib/storage';
import {
  getDominantEmotion,
  fetchMoodPlaylist,
  getYoutubeMusicUrl,
  loginToSpotify,
  SpotifyPlaylistInfo,
  MOOD_MUSIC_MAP,
} from '../lib/spotify';
import type { DayCard } from '../types/card';
import SpinningVinyl from './SpinningVinyl';

interface MoodMusicProps {
  card: DayCard;
}

export default function MoodMusic({ card }: MoodMusicProps) {
  const { t } = useTranslation();
  
  // Spotify auth from state
  const spotifyAccessToken = useHuedayStore((s) => s.spotifyAccessToken);
  const clearSpotifyAuth = useHuedayStore((s) => s.clearSpotifyAuth);

  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState<SpotifyPlaylistInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emotion = getDominantEmotion(card);
  const moodMeta = MOOD_MUSIC_MAP[emotion];
  const accentColor = moodMeta.accentColor;

  // Fetch playlist if Spotify is connected
  useEffect(() => {
    let active = true;
    if (spotifyAccessToken) {
      setLoading(true);
      setError(null);
      fetchMoodPlaylist(emotion)
        .then((data) => {
          if (active) {
            setPlaylist(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            console.error(err);
            setError('Playlist yüklenemedi.');
            setLoading(false);
          }
        });
    } else {
      setPlaylist(null);
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [spotifyAccessToken, emotion]);

  const handleSpotifyConnect = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);
    const success = await loginToSpotify();
    setLoading(false);
    if (!success) {
      setError('Spotify bağlantısı başarısız oldu.');
    }
  };

  const handleSpotifyDisconnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    clearSpotifyAuth();
    setPlaylist(null);
  };

  const handleOpenPlaylist = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(url).catch((err) => console.error('Could not open Spotify Link', err));
  };

  const handleOpenYoutube = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const ytUrl = getYoutubeMusicUrl(emotion);
    Linking.openURL(ytUrl).catch((err) => console.error('Could not open YouTube Music Link', err));
  };

  const displayEmotionName = t(`colorMood.emotions.${emotion}`, { defaultValue: emotion });

  return (
    <View style={[styles.card, { borderColor: accentColor + '30', backgroundColor: accentColor + '08' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: '#1C1C1E' }]}>
          🎵 {t('spotify.cardTitle', { defaultValue: 'Bu Renge Özel Müzik' })}
        </Text>
        <Text style={[styles.moodTag, { backgroundColor: accentColor + '20', color: '#1C1C1E' }]}>
          {displayEmotionName}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={accentColor} />
          <Text style={styles.statusText}>{t('spotify.loading', { defaultValue: 'Müzik önerileri yükleniyor...' })}</Text>
        </View>
      ) : spotifyAccessToken && playlist ? (
        // Connected & Playlist Loaded
        <View style={styles.connectedContainer}>
          <View style={styles.playlistRow}>
            {playlist.imageUrl ? (
              <Image source={{ uri: playlist.imageUrl }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverFallback, { backgroundColor: accentColor + '40' }]}>
                <Text style={styles.coverFallbackText}>💿</Text>
              </View>
            )}
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName} numberOfLines={1}>
                {playlist.name}
              </Text>
              <Text style={styles.playlistDesc} numberOfLines={2}>
                {playlist.description || t('spotify.playlistDesc', { defaultValue: 'Günün rengine özel Spotify çalma listesi.' })}
              </Text>
            </View>
          </View>

          {/* Interactive Spinning Vinyl Component */}
          <View style={styles.vinylWrapper}>
            <SpinningVinyl
              title={playlist.name}
              artist={t('spotify.curatedForYou', { defaultValue: 'Hueday Özel Çalma Listesi' })}
              accentColor={accentColor}
              textColor="#1C1C1E"
              pillBg="rgba(0,0,0,0.03)"
              pillBorder="rgba(0,0,0,0.06)"
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.btn, styles.btnSpotify, { backgroundColor: '#1DB954' }]}
              onPress={() => handleOpenPlaylist(playlist.externalUrl)}
            >
              <Text style={styles.btnTextWhite}>🟢 Spotify'da Dinle</Text>
            </Pressable>

            <Pressable style={styles.btnDisconnect} onPress={handleSpotifyDisconnect}>
              <Text style={styles.btnDisconnectText}>{t('spotify.disconnect', { defaultValue: 'Bağlantıyı Kes' })}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // Not Connected Flow
        <View style={styles.disconnectedContainer}>
          <Text style={styles.descText}>
            {t('spotify.connectPrompt', {
              defaultValue: 'Gününüzün rengine özel Spotify çalma listesini görmek için Spotify hesabınızı bağlayın.',
            })}
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.authButtons}>
            <Pressable
              style={[styles.btn, styles.btnSpotify, { backgroundColor: '#1DB954' }]}
              onPress={handleSpotifyConnect}
            >
              <Text style={styles.btnTextWhite}>🟢 Spotify'a Bağlan</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnYoutube, { borderColor: '#FF0000', borderWidth: 1 }]}
              onPress={handleOpenYoutube}
            >
              <Text style={[styles.btnText, { color: '#FF0000' }]}>❤️ YouTube Music'te Dinle</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  moodTag: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  connectedContainer: {
    gap: 12,
  },
  playlistRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  coverImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  coverFallback: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverFallbackText: {
    fontSize: 22,
  },
  playlistInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  playlistName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  playlistDesc: {
    fontSize: 11,
    color: '#636366',
    marginTop: 2,
  },
  vinylWrapper: {
    marginVertical: 4,
    alignSelf: 'stretch',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  disconnectedContainer: {
    gap: 10,
  },
  descText: {
    fontSize: 12,
    color: '#636366',
    lineHeight: 16,
  },
  errorText: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '500',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSpotify: {
    flexDirection: 'row',
    gap: 6,
  },
  btnYoutube: {
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnTextWhite: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  btnDisconnect: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  btnDisconnectText: {
    fontSize: 11,
    color: '#8A8A8E',
    fontWeight: '500',
  },
});
