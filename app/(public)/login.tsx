import { useState } from 'react'
import { observer } from '@legendapp/state/react'
import { YStack, Text, H1, Button, Input, Spinner } from 'tamagui'
import { KeyRound, Mail } from '@tamagui/lucide-icons'
import { KeyboardSafeArea } from '@/components/ui'

import { supabase } from '@/lib/supabase'
import { AuthEvents } from '@/lib/analytics'

/**
 * Email validation regex
 * Validates standard email format: local@domain.tld
 * - Local part: alphanumeric, dots, hyphens, underscores, plus signs
 * - Domain: alphanumeric with hyphens, at least one dot
 * - TLD: 2-10 characters (accounts for new TLDs)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/

/**
 * Validates an email address format
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

/**
 * Login screen with email authentication
 *
 * Email Flow:
 * 1. User enters email
 * 2. Send OTP via email
 * 3. User enters verification code (or clicks magic link)
 * 4. Verify and create session
 */
function LoginScreen() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'otp'>('input')

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)
    AuthEvents.loginStarted()

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
      })

      if (error) throw error

      setStep('otp')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send code'
      AuthEvents.loginFailed(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const trimmedEmail = email.trim().toLowerCase()

      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: otp,
        type: 'email',
      })

      if (error) throw error

      // Create profile if this is first login
      if (data.user) {
        const { error: profileError } = await (supabase
          .from('profiles') as ReturnType<typeof supabase.from>)
          .upsert({
            id: data.user.id,
            email: data.user.email,
            display_name: null, // User can set this later
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }

      // Track successful login
      AuthEvents.loginCompleted()

      // Session will be set automatically by auth listener
      // Navigation will happen automatically via PublicLayout
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid code'
      AuthEvents.loginFailed(errorMessage)
      setError(errorMessage)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeInput = () => {
    setStep('input')
    setOtp('')
    setError(null)
  }

  return (
    <KeyboardSafeArea>
      <YStack flex={1} justifyContent="center" alignItems="center" p="$4" bg="$background" gap="$4">
        {step === 'input' ? (
          <>
            {/* Email Input Screen */}
            <YStack alignItems="center" gap="$3">
              <Mail size={48} color="$orange10" />
              <H1 fontSize="$9" textAlign="center">Welcome to fyt</H1>
              <Text color="$gray10" textAlign="center" maxWidth={400}>
                Sign in with your email to start competing with friends
              </Text>
            </YStack>

            <YStack width="100%" maxWidth={400} gap="$3">
              <Input
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                size="$5"
                disabled={loading}
                autoComplete="email"
                autoFocus
                accessibilityLabel="Email address"
                accessibilityHint="Enter your email address to receive a verification code"
              />

              {error && (
                <Text color="$red10" fontSize="$3" textAlign="center" accessibilityRole="alert">
                  {error}
                </Text>
              )}

              <Button
                size="$5"
                bg="$orange10"
                onPress={handleSendOtp}
                disabled={loading || !email}
                icon={loading ? <Spinner color="white" /> : undefined}
                accessibilityLabel={loading ? 'Sending verification code' : 'Send verification code'}
              >
                {loading ? 'Sending code...' : 'Send verification code'}
              </Button>
            </YStack>

            <Text color="$gray10" fontSize="$2" textAlign="center" mt="$6" maxWidth={400}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </>
        ) : (
          <>
            {/* OTP Entry Screen */}
            <YStack alignItems="center" gap="$3">
              <KeyRound size={48} color="$orange10" />
              <H1 fontSize="$9" textAlign="center">Check your email</H1>
              <Text color="$gray10" textAlign="center" maxWidth={400}>
                We sent a verification code to {email}
              </Text>
              <Text color="$gray10" fontSize="$2" textAlign="center" maxWidth={400}>
                You can either paste the code below or click the link in your email
              </Text>
            </YStack>

            <YStack width="100%" maxWidth={400} gap="$3">
              <Input
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                size="$5"
                disabled={loading}
                maxLength={6}
                textAlign="center"
                fontSize="$8"
                letterSpacing={8}
                autoFocus
                accessibilityLabel="Verification code"
                accessibilityHint="Enter the 6-digit code sent to your email"
              />

              {error && (
                <Text color="$red10" fontSize="$3" textAlign="center" accessibilityRole="alert">
                  {error}
                </Text>
              )}

              <Button
                size="$5"
                bg="$orange10"
                onPress={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                icon={loading ? <Spinner color="white" /> : undefined}
                accessibilityLabel={loading ? 'Verifying code' : 'Verify code'}
              >
                {loading ? 'Verifying...' : 'Verify code'}
              </Button>

              <Button
                size="$3"
                unstyled
                onPress={handleChangeInput}
                disabled={loading}
                accessibilityLabel="Change email address"
              >
                <Text color="$orange10">Change email</Text>
              </Button>
            </YStack>
          </>
        )}
      </YStack>
    </KeyboardSafeArea>
  )
}

export default observer(LoginScreen)
