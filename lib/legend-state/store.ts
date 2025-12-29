import { observable } from '@legendapp/state'
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

// Import config to ensure it's initialized
import './config'

// Test if MMKV is available (requires JSI)
let isMMKVAvailable = true
try {
  // Try to access MMKV module - will fail if JSI is not available
  const { MMKV } = require('react-native-mmkv')
  // Try to create a test instance
  new MMKV({ id: 'legend-state-test' })
} catch (error) {
  isMMKVAvailable = false
  console.warn(
    '[Legend State] MMKV not available - persistence disabled.',
    'This is expected when using remote debugging (Chrome DevTools).',
    'To enable offline persistence, disable remote debugging:',
    '1. Open debug menu (Cmd+D on iOS simulator)',
    '2. Tap "Stop Debugging" or "Stop Remote JS Debugging"',
    '3. Reload the app'
  )
}

/**
 * Safe MMKV persistence that handles JSI unavailability
 * (e.g., when remote debugging is enabled)
 *
 * Returns undefined if MMKV is not available, which disables persistence
 * but allows the app to continue working without crashes.
 */
function getSafePersistConfig(name: string) {
  if (!isMMKVAvailable) {
    return undefined
  }

  return {
    name,
    plugin: ObservablePersistMMKV,
  }
}

type Tables = Database['public']['Tables']
type Profile = Tables['profiles']['Row']
type Challenge = Tables['challenges']['Row']
type Completion = Tables['completions']['Row']
type Group = Tables['groups']['Row']
type ChallengeParticipant = Tables['challenge_participants']['Row']
// Tag system types
type Exercise = Tables['exercises']['Row']
type Tag = Tables['tags']['Row']
type TagRecipient = Tables['tag_recipients']['Row']
type Streak = Tables['streaks']['Row']

/**
 * Challenges observable - synced with Supabase
 * Using separate observable per collection as per Legend State v3 pattern
 */
export const challenges$ = observable(
  syncedSupabase({
    supabase,
    collection: 'challenges',
    persist: getSafePersistConfig('challenges_v7'),
    realtime: true,
    debounceSet: 500,
    // Debug: log what we get back
    transform: {
      load: (value: any) => {
        console.log('[challenges$] load transform received:', value)
        return value
      },
    },
  })
)

/**
 * Profile observable - synced with Supabase
 * Note: We fetch as object (map) then access as value in store$ wrapper
 */
export const profile$ = observable(
  syncedSupabase({
    supabase,
    collection: 'profiles',
    filter: (async (select: any) => {
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')
      return select.eq('id', userId)
    }) as any,
    // Don't use 'as: value' - it causes issues with async filters
    // Instead we'll access it as an object in the store$ wrapper
    persist: getSafePersistConfig('profile_v3'),
    realtime: true,
  })
)

/**
 * Participants observable - synced with Supabase
 */
export const participants$ = observable(
  syncedSupabase({
    supabase,
    collection: 'challenge_participants',
    select: (from) =>
      from.select(`
        *,
        profile:profiles(id, display_name, avatar_url)
      `) as any,
    persist: getSafePersistConfig('participants_v2'),
    realtime: true,
  })
)

/**
 * Completions observable - synced with Supabase
 */
export const completions$ = observable(
  syncedSupabase({
    supabase,
    collection: 'completions',
    filter: (async (select: any) => {
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')
      return select.eq('user_id', userId)
    }) as any,
    persist: getSafePersistConfig('completions_v2'),
    realtime: true,
  })
)

/**
 * Groups observable - synced with Supabase
 */
export const groups$ = observable(
  syncedSupabase({
    supabase,
    collection: 'groups',
    select: (from) =>
      from.select(`
        *,
        members:group_members(
          user_id,
          role,
          profile:profiles(id, display_name, avatar_url)
        )
      `) as any,
    persist: getSafePersistConfig('groups_v2'),
    realtime: true,
  })
)

// ============================================
// TAG SYSTEM OBSERVABLES
// ============================================

/**
 * Exercises observable - read-only list of bodyweight exercises
 * Synced from Supabase but not user-editable
 */
export const exercises$ = observable(
  syncedSupabase({
    supabase,
    collection: 'exercises',
    filter: (select: any) => select.eq('is_active', true).order('display_order'),
    persist: getSafePersistConfig('exercises_v1'),
    realtime: false, // Exercises don't change often
  })
)

/**
 * Tags observable - user's sent tags
 * Includes exercise details for display
 */
export const tags$ = observable(
  syncedSupabase({
    supabase,
    collection: 'tags',
    select: (from) =>
      from.select(`
        *,
        exercise:exercises(id, name, icon, type, unit, category),
        sender:profiles(id, display_name, avatar_url),
        group:groups(id, name)
      `) as any,
    filter: (async (select: any) => {
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')
      return select.eq('sender_id', userId).eq('deleted', false)
    }) as any,
    persist: getSafePersistConfig('tags_v1'),
    realtime: true,
  })
)

/**
 * Tag Recipients observable - tags where user is recipient
 * This is the "inbox" of pending tags
 */
export const tagRecipients$ = observable(
  syncedSupabase({
    supabase,
    collection: 'tag_recipients',
    select: (from) =>
      from.select(`
        *,
        tag:tags(
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
      `) as any,
    filter: (async (select: any) => {
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')
      return select.eq('recipient_id', userId)
    }) as any,
    persist: getSafePersistConfig('tag_recipients_v1'),
    realtime: true,
  })
)

/**
 * Streaks observable - user's tag streaks
 * Includes pair streaks (with partner details) and group streaks
 */
export const streaks$ = observable(
  syncedSupabase({
    supabase,
    collection: 'streaks',
    select: (from) =>
      from.select(`
        *,
        partner:profiles!streaks_partner_id_fkey(id, display_name, avatar_url),
        group:groups(id, name)
      `) as any,
    filter: (async (select: any) => {
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')
      return select.eq('user_id', userId)
    }) as any,
    persist: getSafePersistConfig('streaks_v1'),
    realtime: true,
  })
)

/**
 * Legacy store$ for backwards compatibility
 * Maps to the new separate observables
 */
export const store$: any = {
  // Profile accessor - extracts single profile from map
  profile: {
    get: () => {
      const profileMap = profile$.get()
      if (!profileMap) return undefined
      // Get the first (and only) profile from the map
      const profiles = Object.values(profileMap)
      return profiles[0] as Profile | undefined
    },
    set: (value: Profile) => {
      if (!value?.id) return
      // Set the profile in the map using its ID as key
      ;(profile$ as any)[value.id].set(value)
    },
  },
  challenges: challenges$,
  participants: participants$,
  completions: completions$,
  groups: groups$,

  // Tag system accessors
  exercises: exercises$,
  tags: tags$,
  tagRecipients: tagRecipients$,
  streaks: streaks$,

  /**
   * Computed: Activity grid data (GitHub-style)
   * Returns { [date]: count } for last 365 days
   */
  activityGrid: (): Record<string, number> => {
    const completions = completions$.get()
    const grid: Record<string, number> = {}

    // Initialize last 365 days with 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(12, 0, 0, 0) // Set to noon to avoid DST issues
      const key = date.toISOString().split('T')[0]
      if (key) {
        grid[key] = 0
      }
    }

    // Count completions per day
    if (completions) {
      Object.values(completions).forEach((completion: any) => {
        if (completion?.completed_at) {
          const date = completion.completed_at.split('T')[0]
          if (date && grid[date] !== undefined) {
            grid[date]++
          }
        }
      })
    }

    return grid
  },

  /**
   * Computed: Current streak count
   */
  currentStreak: (): number => {
    const grid = store$.activityGrid()
    let streak = 0
    const today = new Date()

    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(12, 0, 0, 0) // Set to noon to avoid DST issues
      const key = date.toISOString().split('T')[0]

      if (key && grid[key] && grid[key] > 0) {
        streak++
      } else if (i > 0) {
        // Allow today to be incomplete
        break
      }
    }

    return streak
  },

  /**
   * Computed: Challenges by type
   */
  challengesByType: () => {
    const challenges = challenges$.get()
    const byType: Record<string, Challenge[]> = {
      amrap: [],
      max_effort: [],
      timed: [],
      distance: [],
    }

    if (challenges) {
      Object.values(challenges).forEach((challenge: any) => {
        const type = challenge?.challenge_type
        if (type && byType[type]) {
          byType[type]?.push(challenge)
        }
      })
    }

    return byType
  },

  /**
   * Computed: Activity data for time period (for charts)
   * Returns array of { date: string, count: number } for last N days
   */
  activityForPeriod: (days: number): Array<{ date: string; count: number }> => {
    const completions = completions$.get()
    const data: Array<{ date: string; count: number }> = []
    const today = new Date()

    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(12, 0, 0, 0) // Set to noon to avoid DST issues
      const key = date.toISOString().split('T')[0]
      if (key) {
        data.push({ date: key, count: 0 })
      }
    }

    // Count completions per day
    if (completions) {
      Object.values(completions).forEach((completion: any) => {
        if (completion?.completed_at) {
          const completionDate = completion.completed_at.split('T')[0]
          const dataPoint = data.find((d) => d.date === completionDate)
          if (dataPoint) {
            dataPoint.count++
          }
        }
      })
    }

    return data
  },

  // ============================================
  // TAG SYSTEM COMPUTED FUNCTIONS
  // ============================================

  /**
   * Computed: Pending tags for current user (inbox)
   * Returns tags that are pending and not expired
   */
  pendingTags: (): any[] => {
    const recipients = tagRecipients$.get()
    if (!recipients) return []

    const now = new Date()
    return Object.values(recipients)
      .filter((r: any) => {
        if (r?.status !== 'pending') return false
        if (!r?.tag?.expires_at) return false
        return new Date(r.tag.expires_at) > now
      })
      .sort((a: any, b: any) => {
        // Sort by expiry time (most urgent first)
        return new Date(a.tag?.expires_at || 0).getTime() - new Date(b.tag?.expires_at || 0).getTime()
      })
  },

  /**
   * Computed: User's public tag streak
   */
  tagStreakPublic: (): number => {
    const streaksData = streaks$.get()
    if (!streaksData) return 0

    const publicStreak = Object.values(streaksData).find(
      (s: any) => s?.streak_type === 'public'
    ) as any

    return publicStreak?.current_count || 0
  },

  /**
   * Computed: Get pair streak with specific user
   */
  tagStreakWithUser: (partnerId: string): { current: number; longest: number } | null => {
    const streaksData = streaks$.get()
    if (!streaksData) return null

    const pairStreak = Object.values(streaksData).find(
      (s: any) => s?.streak_type === 'pair' && s?.partner_id === partnerId
    ) as any

    if (!pairStreak) return null

    return {
      current: pairStreak.current_count || 0,
      longest: pairStreak.longest_count || 0,
    }
  },

  /**
   * Computed: Exercises by category
   */
  exercisesByCategory: (): Record<string, Exercise[]> => {
    const exercisesData = exercises$.get()
    const byCategory: Record<string, Exercise[]> = {
      upper_body: [],
      core: [],
      lower_body: [],
      full_body: [],
    }

    if (exercisesData) {
      Object.values(exercisesData).forEach((exercise: any) => {
        const cat = exercise?.category
        if (cat && byCategory[cat]) {
          byCategory[cat].push(exercise)
        }
      })
    }

    return byCategory
  },

  /**
   * Computed: All pair streaks (for display)
   */
  pairStreaks: (): any[] => {
    const streaksData = streaks$.get()
    if (!streaksData) return []

    return Object.values(streaksData)
      .filter((s: any) => s?.streak_type === 'pair' && s?.current_count > 0)
      .sort((a: any, b: any) => (b?.current_count || 0) - (a?.current_count || 0))
  },

  /**
   * Computed: All group streaks (for display)
   */
  groupStreaks: (): any[] => {
    const streaksData = streaks$.get()
    if (!streaksData) return []

    return Object.values(streaksData)
      .filter((s: any) => s?.streak_type === 'group' && s?.current_count > 0)
      .sort((a: any, b: any) => (b?.current_count || 0) - (a?.current_count || 0))
  },
}

/**
 * Auth state observable (separate from main store)
 */
export const auth$ = observable({
  session: null as Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >['data']['session'],
  isLoading: true,
  isAuthenticated: (): boolean => {
    return !!auth$.session.get()
  },
})

// Initialize auth listener
supabase.auth.getSession().then(({ data: { session } }) => {
  auth$.session.set(session)
  auth$.isLoading.set(false)
})

supabase.auth.onAuthStateChange((_event, session) => {
  auth$.session.set(session)
  auth$.isLoading.set(false)
})
