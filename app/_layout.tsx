import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useKeepAwake } from 'expo-keep-awake';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { AppInitializer } from '../src/logic/appInitializer';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { COLORS } from '../src/config/colors';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const JannahTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.appBackground,
  },
};

export default function RootLayout() {
  useKeepAwake();
  const [appIsReady, setAppIsReady] = useState(false);
  
  useEffect(() => {
    async function prepare() {
      try {
        console.log('[RootLayout] Mounting...');
        await AppInitializer.initialize();
        console.log('[RootLayout] App initialized');
      } catch (e) {
        console.warn('[RootLayout] Error initializing:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      console.log('[RootLayout] App ready, forcing splash screen hide');
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  console.log('[RootLayout] Rendering');

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.appBackground }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider value={JannahTheme}>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.appBackground },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
            </Stack>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

