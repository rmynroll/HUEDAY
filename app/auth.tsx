import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from '@/components/Themed';
import { useHuedayStore } from '../lib/storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AuthScreen() {
  const { t } = useTranslation();
  const login = useHuedayStore((s) => s.login);
  const signUp = useHuedayStore((s) => s.signUp);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Breathing animation for the logo blob
  const breathe = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.05, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0.97, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('E-posta ve şifre alanları zorunludur.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    if (!email.includes('@')) {
      setError('Geçersiz e-posta formatı.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      if (mode === 'login') {
        const ok = await login(email.trim().toLowerCase(), password);
        if (ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
          setTimeout(() => router.replace('/(tabs)'), 900);
        } else {
          setError('E-posta veya şifre hatalı.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
      } else {
        if (!name.trim() || !birthday.trim()) {
          setError('İsim ve doğum günü alanları zorunludur.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          setLoading(false);
          return;
        }
        const bdayRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
        if (!bdayRegex.test(birthday.trim())) {
          setError('Doğum günü formatı AA-GG olmalıdır (Ör: 07-20).');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          setLoading(false);
          return;
        }
        const ok = await signUp(name.trim(), email.trim().toLowerCase(), password, birthday.trim());
        if (ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setSuccess('Kayıt başarılı! Giriş yapılıyor...');
          setTimeout(() => router.replace('/(tabs)'), 900);
        } else {
          setError('Bu e-posta adresi zaten kullanımda.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Deep dark background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.bgBase} />
        {/* Soft ambient glows matching the logo */}
        <View style={[styles.ambientGlow, { backgroundColor: '#7B2FBE', top: '-5%', left: '-20%', width: 300, height: 300 }]} />
        <View style={[styles.ambientGlow, { backgroundColor: '#FF7A50', top: '5%', right: '-20%', width: 260, height: 260 }]} />
        <View style={[styles.ambientGlow, { backgroundColor: '#4E9FE5', top: '50%', right: '-25%', width: 280, height: 280 }]} />
        <View style={[styles.ambientGlow, { backgroundColor: '#C2579B', top: '30%', left: '-20%', width: 250, height: 250 }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo Area ── */}
        <View style={styles.logoArea}>
          <Animated.View style={[styles.blobWrapper, { transform: [{ scale: breathe }], opacity: shimmerOpacity }]}>
            <Image
              source={require('../assets/images/logo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.appName}>hueday</Text>
          <Text style={styles.tagline}>Her renk bir his, her gün bir keşif</Text>
        </View>

        {/* ── Tab Switcher ── */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, mode === 'login' && styles.tabBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setMode('login'); setError(null); setSuccess(null);
            }}
          >
            <Text style={[styles.tabTxt, mode === 'login' && styles.tabTxtActive]}>Giriş Yap</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, mode === 'signup' && styles.tabBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setMode('signup'); setError(null); setSuccess(null);
            }}
          >
            <Text style={[styles.tabTxt, mode === 'signup' && styles.tabTxtActive]}>Kayıt Ol</Text>
          </Pressable>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {mode === 'login' ? 'Tekrar Hoş Geldiniz ✦' : 'Aramıza Katılın ✦'}
          </Text>

          {error   && <View style={styles.alertBox}><Text style={styles.alertErrorTxt}>{error}</Text></View>}
          {success && <View style={[styles.alertBox, styles.alertSuccess]}><Text style={styles.alertSuccessTxt}>{success}</Text></View>}

          {mode === 'signup' && (
            <>
              <Text style={styles.fieldLabel}>İsim Soyisim</Text>
              <TextInput
                style={styles.input}
                placeholder="Adınızı yazın"
                placeholderTextColor="#6B6B8A"
                value={name}
                onChangeText={setName}
              />
            </>
          )}

          <Text style={styles.fieldLabel}>E-Posta</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@mail.com"
            placeholderTextColor="#6B6B8A"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.fieldLabel}>Şifre</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={styles.pwInput}
              placeholder="••••••••"
              placeholderTextColor="#6B6B8A"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowPassword(!showPassword);
              }}
            >
              <Text style={styles.eyeTxt}>{showPassword ? '👁️' : '🙈'}</Text>
            </Pressable>
          </View>

          {mode === 'signup' && (
            <>
              <Text style={styles.fieldLabel}>Doğum Günü <Text style={styles.hint}>(AA-GG — Örn: 07-20)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="07-20"
                placeholderTextColor="#6B6B8A"
                maxLength={5}
                value={birthday}
                onChangeText={setBirthday}
              />
            </>
          )}

          {/* Submit button with gradient */}
          <Pressable onPress={handleSubmit} disabled={loading} style={styles.submitWrap}>
            <LinearGradient
              colors={['#A259FF', '#FF6B9D', '#4E9FE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.submitTxt}>{mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</Text>
              }
            </LinearGradient>
          </Pressable>
        </View>

        {/* bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  bgBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0A0A0F',
  },
  ambientGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.18,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    marginBottom: 36,
    backgroundColor: 'transparent',
  },
  blobWrapper: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    borderRadius: (SCREEN_WIDTH * 0.55) / 2,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#A259FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 32,
    fontWeight: '300',
    color: '#C9AAFF',
    letterSpacing: 8,
    textTransform: 'lowercase',
  },
  tagline: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B6B8A',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(162, 89, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(162, 89, 255, 0.4)',
  },
  tabTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B8A',
  },
  tabTxtActive: {
    color: '#C9AAFF',
  },

  // Form card
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    gap: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E8E8FF',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8888AA',
    marginBottom: -4,
    letterSpacing: 0.5,
  },
  hint: {
    fontWeight: '400',
    color: '#555570',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#E8E8FF',
  },

  // Password row
  pwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  pwInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#E8E8FF',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeTxt: {
    fontSize: 16,
  },

  // Submit
  submitWrap: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#A259FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  submitGradient: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  submitTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Alerts
  alertBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  alertErrorTxt: {
    color: '#FF8080',
    fontSize: 12,
    fontWeight: '600',
  },
  alertSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  alertSuccessTxt: {
    color: '#80FF99',
    fontSize: 12,
    fontWeight: '600',
  },
});
