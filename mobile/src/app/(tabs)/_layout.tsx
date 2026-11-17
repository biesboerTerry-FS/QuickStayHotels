import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabs: { name: string; title: string; a11y: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Home', a11y: 'Home tab', icon: 'home-outline', iconActive: 'home' },
  { name: 'hotels', title: 'Hotels', a11y: 'Browse hotels', icon: 'bed-outline', iconActive: 'bed' },
  { name: 'saved', title: 'Saved', a11y: 'Saved rooms', icon: 'heart-outline', iconActive: 'heart' },
  { name: 'bookings', title: 'Bookings', a11y: 'My bookings', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'profile', title: 'Account', a11y: 'Account and settings', icon: 'person-outline', iconActive: 'person' },
];

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary as string,
        tabBarInactiveTintColor: colors.muted as string,
        tabBarStyle: { backgroundColor: colors.surface as string, borderTopColor: colors.border as string },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.a11y,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} size={size} color={color as string} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
