import { useState, useCallback, useRef } from 'react'

export interface AsyncOperationState<T> {
  /** Whether the operation is in progress */
  loading: boolean
  /** Error message if the operation failed */
  error: string | null
  /** Data returned from the operation */
  data: T | null
}

export interface UseAsyncOperationReturn<T, TArgs extends unknown[]> {
  /** Whether the operation is in progress */
  loading: boolean
  /** Error message if the operation failed */
  error: string | null
  /** Data returned from the operation */
  data: T | null
  /** Execute the async operation */
  execute: (...args: TArgs) => Promise<T | null>
  /** Reset the state */
  reset: () => void
  /** Set loading state manually (for external control) */
  setLoading: (loading: boolean) => void
}

export interface UseAsyncOperationOptions<T> {
  /** Initial data value */
  initialData?: T | null
  /** Callback on success */
  onSuccess?: (data: T) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Transform error to message */
  getErrorMessage?: (error: unknown) => string
}

const defaultGetErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}

/**
 * Hook for managing async operation state
 *
 * Provides a unified interface for:
 * - Loading state management
 * - Error handling
 * - Success callbacks
 * - Automatic state cleanup
 *
 * @example
 * ```tsx
 * const { loading, error, execute } = useAsyncOperation(
 *   async (userId: string) => {
 *     const { data, error } = await supabase
 *       .from('profiles')
 *       .select('*')
 *       .eq('id', userId)
 *       .single()
 *     if (error) throw error
 *     return data
 *   },
 *   {
 *     onSuccess: (profile) => console.log('Loaded', profile),
 *     onError: (error) => Alert.alert('Error', error.message),
 *   }
 * )
 *
 * // In handler
 * await execute(userId)
 * ```
 */
export function useAsyncOperation<T, TArgs extends unknown[] = []>(
  operation: (...args: TArgs) => Promise<T>,
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T, TArgs> {
  const {
    initialData = null,
    onSuccess,
    onError,
    getErrorMessage = defaultGetErrorMessage,
  } = options

  const [state, setState] = useState<AsyncOperationState<T>>({
    loading: false,
    error: null,
    data: initialData,
  })

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useState(() => {
    return () => {
      mountedRef.current = false
    }
  })

  const execute = useCallback(
    async (...args: TArgs): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const result = await operation(...args)

        if (mountedRef.current) {
          setState({ loading: false, error: null, data: result })
          onSuccess?.(result)
        }

        return result
      } catch (err) {
        const errorMessage = getErrorMessage(err)

        if (mountedRef.current) {
          setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
          onError?.(err instanceof Error ? err : new Error(errorMessage))
        }

        return null
      }
    },
    [operation, onSuccess, onError, getErrorMessage]
  )

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: initialData })
  }, [initialData])

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }))
  }, [])

  return {
    loading: state.loading,
    error: state.error,
    data: state.data,
    execute,
    reset,
    setLoading,
  }
}

/**
 * Simplified hook for operations that don't need to track data
 *
 * @example
 * ```tsx
 * const { loading, execute } = useLoadingState()
 *
 * const handleSubmit = async () => {
 *   await execute(async () => {
 *     await saveProfile(formData)
 *     Alert.alert('Success', 'Profile saved!')
 *   })
 * }
 * ```
 */
export function useLoadingState(
  options: Omit<UseAsyncOperationOptions<void>, 'initialData'> = {}
): {
  loading: boolean
  error: string | null
  execute: <T>(operation: () => Promise<T>) => Promise<T | null>
  reset: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const { onSuccess, onError, getErrorMessage = defaultGetErrorMessage } = options

  // Cleanup on unmount
  useState(() => {
    return () => {
      mountedRef.current = false
    }
  })

  const execute = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | null> => {
      setLoading(true)
      setError(null)

      try {
        const result = await operation()

        if (mountedRef.current) {
          setLoading(false)
          onSuccess?.()
        }

        return result
      } catch (err) {
        const errorMessage = getErrorMessage(err)

        if (mountedRef.current) {
          setLoading(false)
          setError(errorMessage)
          onError?.(err instanceof Error ? err : new Error(errorMessage))
        }

        return null
      }
    },
    [onSuccess, onError, getErrorMessage]
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  return { loading, error, execute, reset }
}
