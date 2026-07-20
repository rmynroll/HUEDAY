import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { SealMotif } from '../types/capsule';

interface WaxSealSvgProps {
  color?: string;
  motif?: SealMotif;
  initial?: string;
  size?: number;
}

export default function WaxSealSvg({
  color = '#E55B70',
  motif = 'standard',
  initial = 'K',
  size = 64,
}: WaxSealSvgProps) {
  const getMotifSymbol = () => {
    switch (motif) {
      case 'moon':
        return '🌙';
      case 'star':
        return '⭐';
      case 'snow':
        return '❄️';
      case 'sun':
        return '☀️';
      case 'fire':
        return '☄️';
      default:
        return initial.toUpperCase();
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Organic Dripping Wax Rim */}
        <Path
          d="M 32 3 C 48 2, 62 14, 60 30 C 63 46, 49 61, 32 61 C 15 63, 2 48, 4 32 C 1 16, 17 4, 32 3 Z"
          fill={color}
        />
        <Path
          d="M 32 6 C 45 5, 57 15, 56 29 C 58 43, 45 56, 32 56 C 18 57, 7 44, 8 30 C 6 16, 19 7, 32 6 Z"
          fill="rgba(0,0,0,0.12)"
        />
        {/* Inner Debossed Ring */}
        <Circle cx={32} cy={32} r={21} fill={color} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
        <Circle cx={32} cy={32} r={19} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
      </Svg>

      {/* Center Motif / Initial */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.centerBox}>
          <Text style={[styles.motifText, { fontSize: size * 0.36 }]}>
            {getMotifSymbol()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motifText: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
