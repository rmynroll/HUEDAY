import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useHuedayStore } from './storage';
import type { DayCard, ColorMoodEmotion } from '../types/card';

// Ensure WebBrowser finishes the auth session cleanly
WebBrowser.maybeCompleteAuthSession();

// Client Credentials from Environment Variables
const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || '';

// Mappings for Mood Colors to Spotify Searches & Playlists
export interface MoodMusicInfo {
  emotion: ColorMoodEmotion;
  searchQuery: string;
  youtubeQuery: string;
  accentColor: string;
  titleKey: string;
  emoji: string;
}

export const MOOD_MUSIC_MAP: Record<ColorMoodEmotion, MoodMusicInfo> = {
  joy: {
    emotion: 'joy',
    searchQuery: 'happy pop vibe energetic hits',
    youtubeQuery: 'happy energetic pop',
    accentColor: '#F5C445',
    titleKey: 'spotify.moods.joy',
    emoji: '☀️',
  },
  sadness: {
    emotion: 'sadness',
    searchQuery: 'melancholic indie sad vibe acoustic slow',
    youtubeQuery: 'sad melancholic acoustic songs',
    accentColor: '#5B9BD5',
    titleKey: 'spotify.moods.sadness',
    emoji: '🌧️',
  },
  anger: {
    emotion: 'anger',
    searchQuery: 'intense rock metal energetic gym hype',
    youtubeQuery: 'intense rock metal playlist',
    accentColor: '#E24B4A',
    titleKey: 'spotify.moods.anger',
    emoji: '🔥',
  },
  anxiety: {
    emotion: 'anxiety',
    searchQuery: 'ambient calm focus lo-fi peaceful sleep lofi chill',
    youtubeQuery: 'ambient calm lofi study',
    accentColor: '#9B7FD4',
    titleKey: 'spotify.moods.anxiety',
    emoji: '💨',
  },
  calm: {
    emotion: 'calm',
    searchQuery: 'peaceful acoustic folk relaxing clean guitar',
    youtubeQuery: 'peaceful acoustic relaxing songs',
    accentColor: '#6FBF73',
    titleKey: 'spotify.moods.calm',
    emoji: '🌊',
  },
  excitement: {
    emotion: 'excitement',
    searchQuery: 'upbeat dance party house club hits electro electronic',
    youtubeQuery: 'upbeat dance house party',
    accentColor: '#F0997B',
    titleKey: 'spotify.moods.excitement',
    emoji: '✨',
  },
};

/**
 * Derives the dominant emotion from a DayCard.
 * Falls back to mood ranges if no quick colorMood entries are present.
 */
export function getDominantEmotion(card: DayCard): ColorMoodEmotion {
  if (card.colorMoods && card.colorMoods.length > 0) {
    // Return first selected emotion
    return card.colorMoods[0].emotion;
  }

  // Fallback map based on detailed mood range and energy
  const mood = card.mood;
  const energy = card.tags?.energy ?? 0.5;

  if (mood >= 0.8) return 'excitement';
  if (mood >= 0.6) return 'joy';
  if (mood >= 0.45) return 'calm';
  if (mood >= 0.3) return 'anxiety';
  return energy >= 0.5 ? 'anger' : 'sadness';
}

/**
 * Simple manual Base64 encoder for client-side environments (React Native)
 */
function base64Encode(str: string): string {
  try {
    return btoa(str);
  } catch {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let output = '';
    for (let block = 0, charCode, i = 0, map = chars;
         str.charAt(i | 0) || (map = '=', i % 1);
         output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
      charCode = str.charCodeAt(i += 3/4);
      block = (block << 8) | charCode;
    }
    return output;
  }
}

/**
 * Triggers Spotify Login Flow using WebBrowser auth session
 */
export async function loginToSpotify(): Promise<boolean> {
  if (!CLIENT_ID) {
    console.error('Spotify Client ID is missing. Check your .env file.');
    return false;
  }

  const redirectUri = Linking.createURL('/');
  const scope = 'user-read-private user-read-email playlist-read-private';
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}`;

  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    
    if (result.type === 'success' && result.url) {
      const parsedUrl = Linking.parse(result.url);
      const code = parsedUrl.queryParams?.code;
      if (code && typeof code === 'string') {
        return await exchangeCodeForToken(code, redirectUri);
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to open Spotify auth session:', error);
    return false;
  }
}

/**
 * Exchanges auth code for Access and Refresh tokens
 */
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<boolean> {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${base64Encode(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const data = await response.json();

    if (data.access_token) {
      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
      useHuedayStore.getState().setSpotifyAuth(
        data.access_token,
        data.refresh_token || null,
        expiresAt
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error exchanging Spotify auth code:', error);
    return false;
  }
}

/**
 * Refreshes Spotify Access Token using the refresh token
 */
export async function refreshSpotifyToken(): Promise<string | null> {
  const { spotifyRefreshToken, setSpotifyAuth, clearSpotifyAuth } = useHuedayStore.getState();
  if (!spotifyRefreshToken) return null;

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${base64Encode(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: spotifyRefreshToken,
      }).toString(),
    });

    const data = await response.json();

    if (data.access_token) {
      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
      setSpotifyAuth(
        data.access_token,
        data.refresh_token || spotifyRefreshToken, // Spotify may not return a new refresh token
        expiresAt
      );
      return data.access_token;
    } else {
      // Clear auth if refresh token is rejected or expired
      clearSpotifyAuth();
      return null;
    }
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    return null;
  }
}

/**
 * Fetches a valid access token, auto-refreshing if expired.
 */
export async function getValidToken(): Promise<string | null> {
  const { spotifyAccessToken, spotifyTokenExpiresAt } = useHuedayStore.getState();
  if (!spotifyAccessToken) return null;

  // Check if expired (or expiring in next 30 seconds)
  const expiresAt = spotifyTokenExpiresAt ? new Date(spotifyTokenExpiresAt).getTime() : 0;
  if (Date.now() + 30000 >= expiresAt) {
    return await refreshSpotifyToken();
  }

  return spotifyAccessToken;
}

export interface SpotifyPlaylistInfo {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
}

/**
 * Searches for a Spotify playlist matching the query
 */
export async function fetchMoodPlaylist(emotion: ColorMoodEmotion): Promise<SpotifyPlaylistInfo | null> {
  const token = await getValidToken();
  if (!token) return null;

  const moodInfo = MOOD_MUSIC_MAP[emotion];
  const query = encodeURIComponent(moodInfo.searchQuery);

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=playlist&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      // Token unauthorized, attempt one refresh and retry
      const newToken = await refreshSpotifyToken();
      if (!newToken) return null;
      return fetchMoodPlaylist(emotion);
    }

    const data = await response.json();
    const playlists = data.playlists?.items || [];

    if (playlists.length > 0) {
      // Pick a random playlist from the top 5 for variety
      const index = Math.floor(Math.random() * Math.min(playlists.length, 5));
      const p = playlists[index];
      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        imageUrl: p.images?.[0]?.url || '',
        externalUrl: p.external_urls?.spotify || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching mood playlist:', error);
    return null;
  }
}

/**
 * Generates alternative YouTube Music search URL
 */
export function getYoutubeMusicUrl(emotion: ColorMoodEmotion): string {
  const moodInfo = MOOD_MUSIC_MAP[emotion];
  const query = encodeURIComponent(moodInfo.youtubeQuery);
  return `https://music.youtube.com/search?q=${query}`;
}
