import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop, Path } from 'react-native-svg';

import { getStyle } from '../lib/cardStyles';
import { mulberry32, pickReadableTextColor } from '../lib/color';
import type { DayCard as DayCardType } from '../types/card';

interface DayCardProps {
  card: DayCardType;
}

const VIEWBOX_W = 100;
const VIEWBOX_H = 178; // 9:16

export default function DayCard({ card }: DayCardProps) {
  const style = getStyle(card.styleId);
  const gradientId = useMemo(() => `grad-${card.date}-${card.seed}`, [card.date, card.seed]);
  
  const textColor = useMemo(() => {
    if (style.textureKind === 'neon-glow') return '#FFFFFF';
    if (style.textureKind === 'watercolor') return '#2A2A2A'; // soft dark charcoal for paper/watercolor
    return pickReadableTextColor(card.palette);
  }, [card.palette, style.textureKind]);

  const grainDots = useMemo(() => {
    if (style.textureKind !== 'grain') return [];
    const rng = mulberry32(card.seed);
    return Array.from({ length: 45 }).map(() => ({
      cx: rng() * VIEWBOX_W,
      cy: rng() * VIEWBOX_H,
      r: 0.4 + rng() * 1.4,
      opacity: 0.05 + rng() * 0.09,
      fill: rng() > 0.5 ? '#000000' : '#ffffff',
    }));
  }, [style.textureKind, card.seed]);

  const watercolorBlobs = useMemo(() => {
    if (style.textureKind !== 'watercolor') return [];
    const rng = mulberry32(card.seed);
    // Draw 4 large bleeding blobs
    return card.palette.map((color, index) => ({
      cx: 15 + rng() * 70,
      cy: 25 + rng() * 128,
      r: 35 + rng() * 45,
      fillId: `wc-grad-${card.date}-${card.seed}-${index}`,
      opacity: 0.55 + rng() * 0.25,
    }));
  }, [style.textureKind, card.palette, card.seed]);

  const neonBlobs = useMemo(() => {
    if (style.textureKind !== 'neon-glow') return [];
    const rng = mulberry32(card.seed + 999);
    // Glow circles behind
    return card.palette.slice(0, 3).map((color, index) => ({
      cx: 10 + rng() * 80,
      cy: 20 + rng() * 130,
      r: 45 + rng() * 40,
      fillId: `neon-grad-${card.date}-${card.seed}-${index}`,
      opacity: 0.5 + rng() * 0.2,
    }));
  }, [style.textureKind, card.palette, card.seed]);

  // Dynamic Typography Styles based on selected CardStyle
  const logoFont = useMemo(() => {
    const base = { fontSize: 16, letterSpacing: 1.5, opacity: 0.9 };
    if (style.headingFont === 'serif') {
      return [base, { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontStyle: 'italic' as const }];
    }
    return [base, { fontWeight: '700' as const }];
  }, [style.headingFont]);

  const phraseFont = useMemo(() => {
    const base = { fontSize: 22, lineHeight: 28 };
    if (style.headingFont === 'serif') {
      return [base, { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontStyle: 'italic' as const, fontWeight: '700' as const }];
    }
    return [base, { fontWeight: '800' as const }];
  }, [style.headingFont]);

  const dateFont = useMemo(() => {
    const base = { fontSize: 12, opacity: 0.8 };
    if (style.bodyFont === 'serif') {
      return [base, { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }];
    }
    return [base, { fontWeight: '500' as const }];
  }, [style.bodyFont]);

  const isDarkText = textColor === '#000000' || textColor === '#2A2A2A';
  const pillBg = isDarkText ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.12)';
  const pillBorder = isDarkText ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.2)';

  return (
    <View style={styles.wrapper}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Default Linear Gradient */}
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {card.palette.map((hex, i) => (
              <Stop
                key={hex + i}
                offset={`${(i / Math.max(card.palette.length - 1, 1)) * 100}%`}
                stopColor={hex}
              />
            ))}
          </LinearGradient>

          {/* Chrome Reflection Gradients */}
          {style.textureKind === 'chrome' && (
            <>
              <LinearGradient id={`chrome-grad-1-${card.seed}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.75"/>
                <Stop offset="30%" stopColor={card.palette[0]} stopOpacity="0.4"/>
                <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.85"/>
                <Stop offset="70%" stopColor={card.palette[1] || card.palette[0]} stopOpacity="0.3"/>
                <Stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.6"/>
              </LinearGradient>
              <LinearGradient id={`chrome-grad-2-${card.seed}`} x1="1" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"/>
                <Stop offset="40%" stopColor={card.palette[2] || card.palette[0]} stopOpacity="0.45"/>
                <Stop offset="70%" stopColor="#111111" stopOpacity="0.65"/>
                <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.9"/>
              </LinearGradient>
            </>
          )}

          {/* Watercolor Radial Gradients */}
          {style.textureKind === 'watercolor' &&
            card.palette.map((color, index) => (
              <RadialGradient
                key={`wc-grad-${index}`}
                id={`wc-grad-${card.date}-${card.seed}-${index}`}
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
              >
                <Stop offset="0%" stopColor={color} stopOpacity="0.85" />
                <Stop offset="65%" stopColor={color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={color} stopOpacity="0" />
              </RadialGradient>
            ))}

          {/* Neon Glow Gradients */}
          {style.textureKind === 'neon-glow' &&
            card.palette.slice(0, 3).map((color, index) => (
              <RadialGradient
                key={`neon-grad-${index}`}
                id={`neon-grad-${card.date}-${card.seed}-${index}`}
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
              >
                <Stop offset="0%" stopColor={color} stopOpacity="0.7" />
                <Stop offset="100%" stopColor={color} stopOpacity="0" />
              </RadialGradient>
            ))}
        </Defs>

        {/* --- Background Renderers based on style --- */}
        {style.textureKind === 'watercolor' ? (
          // Soft cream-canvas background for watercolor
          <Rect x={0} y={0} width={VIEWBOX_W} height={VIEWBOX_H} fill="#FAF6EE" />
        ) : style.textureKind === 'neon-glow' ? (
          // Dark night background for neon
          <Rect x={0} y={0} width={VIEWBOX_W} height={VIEWBOX_H} fill="#06060D" />
        ) : (
          // Standard gradient background
          <Rect x={0} y={0} width={VIEWBOX_W} height={VIEWBOX_H} fill={`url(#${gradientId})`} />
        )}

        {/* --- Texture Overlay Renderers --- */}
        {/* Watercolor Blobs */}
        {style.textureKind === 'watercolor' &&
          watercolorBlobs.map((blob, i) => (
            <Circle
              key={i}
              cx={blob.cx}
              cy={blob.cy}
              r={blob.r}
              fill={`url(#${blob.fillId})`}
              opacity={blob.opacity}
            />
          ))}

        {/* Y2K Chrome metallic liquid paths */}
        {style.textureKind === 'chrome' && (
          <>
            <Path
              d="M -10,45 C 25,15 45,75 110,35 L 110,120 C 45,145 25,90 -10,125 Z"
              fill={`url(#chrome-grad-1-${card.seed})`}
              opacity={0.8}
            />
            <Path
              d="M -10,85 C 40,115 55,65 110,95 L 110,188 L -10,188 Z"
              fill={`url(#chrome-grad-2-${card.seed})`}
              opacity={0.65}
            />
          </>
        )}

        {/* Neon Glow Blobs */}
        {style.textureKind === 'neon-glow' && (
          <>
            {neonBlobs.map((blob, i) => (
              <Circle
                key={i}
                cx={blob.cx}
                cy={blob.cy}
                r={blob.r}
                fill={`url(#${blob.fillId})`}
                opacity={blob.opacity}
              />
            ))}
            {/* Glowing neon outline */}
            <Rect
              x={5}
              y={5}
              width={VIEWBOX_W - 10}
              height={VIEWBOX_H - 10}
              rx={10}
              ry={10}
              fill="none"
              stroke={card.palette[0]}
              strokeWidth={0.8}
              opacity={0.85}
            />
            <Rect
              x={5.4}
              y={5.4}
              width={VIEWBOX_W - 10.8}
              height={VIEWBOX_H - 10.8}
              rx={9.6}
              ry={9.6}
              fill="none"
              stroke="#ffffff"
              strokeWidth={0.25}
              opacity={0.9}
            />
          </>
        )}

        {/* Grain Noise Overlay */}
        {style.textureKind === 'grain' &&
          grainDots.map((d, i) => (
            <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} opacity={d.opacity} />
          ))}
      </Svg>

      <View style={styles.overlay}>
        <Text style={[logoFont, { color: textColor }]}>hueday</Text>

        <View style={styles.bottom}>
          <Text style={[phraseFont, { color: textColor }]}>{card.phrase}</Text>
          
          {/* Song of the Day */}
          {card.song && (
            <View style={[styles.songPill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
              <Text style={[styles.songText, { color: textColor }]} numberOfLines={1}>
                🎵  {card.song.title} — {card.song.artist}
              </Text>
            </View>
          )}

          <Text style={[dateFont, { color: textColor }]}>
            {format(parseISO(card.date), 'd MMMM yyyy, EEEE', { locale: tr })}
          </Text>

          <View style={styles.hexRow}>
            {card.palette.map((hex) => (
              <View key={hex} style={styles.hexChip}>
                <View style={[styles.hexSwatch, { backgroundColor: hex }]} />
                <Text style={[styles.hexText, { color: textColor }]}>{hex}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    aspectRatio: VIEWBOX_W / VIEWBOX_H,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 22,
  },
  bottom: {
    gap: 8,
  },
  songPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 4,
    maxWidth: '95%',
  },
  songText: {
    fontSize: 10,
    fontWeight: '600',
  },
  hexRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  hexChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hexSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  hexText: {
    fontSize: 9,
    opacity: 0.8,
    fontWeight: '500',
  },
});
