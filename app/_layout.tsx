import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { initI18n } from '@/lib/i18n';
import { useHuedayStore } from '@/lib/storage';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [i18nReady, setI18nReady] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    initI18n().finally(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    if (loaded && i18nReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, i18nReady]);

  if (!loaded || !i18nReady) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const user = useHuedayStore((s) => s.user);
  const hasHydrated = useHuedayStore((s) => s.hasHydrated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to Auth screen if not logged in
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      // Redirect to main tabs if logged in
      router.replace('/(tabs)');
    }
  }, [user, segments, hasHydrated]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="card/[date]" options={{ presentation: 'modal', title: t('nav.dayCard') }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', title: t('nav.settings') }} />
        <Stack.Screen name="wrapped" options={{ presentation: 'modal', title: t('nav.wrapped') }} />
      </Stack>
    </ThemeProvider>
  );
}
