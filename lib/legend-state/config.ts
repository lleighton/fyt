import { configureSynced } from '@legendapp/state/sync'
import { configureSyncedSupabase } from '@legendapp/state/sync-plugins/supabase'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { v4 as uuidv4 } from 'uuid'

/**
 * Global sync configuration
 * - Uses MMKV for fast local persistence
 * - Retries failed syncs automatically
 * - Exponential backoff prevents server hammering
 */
export const syncedConfig = configureSynced({
  persist: {
    plugin: ObservablePersistMMKV,
    retrySync: true, // Persist pending changes for retry after restart
  },
  retry: {
    infinite: true, // Keep retrying until successful
    backoff: 'exponential', // 1s, 2s, 4s, 8s...
    maxDelay: 30000, // Cap at 30 seconds
  },
})

/**
 * Supabase-specific configuration
 * - UUID generation for local-first ID creation
 * - Diff syncing for bandwidth efficiency
 * - Soft deletes for data recovery
 */
configureSyncedSupabase({
  // Generate UUIDs locally so we can create records offline
  generateId: () => uuidv4(),

  // Only sync changes since last successful sync
  // changesSince: 'last-sync',

  // Field names for diff tracking
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',

  // Soft deletes - mark as deleted instead of removing
  // TEMPORARILY DISABLED for debugging
  // fieldDeleted: 'deleted',
})

/**
 * Re-export for convenience
 */
export { syncedConfig as defaultSyncConfig }
