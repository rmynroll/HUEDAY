import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface MoodSliderProps {
  value: number; // 0-1
  onChange: (value: number) => void;
}

const TRACK_HEIGHT = 22;
const THUMB_SIZE = 34;

export default function MoodSlider({ value, onChange }: MoodSliderProps) {
  const { t } = useTranslation();
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackPageXRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  const updateValueFromPageX = useCallback(
    (pageX: number) => {
      if (trackWidth <= 0) return;
      const relativeX = pageX - trackPageXRef.current;
      const clampedX = Math.min(trackWidth, Math.max(0, relativeX));
      const newValue = clampedX / trackWidth;
      onChange(newValue);
    },
    [trackWidth, onChange]
  );

  const measureTrack = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0) {
          setTrackWidth(width);
          trackPageXRef.current = pageX;
        }
      });
    }
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
    measureTrack();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        isDraggingRef.current = true;
        measureTrack();
        const touchPageX = evt.nativeEvent.pageX;
        if (touchPageX !== undefined && touchPageX !== null) {
          updateValueFromPageX(touchPageX);
        }
      },

      onPanResponderMove: (evt) => {
        const touchPageX = evt.nativeEvent.pageX;
        if (touchPageX !== undefined && touchPageX !== null) {
          updateValueFromPageX(touchPageX);
        }
      },

      onPanResponderRelease: () => {
        isDraggingRef.current = false;
      },

      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
      },
    })
  ).current;

  // Web pointer events handling for smooth mouse & touch drag on Web
  const webProps =
    Platform.OS === 'web'
      ? {
          onPointerDown: (e: any) => {
            if (trackRef.current) {
              const rect = (trackRef.current as any).getBoundingClientRect?.();
              if (rect) {
                trackPageXRef.current = rect.left;
                setTrackWidth(rect.width);
                const newValue = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                onChange(newValue);

                const onPointerMove = (moveEvent: PointerEvent) => {
                  const val = Math.min(1, Math.max(0, (moveEvent.clientX - rect.left) / rect.width));
                  onChange(val);
                };

                const onPointerUp = () => {
                  window.removeEventListener('pointermove', onPointerMove);
                  window.removeEventListener('pointerup', onPointerUp);
                };

                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
              }
            }
          },
        }
      : {};

  const usableWidth = Math.max(trackWidth - THUMB_SIZE, 0);
  const thumbLeft = Math.min(usableWidth, Math.max(0, value * usableWidth));

  return (
    <View style={styles.container}>
      <View
        ref={trackRef}
        style={styles.track}
        onLayout={onLayout}
        {...panResponder.panHandlers}
        {...webProps}
      >
        <Svg width="100%" height={TRACK_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id="moodTrack" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#4A5FD6" />
              <Stop offset="50%" stopColor="#3FAE7A" />
              <Stop offset="100%" stopColor="#F0A23B" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height={TRACK_HEIGHT} rx={TRACK_HEIGHT / 2} fill="url(#moodTrack)" />
        </Svg>
        <View pointerEvents="none" style={[styles.thumb, { left: thumbLeft }]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.labelText}>{t('moodSlider.low')}</Text>
        <Text style={styles.labelText}>{t('moodSlider.high')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  } as any,
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  labelText: {
    fontSize: 12,
    color: '#8A8A8E',
  },
});
