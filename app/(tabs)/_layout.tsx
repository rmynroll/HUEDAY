import { Tabs, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: useClientOnlyValue(false, true),
        headerRight: () => (
          <Pressable onPress={() => router.push('/settings')} style={{ marginRight: 16 }} hitSlop={12}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.today'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎨</Text>,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('nav.calendar'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t('nav.journal', 'Ajanda'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✏️</Text>,
        }}
      />
      <Tabs.Screen
        name="mood-calendar"
        options={{
          title: t('nav.moodCalendar'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🌈</Text>,
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: t('nav.studio'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🖌️</Text>,
        }}
      />
      <Tabs.Screen
        name="album"
        options={{
          title: t('nav.album'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏆</Text>,
        }}
      />
      <Tabs.Screen
        name="wellness"
        options={{
          title: t('nav.wellness', 'Duygu Rehberi'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🧘</Text>,
        }}
      />
    </Tabs>
  );
}
