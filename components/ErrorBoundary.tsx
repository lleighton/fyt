import React, { Component, ErrorInfo, ReactNode } from 'react'
import { YStack, Text, H1, Button } from 'tamagui'
import { AlertTriangle, RefreshCw } from '@tamagui/lucide-icons'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and displays a fallback UI instead of crashing.
 *
 * Required for:
 * - App Store compliance (graceful error handling)
 * - Better user experience
 * - Error reporting to analytics
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console (in production, send to error reporting service)
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error info:', errorInfo)

    this.setState({ errorInfo })

    // TODO: Send to error reporting service (Sentry, Bugsnag, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleReload = (): void => {
    // Reset state to try rendering again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          p="$6"
          bg="$background"
          gap="$4"
        >
          <YStack
            width={80}
            height={80}
            br="$10"
            bg="$red4"
            justifyContent="center"
            alignItems="center"
          >
            <AlertTriangle size={40} color="$red10" />
          </YStack>

          <H1 fontSize="$7" textAlign="center">
            Something went wrong
          </H1>

          <Text color="$gray10" textAlign="center" maxWidth={300}>
            We're sorry, but something unexpected happened. Please try again.
          </Text>

          {__DEV__ && this.state.error && (
            <YStack
              bg="$red2"
              p="$3"
              br="$3"
              maxWidth="100%"
              overflow="hidden"
            >
              <Text fontSize="$2" color="$red10">
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo?.componentStack && (
                <Text
                  fontSize="$1"
                  color="$gray10"
                  mt="$2"
                  numberOfLines={10}
                >
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </YStack>
          )}

          <YStack gap="$3" width="100%" maxWidth={300}>
            <Button
              size="$5"
              bg="$blue10"
              icon={<RefreshCw size={20} color="white" />}
              onPress={this.handleReload}
              accessibilityLabel="Reload the app"
            >
              <Text color="white" fontWeight="600">
                Reload App
              </Text>
            </Button>

            <Button
              size="$4"
              bg="$gray4"
              onPress={this.handleReset}
              accessibilityLabel="Try again without reloading"
            >
              <Text fontWeight="600">Try Again</Text>
            </Button>
          </YStack>
        </YStack>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
