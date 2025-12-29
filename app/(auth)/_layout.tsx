import { useEffect } from 'react'
import { Redirect, Stack } from 'expo-router'
import { observer } from '@legendapp/state/react'
import { YStack, Spinner, Text } from 'tamagui'

import { auth$ } from '@/lib/legend-state/store'
import {
  registerForPushNotifications,
  setupNotificationListeners,
  setupAndroidNotificationChannel,
} from '@/lib/notifications'

/**
 * Auth-protected layout
 *
 * Redirects to login if not authenticated.
 * Shows loading state while checking auth.
 * Sets up push notifications when authenticated.
 *
 * Note: Onboarding check moved to individual screens to avoid redirect loops.
 */
function AuthLayout() {
  const session = auth$.session.get()
  const isLoading = auth$.isLoading.get()

  // Set up push notifications when authenticated
  useEffect(() => {
    if (!session?.user?.id) return

    // Set up Android notification channels
    setupAndroidNotificationChannel()

    // Set up notification listeners (tap handling)
    const cleanup = setupNotificationListeners()

    // Register for push notifications and save token
    registerForPushNotifications(session.user.id)

    return cleanup
  }, [session?.user?.id])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" bg="$background">
        <Spinner size="large" color="$color" />
        <Text mt="$4" color="$color">Loading...</Text>
      </YStack>
    )
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Redirect href="/(public)/login" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="challenge/[id]"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="challenge/create"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="group/[id]"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="group/[id]/invite"
        options={{
          presentation: 'modal',
        }}
      />
      {/* Tag System Routes */}
      <Stack.Screen
        name="tag/create"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="tag/[id]/respond"
        options={{
          presentation: 'modal',
        }}
      />
      {/* Onboarding */}
      <Stack.Screen
        name="onboarding/profile-setup"
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
        }}
      />
    </Stack>
  )
}

export default observer(AuthLayout)
