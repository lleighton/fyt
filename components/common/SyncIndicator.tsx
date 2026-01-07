import { observer } from '@legendapp/state/react'
import { syncState } from '@legendapp/state'
import { XStack, Spinner, Text } from 'tamagui'
import { Check, AlertCircle, Cloud, CloudOff } from '@tamagui/lucide-icons'

import { store$ } from '@/lib/legend-state/store'

/**
 * Shows current sync status for the store
 *
 * States:
 * - Syncing: Spinner
 * - Synced: Green check
 * - Error: Red alert (will retry)
 * - Offline: Cloud with slash
 */
export const SyncIndicator = observer(() => {
  const profileState = syncState(store$.profile).get()
  const completionsState = syncState(store$.completions).get()
  const challengesState = syncState(store$.challenges).get()

  const hasError =
    profileState?.error ||
    completionsState?.error ||
    challengesState?.error
  const isPersistLoaded =
    profileState?.isPersistLoaded &&
    completionsState?.isPersistLoaded &&
    challengesState?.isPersistLoaded
  const isLoaded =
    profileState?.isLoaded &&
    completionsState?.isLoaded &&
    challengesState?.isLoaded

  // Still loading from local storage
  if (!isPersistLoaded) {
    return (
      <XStack alignItems="center" gap="$1">
        <Spinner size="small" color="$gray10" />
        <Text fontSize="$1" color="$gray10">
          Loading...
        </Text>
      </XStack>
    )
  }

  // Has error but will retry
  if (hasError) {
    return (
      <XStack alignItems="center" gap="$1">
        <AlertCircle size={14} color="$orange10" />
        <Text fontSize="$1" color="$orange10">
          Retrying...
        </Text>
      </XStack>
    )
  }

  // All loaded
  return (
    <XStack alignItems="center" gap="$1">
      <Check size={14} color="$green10" />
      <Text fontSize="$1" color="$green10">
        Synced
      </Text>
    </XStack>
  )
})

export default SyncIndicator
