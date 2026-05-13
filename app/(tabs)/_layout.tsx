import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../src/config/colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: COLORS.appBackground },
        animation: 'fade',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: (Platform.OS === 'ios' ? 88 : 64) + (Platform.OS === 'android' ? insets.bottom : 0),
          paddingTop: 6,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : undefined,
          ...Platform.select({
            ios: {
              shadowColor: '#2C4A3E',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            },
            android: { elevation: 12 },
          }),
        },
        tabBarActiveTintColor: '#4A7C59',
        tabBarInactiveTintColor: '#B0BFA8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Log Prayer',
          tabBarLabel: 'Prayer',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'moon' : 'moon-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jannah"
        options={{
          title: 'View Jannah',
          tabBarLabel: 'Jannah',
          sceneStyle: { backgroundColor: COLORS.grass },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
