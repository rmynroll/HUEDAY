import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface MoodSliderProps {
  value: number; // 0-1
  onChange: (value: number) => void;
}

const TRACK_HEIGHT = 22;
const THUMB_SIZE = 34;

export default function MoodSlider({ value, onChange }: MoodSliderProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const updateFromX = (x: number) => {
    if (width <= 0) return;
    const clamped = Math.min(width, Math.max(0, x));
    onChange(clamped / width);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => updateFromX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => updateFromX(evt.nativeEvent.locationX),
    })
  ).current;

  const thumbLeft = useMemo(() => {
    const usable = Math.max(width - THUMB_SIZE, 0);
    return value * usable;
  }, [value, width]);

  return (
    <View style={styles.container}>
      <View style={styles.track} onLayout={onLayout} {...panResponder.panHandlers}>
        <Svg width="100%" height={TRACK_HEIGHT} style={StyleSheet.absoluteFill}>
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
        <Text style={styles.labelText}>Düşük</Text>
        <Text style={styles.labelText}>Yüksek</Text>
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
  },
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
