import { useState, useEffect } from 'react'
import { Alert, ActivityIndicator, Keyboard } from 'react-native'
import { useRouter } from 'expo-router'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  H1,
  Input,
  Button,
  Card,
  ScrollView,
} from 'tamagui'
import { User, AtSign, Check, X } from '@tamagui/lucide-icons'
import { KeyboardSafeArea } from '@/components/ui'

import { supabase } from '@/lib/supabase'
import { auth$, store$ } from '@/lib/legend-state/store'

/**
 * Profile Setup Screen (Onboarding)
 *
 * Required for new users to set:
 * - First name (required)
 * - Last name (optional)
 * - Username (required, unique)
 */
function ProfileSetupScreen() {
  const router = useRouter()
  const session = auth$.session.get()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [suggestedUsername, setSuggestedUsername] = useState('')

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  // Generate username suggestion when first name changes
  useEffect(() => {
    const generateSuggestion = async () => {
      if (firstName.length < 2) {
        setSuggestedUsername('')
        return
      }

      try {
        const { data, error } = await (supabase.rpc as any)('generate_username_suggestion', {
          p_first_name: firstName,
          p_last_name: lastName || null,
        })

        if (!error && data) {
          setSuggestedUsername(data)
          // Auto-fill if username is empty
          if (!username) {
            setUsername(data)
            setUsernameAvailable(true)
          }
        }
      } catch (err) {
        console.error('Error generating username:', err)
      }
    }

    const debounce = setTimeout(generateSuggestion, 300)
    return () => clearTimeout(debounce)
  }, [firstName, lastName])

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      setUsernameError(null)
      return
    }

    const checkAvailability = async () => {
      setUsernameChecking(true)
      setUsernameError(null)

      try {
        // First validate format
        const { data: isValid } = await (supabase.rpc as any)('is_valid_username', {
          p_username: username.toLowerCase(),
        })

        if (!isValid) {
          setUsernameAvailable(false)
          setUsernameError('Username must be 3-20 characters, start with a letter, and contain only letters, numbers, and underscores')
          setUsernameChecking(false)
          return
        }

        // Check availability
        const { data: available, error } = await (supabase.rpc as any)('is_username_available', {
          p_username: username.toLowerCase(),
          p_current_user_id: session?.user?.id || null,
        })

        if (error) throw error
        setUsernameAvailable(available)
        if (!available) {
          setUsernameError('Username is already taken')
        }
      } catch (err) {
        console.error('Error checking username:', err)
        setUsernameAvailable(null)
      } finally {
        setUsernameChecking(false)
      }
    }

    const debounce = setTimeout(checkAvailability, 500)
    return () => clearTimeout(debounce)
  }, [username, session])

  // Handle form submission
  const handleSubmit = async () => {
    Keyboard.dismiss()

    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name')
      return
    }

    if (!username.trim() || username.length < 3) {
      Alert.alert('Error', 'Please enter a username (at least 3 characters)')
      return
    }

    if (usernameAvailable === false) {
      Alert.alert('Error', 'Please choose an available username')
      return
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'Session expired. Please log in again.')
      return
    }

    setLoading(true)

    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          username: username.toLowerCase().trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)

      if (error) throw error

      // Update local store
      const currentProfile = (store$.profile as any).get()
      if (currentProfile) {
        ;(store$.profile as any).set({
          ...currentProfile,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          username: username.toLowerCase().trim(),
        })
      }

      // Navigate to main app
      router.replace('/(auth)/(tabs)')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      if (error.code === '23505') {
        Alert.alert('Error', 'Username is already taken. Please choose another.')
        setUsernameAvailable(false)
      } else {
        Alert.alert('Error', error.message || 'Failed to update profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    firstName.trim().length >= 1 &&
    username.trim().length >= 3 &&
    usernameAvailable === true &&
    !loading

  return (
    <KeyboardSafeArea edges={['top', 'bottom']}>
      <ScrollView flex={1} bg="$background" contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} px="$4" py="$6">
          {/* Header */}
          <YStack gap="$2" mb="$6">
            <H1 fontSize="$9">Complete Your Profile</H1>
            <Text color="$gray10" fontSize="$4">
              Let's set up your profile so friends can find you
            </Text>
          </YStack>

          {/* Form */}
          <YStack gap="$4" flex={1}>
          {/* First Name */}
          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              First Name <Text color="$red10">*</Text>
            </Text>
            <Input
              size="$5"
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </YStack>

          {/* Last Name */}
          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              Last Name
            </Text>
            <Input
              size="$5"
              placeholder="Enter your last name (optional)"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </YStack>

          {/* Username */}
          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              Username <Text color="$red10">*</Text>
            </Text>
            <XStack gap="$2" alignItems="center">
              <XStack
                flex={1}
                bg="$gray2"
                br="$4"
                px="$3"
                alignItems="center"
                borderWidth={2}
                borderColor={
                  usernameAvailable === true
                    ? '$green8'
                    : usernameAvailable === false
                    ? '$red8'
                    : '$gray4'
                }
              >
                <AtSign size={18} color="$gray10" />
                <Input
                  flex={1}
                  size="$5"
                  placeholder="username"
                  value={username}
                  onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  borderWidth={0}
                  bg="transparent"
                />
                {usernameChecking ? (
                  <ActivityIndicator size="small" />
                ) : usernameAvailable === true ? (
                  <Check size={16} color="$green10" />
                ) : usernameAvailable === false ? (
                  <X size={16} color="$red10" />
                ) : null}
              </XStack>
            </XStack>
            {usernameError && (
              <Text color="$red10" fontSize="$2">
                {usernameError}
              </Text>
            )}
            {suggestedUsername && username !== suggestedUsername && (
              <XStack gap="$2" alignItems="center">
                <Text color="$gray10" fontSize="$2">
                  Suggestion:
                </Text>
                <Text
                  color="$orange10"
                  fontSize="$2"
                  fontWeight="600"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={() => {
                    setUsername(suggestedUsername)
                    setUsernameAvailable(true)
                  }}
                >
                  @{suggestedUsername}
                </Text>
              </XStack>
            )}
          </YStack>

          {/* Preview Card */}
          {firstName && (
            <Card bg="$gray2" p="$4" br="$4" mt="$2">
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={48}
                  height={48}
                  br="$10"
                  bg="$orange10"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="white" fontSize="$6" fontWeight="700">
                    {firstName[0]?.toUpperCase()}
                  </Text>
                </YStack>
                <YStack flex={1}>
                  <Text fontWeight="700" fontSize="$5">
                    {firstName} {lastName}
                  </Text>
                  {username && (
                    <Text color="$gray10" fontSize="$3">
                      @{username}
                    </Text>
                  )}
                </YStack>
              </XStack>
            </Card>
          )}
          </YStack>

          {/* Submit Button */}
          <Button
            size="$5"
            bg={canSubmit ? '$orange10' : '$gray6'}
            onPress={handleSubmit}
            disabled={!canSubmit}
            opacity={canSubmit ? 1 : 0.5}
            icon={loading ? <ActivityIndicator color="white" /> : undefined}
          >
            <Text color="white" fontWeight="700" fontSize="$5">
              {loading ? 'Saving...' : 'Continue'}
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardSafeArea>
  )
}

export default observer(ProfileSetupScreen)
