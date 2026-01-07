import * as Sentry from '@sentry/react-native'

/**
 * Sentry Monitoring Configuration
 *
 * Provides:
 * - Crash reporting
 * - Error tracking with breadcrumbs
 * - Performance monitoring
 * - User context for debugging
 */

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN

/**
 * Initialize Sentry for error monitoring and performance
 * Call this at app startup before any other code
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.log('[Sentry] No DSN configured, skipping initialization')
    }
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: __DEV__ ? 'development' : 'production',

    // Enable performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% in dev, 20% in prod

    // Enable profiling (performance)
    profilesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in prod

    // Don't send events in development (optional - remove to test)
    enabled: !__DEV__,

    // Attach screenshots to error reports
    attachScreenshot: true,

    // Capture console.error as breadcrumbs
    enableAutoSessionTracking: true,

    // Session replay (if available in your plan)
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive data from events
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
      }
      return event
    },

    // Add app version info
    release: 'fyt@1.0.0',
  })

  console.log('[Sentry] Initialized successfully')
}

/**
 * Set user context for Sentry
 * Call when user logs in
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  })
}

/**
 * Clear user context
 * Call when user logs out
 */
export function clearUser(): void {
  Sentry.setUser(null)
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = 'app',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

/**
 * Capture an exception manually
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void {
  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.captureMessage(message, level)
}

/**
 * Start a performance transaction
 * Returns a transaction that must be finished
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({ name, op })
}

/**
 * Wrap a component with Sentry error boundary
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary

/**
 * Wrap a function to automatically capture errors
 */
export function wrapWithSentry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureException(error as Error, { context })
      throw error
    }
  }) as T
}

export default {
  init: initSentry,
  setUser,
  clearUser,
  addBreadcrumb,
  captureException,
  captureMessage,
  startTransaction,
}
