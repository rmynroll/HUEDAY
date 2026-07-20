import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useHuedayStore } from '../lib/storage';
import { generateWaveformBars } from '../lib/mediaRepository';

interface AudioMemoPlayerProps {
  date: string;
  palette: string[];
}

const MAX_DURATION = 300; // 5 minutes
const BAR_COUNT = 28;

export default function AudioMemoPlayer({ date, palette }: AudioMemoPlayerProps) {
  const { t } = useTranslation();
  const { audioMemos, saveAudioMemo, deleteAudioMemo } = useHuedayStore();
  const existingMemo = audioMemos[date];

  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while recording
  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recording, pulseAnim]);

  const startRecording = useCallback(() => {
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= MAX_DURATION - 1) {
          stopRecording();
          return MAX_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);

    // Generate waveform bars and save
    const bars = generateWaveformBars(BAR_COUNT);
    const durationSec = Math.min(elapsed + 1, MAX_DURATION);
    const fakeUri = `hueday://audio/${date}_${Date.now()}.m4a`;
    saveAudioMemo(date, fakeUri, durationSec, bars);
  }, [date, elapsed, saveAudioMemo]);

  const togglePlayback = useCallback(() => {
    if (!existingMemo) return;
    if (playing) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      playTimerRef.current = null;
      setPlaying(false);
      return;
    }

    setPlaying(true);
    setPlaybackProgress(0);
    const step = 100 / (existingMemo.durationSeconds * 10);
    playTimerRef.current = setInterval(() => {
      setPlaybackProgress((prev) => {
        if (prev >= 100) {
          if (playTimerRef.current) clearInterval(playTimerRef.current);
          playTimerRef.current = null;
          setPlaying(false);
          return 0;
        }
        return prev + step;
      });
    }, 100);
  }, [existingMemo, playing]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  const primaryColor = palette[0] || '#E55B70';
  const accentColor = palette.length > 2 ? palette[2] : '#FDE047';
  const subtleColor = palette.length > 1 ? palette[1] : '#2C2C2E';

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ---- Existing memo: playback view ----
  if (existingMemo) {
    const bars = existingMemo.waveformBars || generateWaveformBars(BAR_COUNT);
    const activeBarIndex = Math.floor((playbackProgress / 100) * bars.length);

    return (
      <View style={[styles.container, { borderColor: primaryColor + '30' }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.label, { color: primaryColor }]}>{t('audioMemo.label')}</Text>
          <Text style={styles.duration}>
            {formatTime(existingMemo.durationSeconds)}
          </Text>
        </View>

        {/* Waveform */}
        <View style={styles.waveformContainer}>
          {bars.map((amp, i) => {
            const isActive = i <= activeBarIndex && playing;
            return (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: Math.max(4, amp * 32),
                    backgroundColor: isActive ? primaryColor : subtleColor + '60',
                    borderRadius: 2,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={togglePlayback}
            style={[styles.playBtn, { backgroundColor: primaryColor + '20' }]}
            accessibilityLabel={playing ? t('audioMemo.pauseA11y') : t('audioMemo.playA11y')}
          >
            <Text style={[styles.playIcon, { color: primaryColor }]}>
              {playing ? '⏸' : '▶️'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => deleteAudioMemo(date)}
            style={styles.deleteBtn}
            accessibilityLabel={t('audioMemo.deleteA11y')}
          >
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---- No memo yet: record view ----
  return (
    <View style={[styles.container, { borderColor: primaryColor + '20' }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: primaryColor }]}>{t('audioMemo.label')}</Text>
        {recording && (
          <Text style={[styles.countdown, { color: accentColor }]}>
            {formatTime(MAX_DURATION - elapsed)}
          </Text>
        )}
      </View>

      {recording && (
        <View style={styles.waveformContainer}>
          {Array.from({ length: BAR_COUNT }).map((_, i) => {
            const liveAmp = 0.2 + Math.random() * 0.8;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: Math.max(4, liveAmp * 32),
                    backgroundColor: primaryColor + '90',
                    borderRadius: 2,
                    transform: [{ scaleY: pulseAnim }],
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      <TouchableOpacity
        onPress={recording ? stopRecording : startRecording}
        style={[
          styles.recordBtn,
          {
            backgroundColor: recording ? '#E55B70' : primaryColor + '15',
            borderColor: recording ? '#E55B70' : primaryColor + '40',
          },
        ]}
        accessibilityLabel={recording ? t('audioMemo.stopRecordingA11y') : t('audioMemo.startRecordingA11y')}
      >
        <Animated.View
          style={[
            styles.recordDot,
            {
              backgroundColor: recording ? '#fff' : primaryColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Text
          style={[
            styles.recordText,
            { color: recording ? '#fff' : primaryColor },
          ]}
        >
          {recording ? t('audioMemo.stopLabel') : t('audioMemo.recordLabel')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>{t('audioMemo.maxDuration')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#1C1C1E',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  duration: {
    fontSize: 12,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  countdown: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    marginBottom: 12,
    gap: 2,
  },
  waveBar: {
    flex: 1,
    minWidth: 3,
    maxWidth: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playIcon: {
    fontSize: 18,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteText: {
    fontSize: 16,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  recordDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    color: '#636366',
    textAlign: 'center',
    marginTop: 8,
  },
});
