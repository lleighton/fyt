import { useColorScheme, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context'

/**
 * Themed SafeAreaView that automatically applies the correct background color
 * based on the current color scheme (light/dark mode)
 */
export function SafeArea({ style, children, ...props }: SafeAreaViewProps) {
  const colorScheme = useColorScheme()
  const backgroundColor = colorScheme === 'dark' ? '#000000' : '#ffffff'

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor }, style]}
      {...props}
    >
      {children}
    </SafeAreaView>
  )
}

interface KeyboardSafeAreaProps extends SafeAreaViewProps {
  /** Keyboard avoiding behavior - defaults to 'padding' on iOS */
  keyboardBehavior?: 'padding' | 'height' | 'position'
  /** Additional offset for keyboard avoiding view */
  keyboardVerticalOffset?: number
}

/**
 * SafeArea with keyboard avoidance for screens with inputs
 * Automatically handles keyboard on iOS to prevent input/button overlap
 */
export function KeyboardSafeArea({
  style,
  children,
  keyboardBehavior = 'padding',
  keyboardVerticalOffset = 0,
  ...props
}: KeyboardSafeAreaProps) {
  const colorScheme = useColorScheme()
  const backgroundColor = colorScheme === 'dark' ? '#000000' : '#ffffff'

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor }, style]}
      {...props}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? keyboardBehavior : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
