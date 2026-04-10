import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/config/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: COLORS.appBackground },
        animation: 'fade',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E5DD',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#4A7C59',
        tabBarInactiveTintColor: '#8B9D83',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Log Prayer',
          tabBarLabel: 'Prayer',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="moon-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jannah"
        options={{
          title: 'View Jannah',
          tabBarLabel: 'Jannah',
          sceneStyle: { backgroundColor: COLORS.grassBySeason.spring },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
