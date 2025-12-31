import { supabase, getCurrentUserId } from '@/lib/supabase'
import {
  profile$,
  groups$,
  challenges$,
  completions$,
  exercises$,
  tags$,
  tagRecipients$,
  streaks$,
  groupInvites$,
} from '@/lib/legend-state/store'

type RefreshResult = {
  success: boolean
  error?: string
  refreshedAt: Date
}

type RefreshOptions = {
  profile?: boolean
  groups?: boolean
  challenges?: boolean
  completions?: boolean
  exercises?: boolean
  tags?: boolean
  tagRecipients?: boolean
  streaks?: boolean
  groupInvites?: boolean
}

/**
 * Sync Service
 * Provides manual refresh capabilities for Legend State observables
 */
class SyncService {
  private isRefreshing = false
  private lastRefreshTime: Date | null = null

  /**
   * Get current refresh status
   */
  get status() {
    return {
      isRefreshing: this.isRefreshing,
      lastRefreshTime: this.lastRefreshTime,
    }
  }

  /**
   * Refresh all data for the current user
   */
  async refreshAll(): Promise<RefreshResult> {
    if (this.isRefreshing) {
      return { success: false, error: 'Refresh already in progress', refreshedAt: new Date() }
    }

    this.isRefreshing = true
    console.log('[SyncService] Starting full refresh...')

    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('Not authenticated')
      }

      // Refresh all data in parallel
      await Promise.all([
        this.refreshProfile(userId),
        this.refreshGroups(),
        this.refreshChallenges(),
        this.refreshCompletions(userId),
        this.refreshExercises(),
        this.refreshTags(userId),
        this.refreshTagRecipients(userId),
        this.refreshStreaks(userId),
        this.refreshGroupInvites(userId),
      ])

      this.lastRefreshTime = new Date()
      console.log('[SyncService] Full refresh completed')

      return { success: true, refreshedAt: this.lastRefreshTime }
    } catch (error: any) {
      console.error('[SyncService] Refresh error:', error)
      return { success: false, error: error.message, refreshedAt: new Date() }
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * Refresh specific data types
   */
  async refresh(options: RefreshOptions): Promise<RefreshResult> {
    if (this.isRefreshing) {
      return { success: false, error: 'Refresh already in progress', refreshedAt: new Date() }
    }

    this.isRefreshing = true
    console.log('[SyncService] Starting selective refresh...', options)

    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('Not authenticated')
      }

      const promises: Promise<void>[] = []

      if (options.profile) promises.push(this.refreshProfile(userId))
      if (options.groups) promises.push(this.refreshGroups())
      if (options.challenges) promises.push(this.refreshChallenges())
      if (options.completions) promises.push(this.refreshCompletions(userId))
      if (options.exercises) promises.push(this.refreshExercises())
      if (options.tags) promises.push(this.refreshTags(userId))
      if (options.tagRecipients) promises.push(this.refreshTagRecipients(userId))
      if (options.streaks) promises.push(this.refreshStreaks(userId))
      if (options.groupInvites) promises.push(this.refreshGroupInvites(userId))

      await Promise.all(promises)

      this.lastRefreshTime = new Date()
      console.log('[SyncService] Selective refresh completed')

      return { success: true, refreshedAt: this.lastRefreshTime }
    } catch (error: any) {
      console.error('[SyncService] Refresh error:', error)
      return { success: false, error: error.message, refreshedAt: new Date() }
    } finally {
      this.isRefreshing = false
    }
  }

  private async refreshProfile(userId: string): Promise<void> {
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[SyncService] Profile refresh error:', error)
      return
    }

    if (data) {
      ;(profile$ as any)[(data as any).id].set(data)
      console.log('[SyncService] Profile refreshed')
    }
  }

  private async refreshGroups(): Promise<void> {
    const { data, error } = await (supabase
      .from('groups') as any)
      .select(`
        *,
        members:group_members(
          user_id,
          role,
          joined_at,
          profile:profiles(id, display_name, avatar_url)
        )
      `)

    if (error) {
      console.error('[SyncService] Groups refresh error:', error)
      return
    }

    if (data) {
      const groupsMap: Record<string, any> = {}
      data.forEach((group: any) => {
        groupsMap[group.id] = group
      })
      groups$.set(groupsMap)
      console.log('[SyncService] Groups refreshed:', data.length)
    }
  }

  private async refreshChallenges(): Promise<void> {
    const { data, error } = await (supabase
      .from('challenges') as any)
      .select('*')

    if (error) {
      console.error('[SyncService] Challenges refresh error:', error)
      return
    }

    if (data) {
      const challengesMap: Record<string, any> = {}
      data.forEach((challenge: any) => {
        challengesMap[challenge.id] = challenge
      })
      challenges$.set(challengesMap)
      console.log('[SyncService] Challenges refreshed:', data.length)
    }
  }

  private async refreshCompletions(userId: string): Promise<void> {
    const { data, error } = await (supabase
      .from('completions') as any)
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('[SyncService] Completions refresh error:', error)
      return
    }

    if (data) {
      const completionsMap: Record<string, any> = {}
      data.forEach((completion: any) => {
        completionsMap[completion.id] = completion
      })
      completions$.set(completionsMap)
      console.log('[SyncService] Completions refreshed:', data.length)
    }
  }

  private async refreshExercises(): Promise<void> {
    const { data, error } = await (supabase
      .from('exercises') as any)
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('[SyncService] Exercises refresh error:', error)
      return
    }

    if (data) {
      const exercisesMap: Record<string, any> = {}
      data.forEach((exercise: any) => {
        exercisesMap[exercise.id] = exercise
      })
      exercises$.set(exercisesMap)
      console.log('[SyncService] Exercises refreshed:', data.length)
    }
  }

  private async refreshTags(userId: string): Promise<void> {
    const { data, error } = await (supabase
      .from('tags') as any)
      .select(`
        *,
        exercise:exercises(id, name, icon, type, unit, category),
        sender:profiles(id, display_name, avatar_url),
        group:groups(id, name)
      `)
      .eq('sender_id', userId)
      .eq('deleted', false)

    if (error) {
      console.error('[SyncService] Tags refresh error:', error)
      return
    }

    if (data) {
      const tagsMap: Record<string, any> = {}
      data.forEach((tag: any) => {
        tagsMap[tag.id] = tag
      })
      tags$.set(tagsMap)
      console.log('[SyncService] Tags refreshed:', data.length)
    }
  }

  private async refreshTagRecipients(userId: string): Promise<void> {
    const { data, error } = await (supabase
      .from('tag_recipients') as any)
      .select(`
        *,
        tag:tags!tag_recipients_tag_id_fkey(
          id,
          sender_id,
          exercise_id,
          value,
          proof_url,
          proof_type,
          is_public,
          group_id,
          expires_at,
          created_at,
          exercise:exercises(id, name, icon, type, unit, category),
          sender:profiles(id, display_name, avatar_url),
          group:groups(id, name)
        )
      `)
      .eq('recipient_id', userId)

    if (error) {
      console.error('[SyncService] TagRecipients refresh error:', error)
      return
    }

    if (data) {
      const recipientsMap: Record<string, any> = {}
      data.forEach((recipient: any) => {
        recipientsMap[recipient.id] = recipient
      })
      tagRecipients$.set(recipientsMap)
      console.log('[SyncService] TagRecipients refreshed:', data.length)
    }
  }

  private async refreshStreaks(userId: string): Promise<void> {
    const { data, error } = await (supabase
      .from('streaks') as any)
      .select(`
        *,
        partner:profiles!streaks_partner_id_fkey(id, display_name, avatar_url),
        group:groups(id, name)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('[SyncService] Streaks refresh error:', error)
      return
    }

    if (data) {
      const streaksMap: Record<string, any> = {}
      data.forEach((streak: any) => {
        streaksMap[streak.id] = streak
      })
      streaks$.set(streaksMap)
      console.log('[SyncService] Streaks refreshed:', data.length)
    }
  }

  private async refreshGroupInvites(userId: string): Promise<void> {
    const { data, error } = await (supabase
      .from('group_invites') as any)
      .select(`
        *,
        group:groups(id, name, avatar_url),
        inviter:profiles!group_invites_inviter_id_fkey(id, display_name, avatar_url)
      `)
      .eq('invitee_id', userId)
      .eq('status', 'pending')

    if (error) {
      console.error('[SyncService] GroupInvites refresh error:', error)
      return
    }

    if (data) {
      const invitesMap: Record<string, any> = {}
      data.forEach((invite: any) => {
        invitesMap[invite.id] = invite
      })
      groupInvites$.set(invitesMap)
      console.log('[SyncService] GroupInvites refreshed:', data.length)
    }
  }
}

// Export singleton instance
export const syncService = new SyncService()

/**
 * Hook for pull-to-refresh functionality
 */
export function useRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const onRefresh = async (options?: RefreshOptions) => {
    setIsRefreshing(true)
    try {
      if (options) {
        await syncService.refresh(options)
      } else {
        await syncService.refreshAll()
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  return { isRefreshing, onRefresh }
}

/**
 * Hook for auto-polling data at regular intervals
 *
 * @param options - Which data types to refresh
 * @param intervalMs - Polling interval in milliseconds (default: 30000 = 30s)
 * @param enabled - Whether polling is enabled (default: true)
 */
export function useAutoRefresh(
  options: RefreshOptions,
  intervalMs: number = 30000,
  enabled: boolean = true
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial refresh when hook mounts
    syncService.refresh(options)

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      syncService.refresh(options)
    }, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, intervalMs, JSON.stringify(options)])

  // Manual refresh function
  const refresh = useCallback(() => {
    return syncService.refresh(options)
  }, [JSON.stringify(options)])

  return { refresh }
}

/**
 * Hook for silent background refresh on focus + polling
 * Uses stale-while-revalidate pattern - shows existing data while refreshing
 *
 * @param options - Which data types to refresh
 * @param pollIntervalMs - Optional polling interval while focused (default: null = no polling)
 */
export function useSilentRefresh(
  options: RefreshOptions,
  pollIntervalMs: number | null = null
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useFocusEffect(
    useCallback(() => {
      // Silent refresh on focus - no loading state, just update data
      syncService.refresh(options)

      // Set up polling if interval provided
      if (pollIntervalMs) {
        intervalRef.current = setInterval(() => {
          syncService.refresh(options)
        }, pollIntervalMs)
      }

      // Cleanup on blur
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, [JSON.stringify(options), pollIntervalMs])
  )
}

/**
 * Hook for pull-to-refresh only (user-initiated)
 * Does NOT refresh on focus - use with useSilentRefresh for that
 *
 * @param options - Which data types to refresh
 */
export function usePullToRefresh(options: RefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await syncService.refresh(options)
    } finally {
      setIsRefreshing(false)
    }
  }, [JSON.stringify(options)])

  return { isRefreshing, onRefresh }
}

/**
 * Combined hook for screens: silent background refresh + pull-to-refresh
 * Stale-while-revalidate: shows existing data, refreshes silently, no flicker
 *
 * @param options - Which data types to refresh
 * @param pollIntervalMs - Polling interval in milliseconds (default: 30000 = 30s)
 */
export function useScreenRefresh(
  options: RefreshOptions,
  pollIntervalMs: number = 30000
) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isFocusedRef = useRef(false)

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true

      // Silent refresh on focus - no loading state
      syncService.refresh(options)

      // Set up polling while focused - also silent
      intervalRef.current = setInterval(() => {
        if (isFocusedRef.current) {
          syncService.refresh(options)
        }
      }, pollIntervalMs)

      // Cleanup on blur
      return () => {
        isFocusedRef.current = false
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, [JSON.stringify(options), pollIntervalMs])
  )

  // Manual refresh for pull-to-refresh - this DOES show loading
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await syncService.refresh(options)
    } finally {
      setIsRefreshing(false)
    }
  }, [JSON.stringify(options)])

  return { isRefreshing, onRefresh }
}

/**
 * @deprecated Use useSilentRefresh instead for background refresh
 * Kept for backwards compatibility
 */
export function useFocusRefresh(
  options: RefreshOptions,
  pollIntervalMs: number | null = null
) {
  useSilentRefresh(options, pollIntervalMs)
  return usePullToRefresh(options)
}

// Need to import React hooks
import { useState, useEffect, useRef, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
