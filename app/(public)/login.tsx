import { useState } from 'react'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, H1, H2, Button, Input, Spinner } from 'tamagui'
import { Phone, KeyRound, Mail } from '@tamagui/lucide-icons'
import { KeyboardSafeArea } from '@/components/ui'

import { supabase } from '@/lib/supabase'

/**
 * Login screen with email and phone authentication
 *
 * Email Flow (default):
 * 1. User enters email
 * 2. Send OTP via email
 * 3. User enters verification code
 * 4. Verify and create session
 *
 * Phone Flow (requires SMS provider):
 * 1. User enters phone number
 * 2. Send OTP via SMS
 * 3. User enters verification code
 * 4. Verify and create session
 */
function LoginScreen() {
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'otp'>('input')

  const handleSendOtp = async () => {
    if (authMode === 'email') {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
        })

        if (error) throw error

        setStep('otp')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send code')
      } finally {
        setLoading(false)
      }
    } else {
      // Phone auth
      if (!phone || phone.length < 10) {
        setError('Please enter a valid phone number')
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Format phone number (ensure it starts with +)
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`

        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        })

        if (error) throw error

        setStep('otp')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send code')
      } finally {
        setLoading(false)
      }
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
      let data, error

      if (authMode === 'email') {
        const result = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp,
          type: 'email',
        })
        data = result.data
        error = result.error
      } else {
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
        const result = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otp,
          type: 'sms',
        })
        data = result.data
        error = result.error
      }

      if (error) throw error

      // Create profile if this is first login
      if (data.user) {
        const profileData: any = {
          id: data.user.id,
          display_name: null, // User can set this later
          updated_at: new Date().toISOString(),
        }

        if (authMode === 'email') {
          profileData.email = data.user.email
          profileData.phone_number = null
        } else {
          const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
          profileData.phone_number = formattedPhone
          profileData.email = null
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData)

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }

      // Session will be set automatically by auth listener
      // Navigation will happen automatically via PublicLayout
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid code'

      // Check if this is a database constraint error (migration not run)
      if (errorMessage.includes('phone_number') || errorMessage.includes('violates')) {
        setError(
          'Database setup incomplete. Please run the migration in Supabase (see SUPABASE_CONFIG.md)'
        )
      } else {
        setError(errorMessage)
      }

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

  const handleToggleAuthMode = () => {
    setAuthMode(authMode === 'email' ? 'phone' : 'email')
    setEmail('')
    setPhone('')
    setOtp('')
    setError(null)
    setStep('input')
  }

  return (
    <KeyboardSafeArea>
      <YStack flex={1} justifyContent="center" alignItems="center" p="$4" bg="$background" gap="$4">
        {step === 'input' ? (
          <>
            {/* Input Screen (Email or Phone) */}
            <YStack alignItems="center" gap="$3">
              {authMode === 'email' ? (
                <Mail size={48} color="$blue10" />
              ) : (
                <Phone size={48} color="$blue10" />
              )}
              <H1 fontSize="$9" textAlign="center">Welcome to fyt</H1>
              <Text color="$gray10" textAlign="center" maxWidth={400}>
                {authMode === 'email'
                  ? 'Sign in with your email to start competing with friends'
                  : 'Sign in with your phone number to start competing with friends'}
              </Text>
            </YStack>

            <YStack width="100%" maxWidth={400} gap="$3">
              {authMode === 'email' ? (
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
                />
              ) : (
                <Input
                  placeholder="+1234567890"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  size="$5"
                  disabled={loading}
                  autoComplete="tel"
                  autoFocus
                />
              )}

              {error && (
                <Text color="$red10" fontSize="$3" textAlign="center">
                  {error}
                </Text>
              )}

              <Button
                size="$5"
                bg="$blue10"
                onPress={handleSendOtp}
                disabled={loading || (authMode === 'email' ? !email : !phone)}
                icon={loading ? <Spinner color="white" /> : undefined}
              >
                {loading ? 'Sending code...' : 'Send verification code'}
              </Button>

              {/* Toggle between email and phone */}
              <Button
                size="$3"
                unstyled
                onPress={handleToggleAuthMode}
                disabled={loading}
              >
                <Text color="$blue10">
                  {authMode === 'email'
                    ? 'Use phone number instead'
                    : 'Use email instead'}
                </Text>
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
              <KeyRound size={48} color="$blue10" />
              <H1 fontSize="$9" textAlign="center">Check your {authMode === 'email' ? 'email' : 'messages'}</H1>
              <Text color="$gray10" textAlign="center" maxWidth={400}>
                We sent a verification code to {authMode === 'email' ? email : phone}
              </Text>
              {authMode === 'email' && (
                <Text color="$gray10" fontSize="$2" textAlign="center" maxWidth={400}>
                  You can either paste the code below or click the link in your email
                </Text>
              )}
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
              />

              {error && (
                <Text color="$red10" fontSize="$3" textAlign="center">
                  {error}
                </Text>
              )}

              <Button
                size="$5"
                bg="$blue10"
                onPress={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                icon={loading ? <Spinner color="white" /> : undefined}
              >
                {loading ? 'Verifying...' : 'Verify code'}
              </Button>

              <Button
                size="$3"
                unstyled
                onPress={handleChangeInput}
                disabled={loading}
              >
                <Text color="$blue10">
                  {authMode === 'email' ? 'Change email' : 'Change phone number'}
                </Text>
              </Button>
            </YStack>
          </>
        )}
      </YStack>
    </KeyboardSafeArea>
  )
}

export default observer(LoginScreen)
