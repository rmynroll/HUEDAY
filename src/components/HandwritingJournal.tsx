import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useHuedayStore } from '../../lib/storage';
import type { DrawingPath, DrawingPoint } from '../../types/journal';

// Platform specific canvas rendering
let Canvas: any = null;
let SkiaPath: any = null;
let Svg: any = null;
let SvgPath: any = null;

if (Platform.OS === 'web') {
  const SvgModule = require('react-native-svg');
  Svg = SvgModule.default || SvgModule;
  SvgPath = SvgModule.Path;
} else {
  try {
    const SkiaModule = require('@shopify/react-native-skia');
    Canvas = SkiaModule.Canvas;
    SkiaPath = SkiaModule.Path;
  } catch (e) {
    const SvgModule = require('react-native-svg');
    Svg = SvgModule.default || SvgModule;
    SvgPath = SvgModule.Path;
  }
}

interface HandwritingJournalProps {
  date: string;
  palette: string[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Temel 3 Renk (Ücretsiz kullanıcılar için)
const FREE_COLORS = [
  '#1C1C1E', // Siyah
  '#48484A', // Koyu Gri
  '#1A2F4C', // Lacivert
];

// Kalınlık Seçenekleri
const STROKES = [
  { label: 'İnce', value: 3 },
  { label: 'Orta', value: 6 },
  { label: 'Kalın', value: 12 },
];

const PAPER_BG = '#FCF9F2'; // Sıcak Krem/Kağıt rengi

// HSL to Hex Yardımcı Fonksiyonu
function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function HandwritingJournal({ date, palette }: HandwritingJournalProps) {
  const storeJournal = useHuedayStore((s) => s.handwritingJournals[date]);
  const saveHandwritingJournal = useHuedayStore((s) => s.saveHandwritingJournal);
  const isPremium = useHuedayStore((s) => s.isPremium);
  const togglePremium = useHuedayStore((s) => s.togglePremium);

  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  
  // Aktif renk listesi
  const [availableColors, setAvailableColors] = useState<string[]>(FREE_COLORS);
  const [currentColor, setCurrentColor] = useState(FREE_COLORS[0]);
  const [currentStroke, setCurrentStroke] = useState(STROKES[1].value);
  const [isEraser, setIsEraser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modaller
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Renk skalası değerleri
  const [selectedHue, setSelectedHue] = useState(180);
  const [selectedLightness, setSelectedLightness] = useState(50);
  const [sliderWidth, setSliderWidth] = useState(260);
  
  const previewColor = hslToHex(selectedHue, 85, selectedLightness);

  // Load existing paths
  useEffect(() => {
    if (storeJournal) {
      setPaths(storeJournal);
    } else {
      setPaths([]);
    }
  }, [date, storeJournal]);

  // 30 saniyede bir otomatik kayıt
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (paths.length > 0) {
        saveHandwritingJournal(date, paths);
      }
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [date, paths, saveHandwritingJournal]);

  const handleTouchStart = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath([{ x: locationX, y: locationY }]);
  };

  const handleTouchMove = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
  };

  const handleTouchEnd = () => {
    if (currentPath.length > 0) {
      const newPath: DrawingPath = {
        id: `path_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        points: currentPath,
        color: currentColor,
        strokeWidth: currentStroke,
        isEraser,
      };
      const updatedPaths = [...paths, newPath];
      setPaths(updatedPaths);
      setCurrentPath([]);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    saveHandwritingJournal(date, paths);
    setTimeout(() => {
      setIsSaving(false);
      if (Platform.OS !== 'web') {
        Alert.alert('Başarılı', 'Ajanda sayfanız kaydedildi. ✨');
      }
    }, 600);
  };

  const handleClear = () => {
    setPaths([]);
  };

  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  // Renk Ekleme Butonu
  const handleAddColorPress = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
    } else {
      setShowColorPicker(true);
    }
  };

  // Seçilen rengi listeye ekle
  const handleAddSelectedColor = () => {
    if (availableColors.includes(previewColor)) {
      setCurrentColor(previewColor);
    } else {
      setAvailableColors((prev) => [...prev, previewColor]);
      setCurrentColor(previewColor);
    }
    setShowColorPicker(false);
  };

  // Vektör noktalarını SVG Path stringine dönüştür
  const getSvgPathString = (points: DrawingPoint[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  // Ajanda Sayfası Satır Çizgileri
  const paperLines = [];
  const startY = 80;
  const lineSpacing = 30;
  for (let y = startY; y < SCREEN_HEIGHT - 180; y += lineSpacing) {
    paperLines.push(y);
  }

  // Günün mood rengi (ince şerit için)
  const moodColor = palette && palette.length > 0 ? palette[0] : '#E55B70';

  const isWebOrNoSkia = Platform.OS === 'web' || !Canvas;

  // Custom Slider Hareketi
  const handleHueSliderMove = (e: any) => {
    const { locationX } = e.nativeEvent;
    const sliderWidth = SCREEN_WIDTH - 80;
    const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
    setSelectedHue(Math.round(percentage * 360));
  };

  const handleLightnessSliderMove = (e: any) => {
    const { locationX } = e.nativeEvent;
    const sliderWidth = SCREEN_WIDTH - 80;
    const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
    // Açıklıktan koyuluğa (20% - 85% aralığı ideal çizim renkleri için uygundur)
    setSelectedLightness(Math.round(20 + percentage * 65));
  };

  return (
    <View style={styles.container}>
      {/* Günün Mood Rengi Şeridi */}
      <View style={[styles.moodStrip, { backgroundColor: moodColor }]} />

      {/* Üst Bilgi Paneli */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateLabel}>{date}</Text>
          <Text style={styles.titleLabel}>Günlük Rapor</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: moodColor }]}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet ✓'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Çizim/Yazı Alanı */}
      <View
        style={styles.canvasContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Defter Sayfası Çizgileri (Background) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {paperLines.map((y, idx) => (
            <View
              key={idx}
              style={[
                styles.paperLine,
                { top: y, borderBottomColor: idx === 0 ? 'rgba(229, 91, 112, 0.25)' : '#E3DFD5' },
              ]}
            />
          ))}
          {/* Sol Kırmızı Kenar Çizgisi */}
          <View style={styles.marginLine} />
        </View>

        {/* Platforma Duyarlı Tuval */}
        {isWebOrNoSkia ? (
          <Svg style={styles.canvas}>
            {/* Kaydedilmiş Çizimler */}
            {paths.map((p) => (
              <SvgPath
                key={p.id}
                d={getSvgPathString(p.points)}
                stroke={p.isEraser ? PAPER_BG : p.color}
                strokeWidth={p.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}

            {/* Aktif Çizilen Yol */}
            {currentPath.length > 0 && (
              <SvgPath
                d={getSvgPathString(currentPath)}
                stroke={isEraser ? PAPER_BG : currentColor}
                strokeWidth={currentStroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>
        ) : (
          <Canvas style={styles.canvas}>
            {/* Kaydedilmiş Çizimler */}
            {paths.map((p) => (
              <SkiaPath
                key={p.id}
                path={getSvgPathString(p.points)}
                color={p.isEraser ? PAPER_BG : p.color}
                style="stroke"
                strokeWidth={p.strokeWidth}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}

            {/* Aktif Çizilen Yol */}
            {currentPath.length > 0 && (
              <SkiaPath
                path={getSvgPathString(currentPath)}
                color={isEraser ? PAPER_BG : currentColor}
                style="stroke"
                strokeWidth={currentStroke}
                strokeCap="round"
                strokeJoin="round"
              />
            )}
          </Canvas>
        )}
      </View>

      {/* Araç Çubuğu Kontrolleri */}
      <View style={styles.toolbar}>
        {/* Mod Seçiciler: Kalem / Silgi */}
        <View style={styles.toolGroup}>
          <TouchableOpacity
            onPress={() => setIsEraser(false)}
            style={[styles.toolIcon, !isEraser && styles.activeTool]}
          >
            <Text style={styles.toolEmoji}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsEraser(true)}
            style={[styles.toolIcon, isEraser && styles.activeTool]}
          >
            <Text style={styles.toolEmoji}>🧽</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUndo} style={styles.toolIcon}>
            <Text style={styles.toolEmoji}>↩️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.toolIcon}>
            <Text style={styles.toolEmoji}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Renk Seçiciler (Silgi aktif değilse gösterilir) */}
        {!isEraser && (
          <View style={styles.colorGroup}>
            {availableColors.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setCurrentColor(color)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  currentColor === color && styles.activeColorCircle,
                ]}
              />
            ))}
            
            {/* Yeni Renk Ekleme Butonu (Tüm renklerin olduğu skalayı açar) */}
            <TouchableOpacity
              onPress={handleAddColorPress}
              style={[styles.addColorButton, { borderColor: moodColor }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.addColorText, { color: moodColor }]}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Kalınlık Seçiciler */}
        <View style={styles.strokeGroup}>
          {STROKES.map((s) => (
            <TouchableOpacity
              key={s.value}
              onPress={() => setCurrentStroke(s.value)}
              style={[
                styles.strokeButton,
                currentStroke === s.value && styles.activeStrokeButton,
              ]}
            >
              <View
                style={{
                  width: s.value + 4,
                  height: s.value + 4,
                  borderRadius: (s.value + 4) / 2,
                  backgroundColor: isEraser ? '#8E8E93' : currentColor,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Premium Upgrade Uyarısı Modalı */}
      <Modal
        visible={showPremiumModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.premiumCard}>
            <Text style={styles.premiumBadge}>👑 HUEDAY+</Text>
            <Text style={styles.premiumTitle}>Gelişmiş Renk Skalası</Text>
            <Text style={styles.premiumDesc}>
              Sınırları kaldırın! Hueday+ ile dilediğiniz rengi tamamen özelleştirilebilir spektrum skalasından seçip ajandanıza ekleyebilirsiniz.
            </Text>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: moodColor }]}
              onPress={() => {
                setShowPremiumModal(false);
                togglePremium();
                if (Platform.OS === 'web') {
                  alert('Hueday+ Sürümüne Yükseltildi! Artık renk spektrumunu kullanabilirsiniz. ✨');
                } else {
                  Alert.alert('Hueday+ Aktif!', 'Artık renk spektrumunu kullanabilirsiniz. ✨');
                }
              }}
            >
              <Text style={styles.upgradeBtnText}>Hueday+ Sürümüne Yükselt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowPremiumModal(false)}
            >
              <Text style={styles.closeBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gelişmiş Tüm Renklerin Olduğu Skala Seçici Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorPickerCard}>
            <Text style={styles.pickerTitle}>Renk Spektrum Skalası</Text>
            <Text style={styles.pickerDesc}>
              Parmağınızı sürükleyerek dilediğiniz tonu belirleyin:
            </Text>
            
            {/* Önizleme Dairesi */}
            <View style={[styles.colorPreview, { backgroundColor: previewColor }]} />
            <Text style={styles.colorHexCode}>{previewColor.toUpperCase()}</Text>

             {/* Ton Spektrumu (Hue Slider) */}
            <Text style={styles.sliderLabel}>Renk Tonu (Hue):</Text>
            {Platform.OS === 'web' ? (
              <input
                type="range"
                min="0"
                max="360"
                value={selectedHue}
                onChange={(e) => setSelectedHue(Number(e.target.value))}
                style={{
                  width: '90%',
                  height: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundImage: 'linear-gradient(to right, red, orange, yellow, green, cyan, blue, violet, magenta, red)',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  marginBottom: '20px',
                }}
              />
            ) : (
              <View
                style={styles.hueSliderContainer}
                onTouchStart={handleHueSliderMove}
                onTouchMove={handleHueSliderMove}
                onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
              >
                <View
                  pointerEvents="none"
                  style={styles.hueGradient}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.sliderPointer,
                    { left: `${Math.max(0, Math.min(92, (selectedHue / 360) * 100))}%` },
                  ]}
                />
              </View>
            )}

            {/* Açıklık/Koyuluk Spektrumu (Lightness Slider) */}
            <Text style={styles.sliderLabel}>Parlaklık (Lightness):</Text>
            {Platform.OS === 'web' ? (
              <input
                type="range"
                min="20"
                max="85"
                value={selectedLightness}
                onChange={(e) => setSelectedLightness(Number(e.target.value))}
                style={{
                  width: '90%',
                  height: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundImage: `linear-gradient(to right, #000 0%, ${hslToHex(selectedHue, 85, 50)} 50%, #FFF 100%)`,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  marginBottom: '20px',
                }}
              />
            ) : (
              <View
                style={styles.hueSliderContainer}
                onTouchStart={handleLightnessSliderMove}
                onTouchMove={handleLightnessSliderMove}
              >
                <View
                  pointerEvents="none"
                  style={[styles.lightnessGradient, { backgroundColor: hslToHex(selectedHue, 85, 50) }]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.sliderPointer,
                    { left: `${Math.max(0, Math.min(92, ((selectedLightness - 20) / 65) * 100))}%` },
                  ]}
                />
              </View>
            )}

            {/* Ekle Butonu */}
            <TouchableOpacity
              style={[styles.addColorSubmitButton, { backgroundColor: previewColor }]}
              onPress={handleAddSelectedColor}
            >
              <Text style={styles.addColorSubmitText}>Rengi Ajandaya Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowColorPicker(false)}
            >
              <Text style={styles.closeBtnText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAPER_BG,
  },
  moodStrip: {
    height: 4,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FAF7F0',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7DD',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8E',
    textTransform: 'uppercase',
  },
  titleLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: PAPER_BG,
  },
  canvas: {
    flex: 1,
  },
  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
  },
  marginLine: {
    position: 'absolute',
    left: 45,
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(229, 91, 112, 0.3)',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FAF7F0',
    borderTopWidth: 1,
    borderTopColor: '#EBE7DD',
    gap: 8,
  },
  toolGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toolIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBE7DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTool: {
    backgroundColor: '#D1CAC0',
  },
  toolEmoji: {
    fontSize: 18,
  },
  colorGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  activeColorCircle: {
    borderWidth: 2,
    borderColor: '#8E8E93',
    transform: [{ scale: 1.15 }],
  },
  addColorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  addColorText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
  strokeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strokeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBE7DD',
  },
  activeStrokeButton: {
    backgroundColor: '#D1CAC0',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  premiumBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
    letterSpacing: 1,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  premiumDesc: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  upgradeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  closeBtn: {
    paddingVertical: 10,
  },
  closeBtnText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  // Color Picker (Spektrum) Styles
  colorPickerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  pickerDesc: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 18,
    textAlign: 'center',
  },
  colorPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 8,
  },
  colorHexCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#48484A',
    marginBottom: 20,
  },
  sliderLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    marginLeft: 16,
  },
  hueSliderContainer: {
    width: '100%',
    height: 16,
    borderRadius: 8,
    marginBottom: 20,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'visible',
    paddingHorizontal: 8,
  },
  hueGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: '#CCC',
  },
  lightnessGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
    opacity: 0.8,
    backgroundColor: '#888',
  },
  sliderPointer: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    marginTop: -4,
  },
  addColorSubmitButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addColorSubmitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
