import PostHog, { PostHogProvider, usePostHog } from 'posthog-react-native'
import { setUser as setSentryUser, clearUser as clearSentryUser, addBreadcrumb } from './monitoring'

/**
 * PostHog Analytics Configuration
 *
 * Provides:
 * - User behavior tracking
 * - Feature usage analytics
 * - Funnel analysis
 * - Retention metrics
 * - Feature flags (optional)
 */

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || ''
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

// PostHog client instance (singleton)
let posthogClient: PostHog | null = null

/**
 * Get or create PostHog client instance
 */
function getPostHogClient(): PostHog | null {
  if (!POSTHOG_API_KEY) {
    if (__DEV__) {
      console.log('[Analytics] No PostHog API key configured')
    }
    return null
  }

  if (!posthogClient) {
    posthogClient = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
    })
    console.log('[Analytics] PostHog client created')
  }

  return posthogClient
}

/**
 * Initialize PostHog analytics
 * Call this at app startup
 */
export async function initAnalytics(): Promise<void> {
  const client = getPostHogClient()
  if (client) {
    console.log('[Analytics] PostHog initialized successfully')
  }
}

// Export provider and hook for React components
export { PostHogProvider, usePostHog }

// Export config for provider
export const posthogConfig = {
  apiKey: POSTHOG_API_KEY,
  host: POSTHOG_HOST,
}

/**
 * Identify user for analytics
 * Call when user logs in or profile is loaded
 */
export function identifyUser(user: {
  id: string
  email?: string | null
  displayName?: string | null
  username?: string | null
  createdAt?: string
}): void {
  // Build properties object excluding undefined values
  const properties: Record<string, string> = {}
  if (user.email) properties.email = user.email
  if (user.displayName) properties.name = user.displayName
  if (user.username) properties.username = user.username
  if (user.createdAt) properties.created_at = user.createdAt

  // Set user in PostHog
  const client = getPostHogClient()
  client?.identify(user.id, properties)

  // Also set user in Sentry
  setSentryUser({
    id: user.id,
    email: user.email || undefined,
    username: user.username || undefined,
  })

  addBreadcrumb('User identified', 'auth', { userId: user.id })
}

/**
 * Reset analytics (on logout)
 */
export function resetAnalytics(): void {
  const client = getPostHogClient()
  client?.reset()
  clearSentryUser()
  addBreadcrumb('User logged out', 'auth')
}

type EventProperties = Record<string, string | number | boolean>

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: EventProperties
): void {
  const client = getPostHogClient()
  if (client) {
    client.capture(eventName, properties)
    // Flush immediately in dev for testing
    if (__DEV__) {
      client.flush()
    }
  }
  addBreadcrumb(eventName, 'analytics', properties)

  if (__DEV__) {
    console.log(`[Analytics] ${eventName}`, properties)
  }
}

/**
 * Track screen view
 */
export function trackScreen(
  screenName: string,
  properties?: EventProperties
): void {
  const client = getPostHogClient()
  client?.screen(screenName, properties)
  addBreadcrumb(`Screen: ${screenName}`, 'navigation', properties)

  if (__DEV__) {
    console.log(`[Analytics] Screen: ${screenName}`, properties)
  }
}

// ============================================
// PREDEFINED EVENT TRACKING FUNCTIONS
// ============================================
// Use these for consistent event naming across the app

/**
 * Auth events
 */
export const AuthEvents = {
  loginStarted: () => trackEvent('auth_login_started'),
  loginCompleted: () => trackEvent('auth_login_completed'),
  loginFailed: (error: string) => trackEvent('auth_login_failed', { error }),
  logoutCompleted: () => trackEvent('auth_logout_completed'),
  accountDeleted: () => trackEvent('auth_account_deleted'),
}

/**
 * Tag events
 */
export const TagEvents = {
  created: (props: { exerciseId: string; value: number; recipientCount: number; isPublic: boolean }) =>
    trackEvent('tag_created', props),
  sent: (props: { tagId: string; recipientCount: number }) =>
    trackEvent('tag_sent', props),
  viewed: (tagId: string) =>
    trackEvent('tag_viewed', { tagId }),
  responded: (props: { tagId: string; completedValue: number; beatTarget: boolean }) =>
    trackEvent('tag_responded', props),
  expired: (tagId: string) =>
    trackEvent('tag_expired', { tagId }),
}

/**
 * Group events
 */
export const GroupEvents = {
  created: (props: { groupId: string; isPrivate: boolean }) =>
    trackEvent('group_created', props),
  joined: (props: { groupId: string; method: 'invite' | 'code' | 'link' }) =>
    trackEvent('group_joined', props),
  left: (groupId: string) =>
    trackEvent('group_left', { groupId }),
  inviteSent: (props: { groupId: string; inviteeCount: number }) =>
    trackEvent('group_invite_sent', props),
  inviteAccepted: (groupId: string) =>
    trackEvent('group_invite_accepted', { groupId }),
  inviteDeclined: (groupId: string) =>
    trackEvent('group_invite_declined', { groupId }),
}

/**
 * Streak events
 */
export const StreakEvents = {
  extended: (props: { streakType: string; newCount: number }) =>
    trackEvent('streak_extended', props),
  broken: (props: { streakType: string; finalCount: number }) =>
    trackEvent('streak_broken', props),
  milestone: (props: { streakType: string; milestone: number }) =>
    trackEvent('streak_milestone', props),
}

/**
 * Profile events
 */
export const ProfileEvents = {
  updated: (fields: string[]) =>
    trackEvent('profile_updated', { fields: fields.join(',') }),
  avatarChanged: () =>
    trackEvent('profile_avatar_changed'),
  onboardingCompleted: () =>
    trackEvent('onboarding_completed'),
}

/**
 * Feature usage events
 */
export const FeatureEvents = {
  exerciseSelectorOpened: () =>
    trackEvent('feature_exercise_selector_opened'),
  leaderboardViewed: (type: 'global' | 'group') =>
    trackEvent('feature_leaderboard_viewed', { type }),
  activityChartViewed: (period: number) =>
    trackEvent('feature_activity_chart_viewed', { period }),
  pullToRefresh: (screen: string) =>
    trackEvent('feature_pull_to_refresh', { screen }),
}

/**
 * Error events (for analytics, not crash reporting)
 */
export const ErrorEvents = {
  apiError: (props: { endpoint: string; statusCode?: number; message: string }) =>
    trackEvent('error_api', props),
  validationError: (props: { field: string; message: string }) =>
    trackEvent('error_validation', props),
  permissionDenied: (permission: string) =>
    trackEvent('error_permission_denied', { permission }),
}

// ============================================
// FEATURE FLAGS (Optional)
// ============================================

/**
 * Check if a feature flag is enabled
 */
export async function isFeatureEnabled(flagKey: string): Promise<boolean> {
  const client = getPostHogClient()
  if (!client) return false
  return client.isFeatureEnabled(flagKey) ?? false
}

/**
 * Get feature flag value
 */
export async function getFeatureFlag(flagKey: string): Promise<unknown> {
  const client = getPostHogClient()
  if (!client) return undefined
  return client.getFeatureFlag(flagKey)
}

/**
 * Reload feature flags
 */
export async function reloadFeatureFlags(): Promise<void> {
  const client = getPostHogClient()
  await client?.reloadFeatureFlagsAsync()
}

// ============================================
// SHUTDOWN
// ============================================

/**
 * Flush and shutdown analytics
 * Call on app close if needed
 */
export async function shutdownAnalytics(): Promise<void> {
  const client = getPostHogClient()
  await client?.flush()
  await client?.shutdown()
}

export default {
  init: initAnalytics,
  identify: identifyUser,
  reset: resetAnalytics,
  track: trackEvent,
  screen: trackScreen,
  isFeatureEnabled,
  getFeatureFlag,
  shutdown: shutdownAnalytics,
  // Event helpers
  auth: AuthEvents,
  tag: TagEvents,
  group: GroupEvents,
  streak: StreakEvents,
  profile: ProfileEvents,
  feature: FeatureEvents,
  error: ErrorEvents,
}
