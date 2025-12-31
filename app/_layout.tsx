import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { TamaguiProvider, Theme } from 'tamagui'
import { observer } from '@legendapp/state/react'

import config from '@/tamagui.config'
import { auth$ } from '@/lib/legend-state/store'
import { useAuthLinking } from '@/lib/auth-linking'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

/**
 * Root layout component
 *
 * Provides:
 * - Tamagui theme provider
 * - Color scheme detection
 * - Auth state management
 * - Navigation stack
 */
function RootLayout() {
  const colorScheme = useColorScheme()
  const isLoading = auth$.isLoading.get()

  // Handle deep link authentication callbacks (magic links)
  useAuthLinking()

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync()
    }
  }, [isLoading])

  if (isLoading) {
    // Keep splash screen visible while loading
    return null
  }

  const isDark = colorScheme === 'dark'

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
      <Theme name={colorScheme ?? 'light'}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: {
              backgroundColor: isDark ? '#000000' : '#ffffff',
            },
            navigationBarColor: isDark ? '#000000' : '#ffffff',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(public)" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={isDark ? '#000000' : '#ffffff'} />
      </Theme>
    </TamaguiProvider>
  )
}

// Wrap in observer to react to auth state changes
export default observer(RootLayout)
