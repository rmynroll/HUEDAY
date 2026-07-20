import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SpinningVinylProps {
  title: string;
  artist: string;
  accentColor?: string;
  textColor?: string;
  pillBg?: string;
  pillBorder?: string;
}

export default function SpinningVinyl({
  title,
  artist,
  accentColor = '#F0A23B',
  textColor = '#FFFFFF',
  pillBg = 'rgba(0, 0, 0, 0.2)',
  pillBorder = 'rgba(255, 255, 255, 0.15)',
}: SpinningVinylProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: pillBg, borderColor: pillBorder }]}>
      {/* Animated Vinyl Disc */}
      <Animated.View style={[styles.discContainer, { transform: [{ rotate: spin }] }]}>
        <Svg width={40} height={40} viewBox="0 0 40 40">
          <Defs>
            <LinearGradient id="vinylShine" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <Stop offset="40%" stopColor="#000000" stopOpacity="0" />
              <Stop offset="60%" stopColor="#000000" stopOpacity="0" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </LinearGradient>
          </Defs>

          {/* Base Black Vinyl */}
          <Circle cx={20} cy={20} r={19.5} fill="#121215" stroke="#25252B" strokeWidth={0.8} />

          {/* Concentric Groove Rings */}
          <Circle cx={20} cy={20} r={17} fill="none" stroke="#26262E" strokeWidth={0.6} />
          <Circle cx={20} cy={20} r={14.5} fill="none" stroke="#1E1E24" strokeWidth={0.6} />
          <Circle cx={20} cy={20} r={12} fill="none" stroke="#2A2A34" strokeWidth={0.6} />
          <Circle cx={20} cy={20} r={9.5} fill="none" stroke="#1C1C22" strokeWidth={0.6} />

          {/* Center Label Sticker */}
          <Circle cx={20} cy={20} r={7.5} fill={accentColor} />
          <Circle cx={20} cy={20} r={7.5} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={0.6} />

          {/* Vinyl Specular Shine */}
          <Circle cx={20} cy={20} r={19.5} fill="url(#vinylShine)" />

          {/* Center Spindle Hole */}
          <Circle cx={20} cy={20} r={2.2} fill="#09090B" />
          <Circle cx={20} cy={20} r={1.2} fill="#FFFFFF" opacity={0.7} />
        </Svg>
      </Animated.View>

      {/* Song Details */}
      <View style={styles.textWrapper}>
        <View style={styles.titleRow}>
          <Text style={[styles.titleText, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.liveDot, { backgroundColor: accentColor }]} />
        </View>
        <Text style={[styles.artistText, { color: textColor }]} numberOfLines={1}>
          {artist}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    maxWidth: '96%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  discContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  artistText: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.75,
  },
});
