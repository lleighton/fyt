import { Alert } from 'react-native'

/**
 * Centralized Error Handling Utility
 *
 * Provides consistent error handling across the app:
 * - User-friendly error messages
 * - Error logging for debugging
 * - Categorized error types
 * - Future: Integration with error reporting services
 */

/**
 * Error categories for consistent handling
 */
export type ErrorCategory =
  | 'network'
  | 'auth'
  | 'validation'
  | 'database'
  | 'storage'
  | 'permission'
  | 'unknown'

/**
 * Standard app error structure
 */
export interface AppError {
  message: string
  category: ErrorCategory
  code?: string
  originalError?: unknown
}

/**
 * User-friendly error messages by category
 */
const USER_MESSAGES: Record<ErrorCategory, string> = {
  network: 'Please check your internet connection and try again.',
  auth: 'Authentication failed. Please sign in again.',
  validation: 'Please check your input and try again.',
  database: 'Something went wrong saving your data. Please try again.',
  storage: 'Failed to upload file. Please try again.',
  permission: 'Permission required. Please enable in settings.',
  unknown: 'Something went wrong. Please try again.',
}

/**
 * Categorize an error based on its message or type
 */
function categorizeError(error: unknown): ErrorCategory {
  if (!error) return 'unknown'

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('offline')
  ) {
    return 'network'
  }

  // Auth errors
  if (
    message.includes('auth') ||
    message.includes('token') ||
    message.includes('session') ||
    message.includes('login') ||
    message.includes('sign in') ||
    message.includes('unauthorized') ||
    message.includes('jwt')
  ) {
    return 'auth'
  }

  // Validation errors
  if (
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('validation') ||
    message.includes('format')
  ) {
    return 'validation'
  }

  // Database/Supabase errors
  if (
    message.includes('database') ||
    message.includes('supabase') ||
    message.includes('postgres') ||
    message.includes('rls') ||
    message.includes('constraint') ||
    message.includes('violates')
  ) {
    return 'database'
  }

  // Storage errors
  if (message.includes('storage') || message.includes('upload') || message.includes('file')) {
    return 'storage'
  }

  // Permission errors
  if (message.includes('permission') || message.includes('denied') || message.includes('access')) {
    return 'permission'
  }

  return 'unknown'
}

/**
 * Create a standardized AppError from any error
 */
export function createAppError(error: unknown, customMessage?: string): AppError {
  const category = categorizeError(error)
  const message = customMessage || (error instanceof Error ? error.message : String(error))

  return {
    message,
    category,
    originalError: error,
  }
}

/**
 * Get a user-friendly message for an error
 */
export function getUserMessage(error: unknown): string {
  const category = categorizeError(error)
  return USER_MESSAGES[category]
}

/**
 * Log an error for debugging
 * In production, this would send to error reporting service
 */
export function logError(error: unknown, context?: string): void {
  const appError = createAppError(error)

  console.error(`[${appError.category.toUpperCase()}]${context ? ` ${context}:` : ''}`, {
    message: appError.message,
    originalError: appError.originalError,
  })

  // TODO: Send to error reporting service in production
  // Example:
  // if (!__DEV__) {
  //   Sentry.captureException(error, { extra: { context, category: appError.category } })
  // }
}

/**
 * Show an error alert to the user
 */
export function showErrorAlert(
  error: unknown,
  options?: {
    title?: string
    showDetails?: boolean
    onDismiss?: () => void
  }
): void {
  const appError = createAppError(error)
  const userMessage = getUserMessage(error)

  const title = options?.title || 'Error'

  // In dev mode, show more details
  const message =
    __DEV__ && options?.showDetails !== false
      ? `${userMessage}\n\nDetails: ${appError.message}`
      : userMessage

  Alert.alert(title, message, [
    {
      text: 'OK',
      onPress: options?.onDismiss,
    },
  ])

  // Always log for debugging
  logError(error, title)
}

/**
 * Handle an async operation with consistent error handling
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  options?: {
    context?: string
    showAlert?: boolean
    onError?: (error: AppError) => void
  }
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (err) {
    const appError = createAppError(err)

    logError(err, options?.context)

    if (options?.showAlert !== false) {
      showErrorAlert(err, { title: options?.context })
    }

    if (options?.onError) {
      options.onError(appError)
    }

    return { data: null, error: appError }
  }
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    const { data, error } = await handleAsync(() => fn(...args), { context })
    if (error) throw error.originalError
    return data
  }) as T
}

export default {
  createAppError,
  getUserMessage,
  logError,
  showErrorAlert,
  handleAsync,
  withErrorHandling,
}
