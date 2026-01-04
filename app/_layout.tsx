import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { TamaguiProvider, Theme } from 'tamagui'
import { observer } from '@legendapp/state/react'

import config from '@/tamagui.config'
import { auth$ } from '@/lib/legend-state/store'
import { useAuthLinking } from '@/lib/auth-linking'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initSentry } from '@/lib/monitoring'
import { initAnalytics, PostHogProvider, posthogConfig } from '@/lib/analytics'
import { SettingsProvider, useSettings } from '@/lib/settings-context'

// Initialize Sentry as early as possible
initSentry()

// Initialize PostHog synchronously at module load
initAnalytics()

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

/**
 * Inner layout that uses settings context for theme
 */
function AppContent() {
  const { effectiveTheme } = useSettings()
  const isLoading = auth$.isLoading.get()

  // Handle deep link authentication callbacks (magic links)
  useAuthLinking()

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync()
    }
  }, [isLoading])

  if (isLoading) {
    return null
  }

  const isDark = effectiveTheme === 'dark'

  return (
    <TamaguiProvider config={config} defaultTheme={effectiveTheme}>
      <Theme name={effectiveTheme}>
        <ErrorBoundary>
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
        </ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={isDark ? '#000000' : '#ffffff'} />
      </Theme>
    </TamaguiProvider>
  )
}

// Wrap AppContent in observer to react to auth state
const ObservedAppContent = observer(AppContent)

/**
 * Root layout component
 *
 * Provides:
 * - Settings provider (theme, notifications, preferences)
 * - Tamagui theme provider
 * - Auth state management
 * - Navigation stack
 */
function RootLayout() {
  return (
    <PostHogProvider
      apiKey={posthogConfig.apiKey}
      options={{ host: posthogConfig.host }}
      autocapture={false}
    >
      <SettingsProvider>
        <ObservedAppContent />
      </SettingsProvider>
    </PostHogProvider>
  )
}

export default RootLayout
