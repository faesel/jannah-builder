import { Tabs } from 'expo-router';

export default function TabLayout() {
  console.log('[TabLayout] Rendering');
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: false,
        sceneStyle: { backgroundColor: '#F5F7F3' },
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
        }}
      />
      <Tabs.Screen
        name="jannah"
        options={{
          title: 'View Jannah',
          tabBarLabel: 'Jannah',
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          tabBarLabel: 'Stats',
        }}
      />
    </Tabs>
  );
}
