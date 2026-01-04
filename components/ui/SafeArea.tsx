import {
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
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

/**
 * Wrapper that dismisses keyboard when tapping outside inputs
 * Use this around content that has input fields
 */
export function DismissKeyboardView({ children }: { children: React.ReactNode }) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  )
}

interface KeyboardSafeAreaProps extends SafeAreaViewProps {
  /** Keyboard avoiding behavior - defaults to 'padding' on iOS */
  keyboardBehavior?: 'padding' | 'height' | 'position'
  /** Additional offset for keyboard avoiding view */
  keyboardVerticalOffset?: number
  /** Whether to dismiss keyboard on tap outside - defaults to true */
  dismissOnTap?: boolean
}

/**
 * SafeArea with keyboard avoidance for screens with inputs
 * Automatically handles keyboard on iOS to prevent input/button overlap
 *
 * Note: Keyboard dismiss is NOT handled here to avoid blocking scroll.
 * Use ScrollView's keyboardDismissMode="on-drag" or keyboardShouldPersistTaps
 * to control keyboard behavior in scrollable content.
 */
export function KeyboardSafeArea({
  style,
  children,
  keyboardBehavior = 'padding',
  keyboardVerticalOffset = 0,
  dismissOnTap = true, // Kept for API compatibility but no longer used
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
