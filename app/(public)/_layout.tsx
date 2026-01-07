import { Redirect, Stack } from 'expo-router'
import { observer } from '@legendapp/state/react'

import { auth$ } from '@/lib/legend-state/store'

/**
 * Public layout (unauthenticated routes)
 *
 * Redirects to home if already authenticated.
 */
function PublicLayout() {
  const session = auth$.session.get()
  const isLoading = auth$.isLoading.get()

  // Don't redirect while loading
  if (isLoading) {
    return null
  }

  // Redirect to home if authenticated
  if (session) {
    return <Redirect href="/(auth)/(tabs)/" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  )
}

export default observer(PublicLayout)
