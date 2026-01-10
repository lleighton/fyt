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
type ExerciseVariant = Tables['exercise_variants']['Row']
type Tag = Tables['tags']['Row']
type TagRecipient = Tables['tag_recipients']['Row']
type Streak = Tables['streaks']['Row']
type GroupGoal = Tables['group_goals']['Row']

// Personal records type (not yet in generated types)
type PersonalRecord = {
  id: string
  user_id: string
  exercise_id: string
  best_value: number
  best_date: string
  total_completions: number
  last_value: number | null
  last_date: string | null
  created_at: string
  updated_at: string
}

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
          joined_at,
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
 * Exercise Variants observable - links variant exercises to parents with scaling factors
 * e.g., Knee Pushups -> Pushups with 0.5x scaling
 */
export const exerciseVariants$ = observable(
  syncedSupabase({
    supabase,
    collection: 'exercise_variants',
    persist: getSafePersistConfig('exercise_variants_v1'),
    realtime: false, // Variants don't change often
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
 * Group Invites observable - pending group invitations for current user
 * Real-time sync to show invitations immediately when received
 */
export const groupInvites$ = observable(
  syncedSupabase({
    supabase,
    collection: 'group_invites',
    select: (from) =>
      from.select(`
        *,
        group:groups(id, name, avatar_url),
        inviter:profiles!group_invites_inviter_id_fkey(id, display_name, avatar_url)
      `) as any,
    filter: (async (select: any) => {
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')
      return select.eq('invitee_id', userId).eq('status', 'pending')
    }) as any,
    persist: getSafePersistConfig('group_invites_v1'),
    realtime: true,
  })
)

/**
 * Personal Records observable - user's personal bests per exercise
 * Includes exercise details for display
 */
export const personalRecords$ = observable(
  syncedSupabase({
    supabase,
    collection: 'personal_records',
    select: (from) =>
      from.select(`
        *,
        exercise:exercises(id, name, icon, type, unit, category)
      `) as any,
    filter: (async (select: any) => {
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')
      return select.eq('user_id', userId).order('best_date', { ascending: false })
    }) as any,
    persist: getSafePersistConfig('personal_records_v1'),
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
  exerciseVariants: exerciseVariants$,
  tags: tags$,
  tagRecipients: tagRecipients$,
  streaks: streaks$,

  // Group invites accessor
  groupInvites: groupInvites$,

  // Personal records accessor
  personalRecords: personalRecords$,

  /**
   * Computed: Activity grid data (GitHub-style)
   * Returns { [date]: count } for last 365 days
   * Includes both challenge completions AND tag response completions
   */
  activityGrid: (): Record<string, number> => {
    const completions = completions$.get()
    const tagRecipients = tagRecipients$.get()
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

    // Count challenge completions per day
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

    // Count tag response completions per day
    if (tagRecipients) {
      Object.values(tagRecipients).forEach((recipient: any) => {
        if (recipient?.status === 'completed' && recipient?.completed_at) {
          const date = recipient.completed_at.split('T')[0]
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
   * Computed: Longest streak count (all-time best)
   * Scans through all activity data to find the longest consecutive streak
   */
  longestStreak: (): number => {
    const grid = store$.activityGrid()
    let longest = 0
    let current = 0

    // Get sorted dates from oldest to newest
    const dates = Object.keys(grid).sort()

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i]
      if (date && grid[date] && grid[date] > 0) {
        // Check if this is consecutive with previous day
        if (i > 0) {
          const prevDate = dates[i - 1]
          const currentDate = new Date(date)
          const previousDate = new Date(prevDate || '')
          const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays === 1) {
            current++
          } else {
            // Gap in dates, start new streak
            current = 1
          }
        } else {
          current = 1
        }

        if (current > longest) {
          longest = current
        }
      } else {
        current = 0
      }
    }

    return longest
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
   * Includes both challenge completions AND tag response completions
   */
  activityForPeriod: (days: number): Array<{ date: string; count: number }> => {
    const completions = completions$.get()
    const tagRecipients = tagRecipients$.get()
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

    // Count challenge completions per day
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

    // Count tag response completions per day
    if (tagRecipients) {
      Object.values(tagRecipients).forEach((recipient: any) => {
        if (recipient?.status === 'completed' && recipient?.completed_at) {
          const completionDate = recipient.completed_at.split('T')[0]
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
   * Computed: Get variant info for an exercise
   * Returns parent exercise info if this is a variant, null otherwise
   */
  getExerciseVariantInfo: (exerciseId: string): {
    isVariant: boolean
    parentExercise: Exercise | null
    scalingFactor: number
  } => {
    const variantsData = exerciseVariants$.get()
    const exercisesData = exercises$.get()

    if (!variantsData || !exercisesData) {
      return { isVariant: false, parentExercise: null, scalingFactor: 1 }
    }

    // Find if this exercise is a variant
    const variant = Object.values(variantsData).find(
      (v: any) => v?.variant_exercise_id === exerciseId
    ) as ExerciseVariant | undefined

    if (!variant) {
      return { isVariant: false, parentExercise: null, scalingFactor: 1 }
    }

    // Get the parent exercise
    const parentExercise = Object.values(exercisesData).find(
      (e: any) => e?.id === variant.parent_exercise_id
    ) as Exercise | undefined

    return {
      isVariant: true,
      parentExercise: parentExercise || null,
      scalingFactor: variant.scaling_factor,
    }
  },

  /**
   * Computed: Get all variants for a parent exercise
   */
  getExerciseVariants: (parentExerciseId: string): Array<{
    exercise: Exercise
    scalingFactor: number
  }> => {
    const variantsData = exerciseVariants$.get()
    const exercisesData = exercises$.get()

    if (!variantsData || !exercisesData) return []

    const variants = Object.values(variantsData).filter(
      (v: any) => v?.parent_exercise_id === parentExerciseId
    ) as ExerciseVariant[]

    return variants
      .map((variant) => {
        const exercise = Object.values(exercisesData).find(
          (e: any) => e?.id === variant.variant_exercise_id
        ) as Exercise | undefined
        if (!exercise) return null
        return {
          exercise,
          scalingFactor: variant.scaling_factor,
        }
      })
      .filter(Boolean) as Array<{ exercise: Exercise; scalingFactor: number }>
  },

  /**
   * Computed: Exercises grouped with their variants
   * Parent exercises include their variants as children
   */
  exercisesWithVariants: (): Array<{
    exercise: Exercise
    isVariant: boolean
    parentId: string | null
    scalingFactor: number
    variants: Array<{ exercise: Exercise; scalingFactor: number }>
  }> => {
    const exercisesData = exercises$.get()
    const variantsData = exerciseVariants$.get()

    if (!exercisesData) return []

    const variantIds = new Set<string>()
    const variantMap = new Map<string, { parentId: string; scalingFactor: number }>()

    // Build variant lookup
    if (variantsData) {
      Object.values(variantsData).forEach((v: any) => {
        if (v?.variant_exercise_id) {
          variantIds.add(v.variant_exercise_id)
          variantMap.set(v.variant_exercise_id, {
            parentId: v.parent_exercise_id,
            scalingFactor: v.scaling_factor,
          })
        }
      })
    }

    // Map exercises with variant info
    return Object.values(exercisesData).map((exercise: any) => {
      const variantInfo = variantMap.get(exercise.id)
      const variants = store$.getExerciseVariants(exercise.id)

      return {
        exercise,
        isVariant: variantIds.has(exercise.id),
        parentId: variantInfo?.parentId || null,
        scalingFactor: variantInfo?.scalingFactor || 1,
        variants,
      }
    })
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

  /**
   * Computed: Pending group invitations for current user
   * Returns invites sorted by most recent first
   */
  pendingGroupInvites: (): any[] => {
    const invitesData = groupInvites$.get()
    if (!invitesData) return []

    return Object.values(invitesData)
      .filter((i: any) => i?.status === 'pending')
      .sort((a: any, b: any) => {
        const dateA = new Date(a?.created_at || 0).getTime()
        const dateB = new Date(b?.created_at || 0).getTime()
        return dateB - dateA
      })
  },

  // ============================================
  // STATS MODULE COMPUTED FUNCTIONS
  // ============================================

  /**
   * Computed: Get user's PRs with exercise details
   * Returns array sorted by most recent PR first
   */
  getUserPRs: (limit?: number): Array<PersonalRecord & { exercise: Exercise }> => {
    const prsData = personalRecords$.get()
    if (!prsData) return []

    const prs = Object.values(prsData) as Array<PersonalRecord & { exercise: Exercise }>
    const sorted = prs.sort((a, b) => {
      const dateA = new Date(a?.best_date || 0).getTime()
      const dateB = new Date(b?.best_date || 0).getTime()
      return dateB - dateA
    })

    return limit ? sorted.slice(0, limit) : sorted
  },

  /**
   * Computed: Get volume data by period
   * Returns total value, previous period value, and breakdown by category
   */
  getVolumeByPeriod: (days: number): {
    total: number
    previousTotal: number
    percentChange: number
    byCategory: Record<string, number>
    byDate: Array<{ date: string; value: number }>
  } => {
    const completionsData = completions$.get()
    const tagRecipientsData = tagRecipients$.get()
    const exercisesData = exercises$.get()

    const result = {
      total: 0,
      previousTotal: 0,
      percentChange: 0,
      byCategory: {
        upper_body: 0,
        lower_body: 0,
        core: 0,
        full_body: 0,
      } as Record<string, number>,
      byDate: [] as Array<{ date: string; value: number }>,
    }

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const periodStart = new Date(today)
    periodStart.setDate(periodStart.getDate() - days)
    const previousStart = new Date(periodStart)
    previousStart.setDate(previousStart.getDate() - days)

    // Build exercise category lookup
    const exerciseCategories: Record<string, string> = {}
    if (exercisesData) {
      Object.values(exercisesData).forEach((ex: any) => {
        if (ex?.id && ex?.category) {
          exerciseCategories[ex.id] = ex.category
        }
      })
    }

    // Initialize byDate array
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      if (key) {
        result.byDate.push({ date: key, value: 0 })
      }
    }

    // Process completions
    if (completionsData) {
      Object.values(completionsData).forEach((completion: any) => {
        if (!completion?.completed_at || !completion?.value) return
        const completedDate = new Date(completion.completed_at)
        const value = completion.value || 0

        if (completedDate >= periodStart && completedDate <= today) {
          result.total += value
          const dateKey = completion.completed_at.split('T')[0]
          const dateEntry = result.byDate.find((d) => d.date === dateKey)
          if (dateEntry) dateEntry.value += value

          // Add to category
          const category = exerciseCategories[completion.exercise_id]
          if (category && result.byCategory[category] !== undefined) {
            result.byCategory[category] += value
          }
        } else if (completedDate >= previousStart && completedDate < periodStart) {
          result.previousTotal += value
        }
      })
    }

    // Process tag recipients (completed tags)
    if (tagRecipientsData) {
      Object.values(tagRecipientsData).forEach((recipient: any) => {
        if (recipient?.status !== 'completed' || !recipient?.completed_at) return
        const completedDate = new Date(recipient.completed_at)
        const value = recipient.completed_value || 0
        const exerciseId = recipient.completed_exercise_id || recipient.tag?.exercise_id

        if (completedDate >= periodStart && completedDate <= today) {
          result.total += value
          const dateKey = recipient.completed_at.split('T')[0]
          const dateEntry = result.byDate.find((d) => d.date === dateKey)
          if (dateEntry) dateEntry.value += value

          // Add to category
          const category = exerciseCategories[exerciseId] || recipient.tag?.exercise?.category
          if (category && result.byCategory[category] !== undefined) {
            result.byCategory[category] += value
          }
        } else if (completedDate >= previousStart && completedDate < periodStart) {
          result.previousTotal += value
        }
      })
    }

    // Calculate percent change
    if (result.previousTotal > 0) {
      result.percentChange = Math.round(
        ((result.total - result.previousTotal) / result.previousTotal) * 100
      )
    } else if (result.total > 0) {
      result.percentChange = 100 // Infinite improvement from 0
    }

    return result
  },

  /**
   * Computed: Get category breakdown for all time or period
   * Returns percentages and totals per category
   */
  getCategoryBreakdown: (days?: number): {
    categories: Array<{
      name: string
      label: string
      value: number
      percentage: number
      color: string
    }>
    dominant: string
    total: number
  } => {
    const volumeData = store$.getVolumeByPeriod(days || 365)

    const categoryConfig: Record<string, { label: string; color: string }> = {
      upper_body: { label: 'Upper', color: '$coral10' },
      lower_body: { label: 'Lower', color: '$green10' },
      core: { label: 'Core', color: '$amber10' },
      full_body: { label: 'Full', color: '$purple10' },
    }

    const total = Object.values(volumeData.byCategory).reduce((sum, val) => sum + val, 0)

    const categories = Object.entries(volumeData.byCategory).map(([name, value]) => ({
      name,
      label: categoryConfig[name]?.label || name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      color: categoryConfig[name]?.color || '$gray10',
    }))

    // Find dominant category
    const sorted = [...categories].sort((a, b) => b.value - a.value)
    const dominant = sorted[0]?.name || 'none'

    return { categories, dominant, total }
  },

  /**
   * Computed: Get PRs filtered by category
   */
  getPRsByCategory: (category?: string): Array<PersonalRecord & { exercise: Exercise }> => {
    const prs = store$.getUserPRs()
    if (!category || category === 'all') return prs

    return prs.filter((pr: any) => pr?.exercise?.category === category)
  },

  /**
   * Format large numbers for display (1.5k, 2.3M)
   */
  formatNumber: (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
    }
    return num.toString()
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
