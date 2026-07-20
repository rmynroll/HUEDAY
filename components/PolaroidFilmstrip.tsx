import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { getPolaroidStyleForPalette } from '../lib/mediaRepository';

interface PolaroidPhoto {
  id: string;
  uri: string;
  caption?: string;
}

interface PolaroidFilmstripProps {
  photos: PolaroidPhoto[];
  palette: string[];
  onAddPhoto?: () => void;
  onUpdateCaption?: (photoId: string, caption: string) => void;
}

export default function PolaroidFilmstrip({
  photos,
  palette,
  onAddPhoto,
  onUpdateCaption,
}: PolaroidFilmstripProps) {
  const { t } = useTranslation();
  const { frameBgColor, shadowColor } = getPolaroidStyleForPalette(palette);
  const accentColor = palette[0] || '#E55B70';

  if (photos.length === 0 && !onAddPhoto) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: accentColor }]}>{t('polaroid.label')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {photos.map((photo) => (
          <PolaroidCard
            key={photo.id}
            photo={photo}
            frameBgColor={frameBgColor}
            shadowColor={shadowColor}
            accentColor={accentColor}
            onUpdateCaption={onUpdateCaption}
          />
        ))}

        {onAddPhoto && (
          <TouchableOpacity
            onPress={onAddPhoto}
            style={[styles.addPhotoBtn, { borderColor: accentColor + '40' }]}
            accessibilityLabel={t('polaroid.addPhotoA11y')}
          >
            <Text style={[styles.addPhotoPlus, { color: accentColor }]}>+</Text>
            <Text style={[styles.addPhotoLabel, { color: accentColor }]}>{t('polaroid.addPhotoLabel')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

/** Individual Polaroid card with editable caption */
function PolaroidCard({
  photo,
  frameBgColor,
  shadowColor,
  accentColor,
  onUpdateCaption,
}: {
  photo: PolaroidPhoto;
  frameBgColor: string;
  shadowColor: string;
  accentColor: string;
  onUpdateCaption?: (photoId: string, caption: string) => void;
}) {
  const { t } = useTranslation();
  const [captionText, setCaptionText] = useState(photo.caption || '');
  const [editing, setEditing] = useState(false);

  const handleBlur = () => {
    setEditing(false);
    if (onUpdateCaption && captionText !== photo.caption) {
      onUpdateCaption(photo.id, captionText);
    }
  };

  return (
    <View
      style={[
        styles.polaroidFrame,
        {
          backgroundColor: frameBgColor,
          shadowColor: shadowColor,
        },
      ]}
    >
      {/* Photo area */}
      <View style={styles.photoArea}>
        <Image source={{ uri: photo.uri }} style={styles.photoImage} />
      </View>

      {/* Polaroid bottom strip — editable caption */}
      <View style={styles.captionArea}>
        {editing ? (
          <TextInput
            style={[styles.captionInput, { color: shadowColor }]}
            value={captionText}
            onChangeText={setCaptionText}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            placeholder={t('polaroid.captionPlaceholder')}
            placeholderTextColor={shadowColor + '60'}
            maxLength={60}
            autoFocus
            multiline={false}
          />
        ) : (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={styles.captionTouchable}
            activeOpacity={0.7}
          >
            {captionText ? (
              <Text
                style={[styles.captionText, { color: shadowColor }]}
                numberOfLines={2}
              >
                {captionText}
              </Text>
            ) : (
              <Text style={[styles.captionPlaceholder, { color: shadowColor + '50' }]}>
                {t('polaroid.addNotePlaceholder')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tiny tape strip at top for realism */}
      <View style={[styles.tapeStrip, { backgroundColor: accentColor + '18' }]} />
    </View>
  );
}

const FRAME_WIDTH = 152;
const PHOTO_SIZE = FRAME_WIDTH - 16; // 8px padding each side

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 14,
  },

  // ---- Polaroid Frame ----
  polaroidFrame: {
    width: FRAME_WIDTH,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 4,
    borderRadius: 3,
    // Realistic Polaroid shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    // Slight warm paper tint
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 3px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)' }
      : {}),
  },
  photoArea: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },

  // ---- Caption area (bottom of Polaroid) ----
  captionArea: {
    minHeight: 36,
    paddingTop: 6,
    paddingBottom: 2,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  captionTouchable: {
    minHeight: 28,
    justifyContent: 'center',
  },
  captionText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Noteworthy-Light',
      android: 'sans-serif-light',
      default: 'cursive',
    }),
  },
  captionPlaceholder: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  captionInput: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.15)',
    fontFamily: Platform.select({
      ios: 'Noteworthy-Light',
      android: 'sans-serif-light',
      default: 'cursive',
    }),
  },

  // ---- Decorative tape ----
  tapeStrip: {
    position: 'absolute',
    top: -4,
    left: FRAME_WIDTH / 2 - 18,
    width: 36,
    height: 8,
    borderRadius: 1,
    transform: [{ rotate: '-2deg' }],
  },

  // ---- Add Photo Button ----
  addPhotoBtn: {
    width: FRAME_WIDTH,
    height: FRAME_WIDTH + 36,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    gap: 6,
  },
  addPhotoPlus: {
    fontSize: 32,
    fontWeight: '200',
  },
  addPhotoLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
