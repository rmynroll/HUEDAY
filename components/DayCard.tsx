import { format, parseISO } from 'date-fns';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, Platform } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop, Path, LinearGradient as SvgLinearGradient } from 'react-native-svg';

import { getStyle } from '../lib/cardStyles';
import { mulberry32, pickReadableTextColor } from '../lib/color';
import { getDateFnsLocale } from '../lib/i18n';
import type { DayCard as DayCardType } from '../types/card';
import SpinningVinyl from './SpinningVinyl';

interface DayCardProps {
  card: DayCardType;
}

const VIEWBOX_W = 100;
const VIEWBOX_H = 178; // 9:16

export default function DayCard({ card }: DayCardProps) {
  const { i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const style = getStyle(card.styleId);
  
  const isPaperLike = style.textureKind === 'grain' || style.textureKind === 'watercolor';
  const isWatercolor = style.textureKind === 'watercolor';
  const isNeon = style.textureKind === 'neon-glow';

  const textColor = useMemo(() => {
    if (isNeon) return '#FFFFFF';
    if (isPaperLike) return '#231F20'; // Warm dark charcoal ink
    return pickReadableTextColor(card.palette);
  }, [card.palette, style.textureKind, isNeon, isPaperLike]);

  // Generate realistic cotton paper fibers (organic curved threads in paper pulp)
  const paperFibers = useMemo(() => {
    if (!isPaperLike) return [];
    const rng = mulberry32(card.seed + 1234);
    return Array.from({ length: 48 }).map(() => {
      const x1 = rng() * VIEWBOX_W;
      const y1 = rng() * VIEWBOX_H;
      const length = 3.0 + rng() * 9.0;
      const angle = rng() * Math.PI * 2;
      const x2 = x1 + Math.cos(angle) * length;
      const y2 = y1 + Math.sin(angle) * length;
      // organic bezier curves
      const cx = (x1 + x2) / 2 + (rng() - 0.5) * 4.5;
      const cy = (y1 + y2) / 2 + (rng() - 0.5) * 4.5;
      return {
        d: `M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
        stroke: rng() > 0.4 ? '#4E4237' : '#7D6D5E',
        opacity: 0.05 + rng() * 0.13,
        strokeWidth: 0.18 + rng() * 0.25,
      };
    });
  }, [isPaperLike, card.seed]);

  // Generate realistic paper pulp specks & flecks (~180 micro particles)
  const paperPulpSpecks = useMemo(() => {
    if (!isPaperLike) return [];
    const rng = mulberry32(card.seed + 5678);
    return Array.from({ length: 180 }).map(() => {
      const type = rng();
      const isWhiteHighlight = type > 0.55;
      const isDarkPulp = type > 0.82;
      return {
        cx: rng() * VIEWBOX_W,
        cy: rng() * VIEWBOX_H,
        r: 0.15 + rng() * 1.1,
        opacity: isWhiteHighlight
          ? 0.10 + rng() * 0.15
          : isDarkPulp
          ? 0.07 + rng() * 0.12
          : 0.03 + rng() * 0.07,
        fill: isWhiteHighlight
          ? '#FFFFFF'
          : isDarkPulp
          ? '#2E2218'
          : '#6E5F52',
      };
    });
  }, [isPaperLike, card.seed]);

  // 3D paper tooth texture (micro-embossed bumps)
  const paperTooth = useMemo(() => {
    if (!isPaperLike) return [];
    const rng = mulberry32(card.seed + 9999);
    return Array.from({ length: 240 }).map(() => {
      const cx = rng() * VIEWBOX_W;
      const cy = rng() * VIEWBOX_H;
      const r = 0.15 + rng() * 0.25;
      return {
        cx,
        cy,
        r,
        shadowOpacity: 0.03 + rng() * 0.04,
        highlightOpacity: 0.12 + rng() * 0.14,
      };
    });
  }, [isPaperLike, card.seed]);

  // Organic Watercolor Blobs with natural bleeding & layered pigment transparency
  const watercolorBlobs = useMemo(() => {
    if (!isWatercolor) return [];
    const rng = mulberry32(card.seed);
    return card.palette.map((color, index) => {
      const cx = 15 + rng() * 70;
      const cy = 25 + rng() * 128;
      const r = 32 + rng() * 38;
      
      // Generate irregular smooth path
      const points = 12;
      const coords: {x: number; y: number}[] = [];
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Natural bleeding variation
        const rNoise = r * (0.8 + rng() * 0.35 + Math.sin(angle * 3) * 0.12);
        coords.push({
          x: cx + Math.cos(angle) * rNoise,
          y: cy + Math.sin(angle) * rNoise
        });
      }
      
      let d = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
      for (let i = 0; i < points; i++) {
        const p0 = coords[i];
        const p1 = coords[(i + 1) % points];
        const xc = (p0.x + p1.x) / 2;
        const yc = (p0.y + p1.y) / 2;
        d += ` Q ${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${xc.toFixed(1)},${yc.toFixed(1)}`;
      }
      d += ' Z';

      // Splatters around this blob
      const splatters = Array.from({ length: 5 }).map(() => {
        const dist = r * (1.1 + rng() * 0.55);
        const ang = rng() * Math.PI * 2;
        return {
          cx: cx + Math.cos(ang) * dist,
          cy: cy + Math.sin(ang) * dist,
          r: 0.25 + rng() * 0.95,
          opacity: 0.25 + rng() * 0.35
        };
      });

      return {
        d,
        color,
        cx,
        cy,
        r,
        splatters,
        fillId: `wc-grad-${card.date}-${card.seed}-${index}`,
        opacity: 0.55 + rng() * 0.2,
      };
    });
  }, [isWatercolor, card.palette, card.seed]);

  // Pastel Color Washes for Paper-Texture (grain mode)
  const paperColorWashes = useMemo(() => {
    if (style.textureKind !== 'grain') return [];
    const rng = mulberry32(card.seed + 888);
    return card.palette.slice(0, 3).map((color, index) => ({
      cx: 10 + rng() * 80,
      cy: 15 + rng() * 148,
      r: 45 + rng() * 55,
      fillId: `paper-wash-${card.date}-${card.seed}-${index}`,
      opacity: 0.4 + rng() * 0.15,
    }));
  }, [style.textureKind, card.palette, card.seed]);

  const neonBlobs = useMemo(() => {
    if (!isNeon) return [];
    const rng = mulberry32(card.seed + 999);
    return card.palette.slice(0, 3).map((color, index) => ({
      cx: 10 + rng() * 80,
      cy: 20 + rng() * 130,
      r: 45 + rng() * 40,
      fillId: `neon-grad-${card.date}-${card.seed}-${index}`,
      opacity: 0.45 + rng() * 0.18,
    }));
  }, [isNeon, card.palette, card.seed]);

  // Retro Neon Grid
  const neonGrid = useMemo(() => {
    if (!isNeon) return null;
    let paths = '';
    // Radiating vertical perspective lines from (50, -20)
    for (let x = -30; x <= 130; x += 16) {
      paths += ` M 50,-10 L ${x},178`;
    }
    // Horizontal grid lines that compress near top horizon
    for (let i = 0; i <= 10; i++) {
      const y = 30 + Math.pow(i / 10, 1.8) * 148;
      paths += ` M 0,${y.toFixed(1)} L 100,${y.toFixed(1)}`;
    }
    return paths;
  }, [isNeon]);

  // Specular cross flares for chrome metallic surface
  const chromeFlares = useMemo(() => {
    if (style.textureKind !== 'chrome') return [];
    const rng = mulberry32(card.seed + 777);
    return Array.from({ length: 4 }).map(() => ({
      cx: 10 + rng() * 80,
      cy: 25 + rng() * 128,
      r: 1.5 + rng() * 2,
      opacity: 0.65 + rng() * 0.35,
    }));
  }, [style.textureKind, card.seed]);


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

  const isDarkText = textColor === '#000000' || textColor === '#231F20' || textColor === '#2A2A2A';
  const pillBg = isDarkText ? 'rgba(35, 31, 32, 0.07)' : 'rgba(255, 255, 255, 0.14)';
  const pillBorder = isDarkText ? 'rgba(35, 31, 32, 0.12)' : 'rgba(255, 255, 255, 0.22)';

  const cssGradient = useMemo(() => {
    const stops = card.palette.join(', ');
    return `linear-gradient(135deg, ${stops})`;
  }, [card.palette]);

  const backgroundStyle = useMemo(() => {
    if (isPaperLike) return { backgroundColor: '#F8F4EC' };
    if (isNeon) return { backgroundColor: '#06060D' };
    if (Platform.OS === 'web') {
      return { backgroundImage: cssGradient } as any;
    }
    return {};
  }, [isPaperLike, isNeon, cssGradient]);

  return (
    <View style={styles.wrapper}>
      {/* ---- Background Layer ---- */}
      <View style={[StyleSheet.absoluteFill, backgroundStyle, { borderRadius: 24 }]} />

      {/* ---- SVG Overlay Layer ---- */}
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
        pointerEvents="none"
      >
        <Defs>
          {/* Paper Base Gradient & Vignette */}
          {isPaperLike && (
            <>
              <SvgLinearGradient id={`paper-base-${card.seed}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FCFAFA" />
                <Stop offset="50%" stopColor="#F6F0E6" />
                <Stop offset="100%" stopColor="#EFE6D6" />
              </SvgLinearGradient>
              <RadialGradient id={`paper-vignette-${card.seed}`} cx="50%" cy="50%" rx="70%" ry="70%">
                <Stop offset="40%" stopColor="#000000" stopOpacity="0" />
                <Stop offset="100%" stopColor="#4A382A" stopOpacity="0.12" />
              </RadialGradient>
            </>
          )}

          {/* Paper-Texture Color Washes */}
          {style.textureKind === 'grain' &&
            card.palette.slice(0, 3).map((color, index) => (
              <RadialGradient
                key={`paper-wash-${index}`}
                id={`paper-wash-${card.date}-${card.seed}-${index}`}
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
              >
                <Stop offset="0%" stopColor={color} stopOpacity="0.55" />
                <Stop offset="60%" stopColor={color} stopOpacity="0.25" />
                <Stop offset="100%" stopColor={color} stopOpacity="0" />
              </RadialGradient>
            ))}

          {/* Native Gradient (flat-gradient) */}
          {Platform.OS !== 'web' && !isPaperLike && !isNeon && (
            <SvgLinearGradient id={`grad-${card.date}-${card.seed}`} x1="0" y1="0" x2="1" y2="1">
              {card.palette.map((hex, i) => (
                <Stop
                  key={hex + i}
                  offset={`${(i / Math.max(card.palette.length - 1, 1)) * 100}%`}
                  stopColor={hex}
                />
              ))}
            </SvgLinearGradient>
          )}

          {/* Chrome Reflection Gradients */}
          {style.textureKind === 'chrome' && (
            <>
              <SvgLinearGradient id={`chrome-grad-1-${card.seed}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.75"/>
                <Stop offset="30%" stopColor={card.palette[0]} stopOpacity="0.4"/>
                <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.85"/>
                <Stop offset="70%" stopColor={card.palette[1] || card.palette[0]} stopOpacity="0.3"/>
                <Stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.6"/>
              </SvgLinearGradient>
              <SvgLinearGradient id={`chrome-grad-2-${card.seed}`} x1="1" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"/>
                <Stop offset="40%" stopColor={card.palette[2] || card.palette[0]} stopOpacity="0.45"/>
                <Stop offset="70%" stopColor="#111111" stopOpacity="0.65"/>
                <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.9"/>
              </SvgLinearGradient>
            </>
          )}

          {/* Watercolor Radial Gradients */}
          {isWatercolor &&
            card.palette.map((color, index) => (
              <RadialGradient
                key={`wc-grad-${index}`}
                id={`wc-grad-${card.date}-${card.seed}-${index}`}
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
              >
                <Stop offset="0%" stopColor={color} stopOpacity="0.82" />
                <Stop offset="65%" stopColor={color} stopOpacity="0.38" />
                <Stop offset="100%" stopColor={color} stopOpacity="0" />
              </RadialGradient>
            ))}

          {/* Neon Glow Gradients */}
          {isNeon &&
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

        {/* Paper Base Fill & Soft Vignette */}
        {isPaperLike && (
          <>
            <Rect x={0} y={0} width={VIEWBOX_W} height={VIEWBOX_H} fill={`url(#paper-base-${card.seed})`} />
            <Rect x={0} y={0} width={VIEWBOX_W} height={VIEWBOX_H} fill={`url(#paper-vignette-${card.seed})`} />
          </>
        )}

        {/* Native Gradient background */}
        {Platform.OS !== 'web' && !isPaperLike && !isNeon && (
          <Rect x={0} y={0} width={VIEWBOX_W} height={VIEWBOX_H} fill={`url(#grad-${card.date}-${card.seed})`} />
        )}

        {/* Paper-Texture Color Washes */}
        {style.textureKind === 'grain' &&
          paperColorWashes.map((wash, i) => (
            <Circle
              key={`wash-${i}`}
              cx={wash.cx}
              cy={wash.cy}
              r={wash.r}
              fill={`url(#${wash.fillId})`}
              opacity={wash.opacity}
            />
          ))}

        {/* Watercolor Blobs (Organic stains with bleeding edges and splatters) */}
        {isWatercolor && (
          <>
            {watercolorBlobs.map((blob, i) => (
              <React.Fragment key={`wc-blob-group-${i}`}>
                {/* Main bled wash */}
                <Path
                  d={blob.d}
                  fill={`url(#${blob.fillId})`}
                  opacity={blob.opacity}
                />
                {/* Drying edge/fringe line (classic watercolor accent) */}
                <Path
                  d={blob.d}
                  fill="none"
                  stroke={blob.color}
                  strokeWidth={0.45}
                  opacity={blob.opacity * 0.7}
                />
                {/* Ambient splatters */}
                {blob.splatters.map((s, idx) => (
                  <Circle
                    key={`splatter-${idx}`}
                    cx={s.cx}
                    cy={s.cy}
                    r={s.r}
                    fill={blob.color}
                    opacity={s.opacity}
                  />
                ))}
              </React.Fragment>
            ))}
          </>
        )}

        {/* Chrome metallic liquid paths */}
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
            {/* Glossy specular cross flares */}
            {chromeFlares.map((flare, i) => (
              <React.Fragment key={`flare-${i}`}>
                <Circle cx={flare.cx} cy={flare.cy} r={flare.r} fill="#FFFFFF" opacity={flare.opacity} />
                <Path
                  d={`M ${flare.cx},${flare.cy - flare.r * 3.5} L ${flare.cx},${flare.cy + flare.r * 3.5}`}
                  stroke="#FFFFFF"
                  strokeWidth={0.25}
                  opacity={flare.opacity * 0.75}
                />
                <Path
                  d={`M ${flare.cx - flare.r * 3.5},${flare.cy} L ${flare.cx + flare.r * 3.5},${flare.cy}`}
                  stroke="#FFFFFF"
                  strokeWidth={0.25}
                  opacity={flare.opacity * 0.75}
                />
              </React.Fragment>
            ))}
          </>
        )}

        {/* Neon Glow Blobs & Scanlines/Grid */}
        {isNeon && (
          <>
            {/* Retro perspective grid */}
            {neonGrid && (
              <Path
                d={neonGrid}
                fill="none"
                stroke={card.palette[1] || card.palette[0]}
                strokeWidth={0.25}
                opacity={0.2}
              />
            )}
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
            <Rect
              x={5} y={5}
              width={VIEWBOX_W - 10}
              height={VIEWBOX_H - 10}
              rx={10} ry={10}
              fill="none"
              stroke={card.palette[0]}
              strokeWidth={0.8}
              opacity={0.85}
            />
          </>
        )}

        {/* Paper Tooth Texture (White highlights & brown shadows) */}
        {isPaperLike &&
          paperTooth.map((t, i) => (
            <React.Fragment key={`tooth-${i}`}>
              <Circle cx={t.cx} cy={t.cy} r={t.r} fill="#FFFFFF" opacity={t.highlightOpacity} />
              <Circle cx={t.cx + 0.12} cy={t.cy + 0.12} r={t.r} fill="#2E2218" opacity={t.shadowOpacity} />
            </React.Fragment>
          ))}

        {/* Paper Pulp Specks & Flecks */}
        {isPaperLike &&
          paperPulpSpecks.map((p, i) => (
            <Circle key={`speck-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} opacity={p.opacity} />
          ))}

        {/* Cotton Paper Fibers */}
        {isPaperLike &&
          paperFibers.map((f, i) => (
            <Path
              key={`fiber-${i}`}
              d={f.d}
              stroke={f.stroke}
              strokeWidth={f.strokeWidth}
              opacity={f.opacity}
              strokeLinecap="round"
            />
          ))}

        {/* Debossed Fine-Art Card Pressed Double Borders for Paper */}
        {isPaperLike && (
          <>
            {/* Outer debossed border */}
            <Rect
              x={4}
              y={4}
              width={VIEWBOX_W - 8}
              height={VIEWBOX_H - 8}
              rx={8}
              ry={8}
              fill="none"
              stroke="#8A7768"
              strokeWidth={0.3}
              opacity={0.18}
            />
            {/* Inner embossed white border */}
            <Rect
              x={5.2}
              y={5.2}
              width={VIEWBOX_W - 10.4}
              height={VIEWBOX_H - 10.4}
              rx={7}
              ry={7}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={0.3}
              opacity={0.35}
            />
          </>
        )}
      </Svg>

      {/* ---- Text Overlay ---- */}
      <View style={styles.overlay}>
        <View style={styles.topRow}>
          <Text style={[logoFont, { color: textColor }]}>hueday</Text>
          {card.primaryEvent && (
            <View style={[styles.eventBadgePill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
              <Text style={styles.eventBadgeIcon}>{card.primaryEvent.badgeIcon}</Text>
              <Text style={[styles.eventBadgeText, { color: textColor }]} numberOfLines={1}>
                {card.primaryEvent.title}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          <Text style={[phraseFont, { color: textColor }]}>{card.phrase}</Text>

          {card.song && (
            <SpinningVinyl
              title={card.song.title}
              artist={card.song.artist}
              accentColor={card.palette[0] || '#F0A23B'}
              textColor={textColor}
              pillBg={pillBg}
              pillBorder={pillBorder}
            />
          )}

          {card.stampText && (
            <View style={[styles.stampContainer, { backgroundColor: pillBg, borderColor: pillBorder }]}>
              <Text style={[styles.stampText, { color: textColor }]}>
                🏷️ {card.stampText}
              </Text>
            </View>
          )}

          <Text style={[dateFont, { color: textColor }]}>
            {format(parseISO(card.date), 'd MMMM yyyy, EEEE', { locale })}
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
    position: 'relative',
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  eventBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    maxWidth: '65%',
  },
  eventBadgeIcon: {
    fontSize: 12,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stampContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  stampText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.85,
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
