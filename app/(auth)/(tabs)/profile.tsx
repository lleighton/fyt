import { useState, useEffect, useCallback } from 'react'
import { Alert, ActivityIndicator, RefreshControl } from 'react-native'
import { observer } from '@legendapp/state/react'
import { useFocusEffect } from 'expo-router'
import {
  YStack,
  XStack,
  Text,
  H1,
  H2,
  Button,
  Card,
  ScrollView,
  Avatar,
  Input,
  Separator,
} from 'tamagui'
import {
  User,
  Edit3,
  LogOut,
  Settings,
  Bell,
  Camera,
  AtSign,
  Trash2,
  AlertTriangle,
} from '@tamagui/lucide-icons'
import { SafeArea } from '@/components/ui'

import { store$, auth$, profile$, completions$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import ActivityChart from '@/components/activity/ActivityChart'
import { useRefresh } from '@/lib/sync-service'
import { AuthEvents, resetAnalytics } from '@/lib/analytics'
import { useImageUpload } from '@/lib/hooks'

/**
 * Profile screen
 *
 * Shows user info, stats, and settings
 */
function ProfileScreen() {
  const profile = store$.profile.get()
  const completions = store$.completions.get()
  const currentStreak = store$.currentStreak()

  // Pull-to-refresh
  const { isRefreshing, onRefresh } = useRefresh()

  // Image upload hook
  const { uploading: uploadingAvatar, pickAndUpload } = useImageUpload()

  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [loading, setLoading] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  // Load data when screen comes into focus (fallback for sync)
  useFocusEffect(
    useCallback(() => {
      const loadDirectData = async () => {
        const session = auth$.session.get()
        if (!session?.user) return

        try {
          // Load profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) throw profileError

          // Update profile$ observable directly
          if (profileData) {
            ;(profile$ as any)[profileData.id].set(profileData)
            console.log('[ProfileScreen] Loaded profile from Supabase')
          }

          // Load completions
          const { data: completionsData, error: completionsError } = await supabase
            .from('completions')
            .select('*')
            .eq('user_id', session.user.id)

          if (completionsError) throw completionsError

          // Update completions$ observable
          if (completionsData) {
            completionsData.forEach((completion) => {
              ;(completions$ as any)[completion.id].set(completion)
            })
            console.log('[ProfileScreen] Loaded', completionsData.length, 'completions from Supabase')
          }
        } catch (error) {
          console.error('[ProfileScreen] Error loading data:', error)
        }
      }

      loadDirectData()
    }, [])
  )

  // Sync names with profile changes
  useEffect(() => {
    if (!isEditing) {
      setFirstName(profile?.first_name || '')
      setLastName(profile?.last_name || '')
    }
  }, [profile?.first_name, profile?.last_name, isEditing])

  const totalCompletions = completions ? Object.keys(completions).length : 0

  const handleSaveProfile = async () => {
    // Get fresh profile from store
    const currentProfile = store$.profile.get()

    if (!currentProfile) {
      Alert.alert('Error', 'No profile loaded. Please try reloading the app.')
      return
    }

    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required')
      return
    }

    setLoading(true)

    try {
      // Compute display_name from first + last name
      const computedDisplayName = `${firstName.trim()} ${lastName.trim()}`.trim()

      const updatedData = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        display_name: computedDisplayName,
        updated_at: new Date().toISOString(),
      }

      // Update profile in Supabase
      const { data, error } = await (supabase
        .from('profiles') as any)
        .update(updatedData)
        .eq('id', currentProfile.id)
        .select()
        .single()

      if (error) throw error

      // Update local state immediately
      if (data) {
        store$.profile.set(data as any)
      }

      Alert.alert('Success', 'Profile updated!')
      setIsEditing(false)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update profile'
      Alert.alert('Error', errorMessage)
      console.error('Profile update error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePickAvatar = async () => {
    // Get fresh profile from store
    const currentProfile = store$.profile.get()
    if (!currentProfile) {
      Alert.alert('Error', 'No profile loaded. Please try reloading the app.')
      return
    }

    // Pick and upload image using the hook
    const result = await pickAndUpload({
      pathPrefix: 'avatars',
      identifier: currentProfile.id,
    })

    if (!result) return

    try {
      // Update profile in Supabase
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: result.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProfile.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      if (updatedProfile) {
        store$.profile.set(updatedProfile as any)
      }

      Alert.alert('Success', 'Avatar updated!')
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile')
      console.error('Avatar update error:', err)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          AuthEvents.logoutCompleted()
          resetAnalytics()
          await supabase.auth.signOut()
        },
      },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.\n\nAll your data including:\n- Profile information\n- Challenges and completions\n- Group memberships\n- Tags sent and received\n\nwill be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    )
  }

  const confirmDeleteAccount = () => {
    // Second confirmation with typing requirement
    Alert.prompt(
      'Confirm Deletion',
      'Type "DELETE" to confirm account deletion:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async (text: string | undefined) => {
            if (text?.toUpperCase() !== 'DELETE') {
              Alert.alert('Error', 'Please type DELETE to confirm')
              return
            }
            await executeDeleteAccount()
          },
        },
      ],
      'plain-text'
    )
  }

  const executeDeleteAccount = async () => {
    setDeletingAccount(true)

    try {
      // Call the RPC function to delete account data
      const { data, error } = await supabase.rpc('delete_user_account')

      if (error) throw error

      // Track account deletion
      AuthEvents.accountDeleted()
      resetAnalytics()

      Alert.alert(
        'Account Deleted',
        'Your account has been deleted. You will now be signed out.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await supabase.auth.signOut()
            },
          },
        ]
      )
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to delete account'
      Alert.alert('Error', errorMessage)
      console.error('Delete account error:', err)
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <SafeArea edges={['top']}>
      <ScrollView
        flex={1}
        bg="$background"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <YStack p="$4" gap="$4">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <H1 fontSize="$8">Profile</H1>
            <Button
              size="$3"
              unstyled
              icon={<Settings size={20} />}
              onPress={() => Alert.alert('Settings', 'Settings coming soon!')}
            />
          </XStack>

          {/* Profile Header - Instagram Style */}
          <XStack gap="$4" alignItems="center">
            {/* Avatar */}
            <YStack position="relative">
              <Avatar circular size="$9">
                {profile?.avatar_url ? (
                  <Avatar.Image src={profile.avatar_url} />
                ) : (
                  <Avatar.Fallback bg="$blue10" justifyContent="center" alignItems="center">
                    <User size={40} color="white" />
                  </Avatar.Fallback>
                )}
              </Avatar>
              {uploadingAvatar ? (
                <YStack
                  position="absolute"
                  bottom={0}
                  right={0}
                  bg="$blue10"
                  p="$2"
                  br="$10"
                >
                  <ActivityIndicator size="small" color="white" />
                </YStack>
              ) : (
                <Button
                  position="absolute"
                  bottom={0}
                  right={0}
                  size="$3"
                  circular
                  bg="$blue10"
                  icon={<Camera size={16} color="white" />}
                  onPress={handlePickAvatar}
                />
              )}
            </YStack>

            {/* Stats Row */}
            <XStack flex={1} justifyContent="space-around">
              <YStack alignItems="center">
                <Text fontWeight="700" fontSize="$6">
                  {totalCompletions}
                </Text>
                <Text color="$gray10" fontSize="$2">
                  Completions
                </Text>
              </YStack>

              <YStack alignItems="center">
                <Text fontWeight="700" fontSize="$6">
                  {currentStreak}
                </Text>
                <Text color="$gray10" fontSize="$2">
                  Day Streak
                </Text>
              </YStack>

              <YStack alignItems="center">
                <Text fontWeight="700" fontSize="$6">
                  {profile?.longest_streak || 0}
                </Text>
                <Text color="$gray10" fontSize="$2">
                  Best Streak
                </Text>
              </YStack>
            </XStack>
          </XStack>

          {/* Name and Bio Section */}
          <YStack gap="$2">
            {isEditing ? (
              <YStack gap="$3">
                <XStack gap="$2">
                  <Input
                    flex={1}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    size="$4"
                  />
                  <Input
                    flex={1}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    size="$4"
                  />
                </XStack>
                <XStack gap="$2">
                  <Button
                    flex={1}
                    size="$4"
                    bg="$blue10"
                    onPress={handleSaveProfile}
                    disabled={loading}
                  >
                    <Text color="white" fontWeight="600">
                      {loading ? 'Saving...' : 'Save'}
                    </Text>
                  </Button>
                  <Button
                    flex={1}
                    size="$4"
                    bg="$gray4"
                    disabled={loading}
                    onPress={() => {
                      const currentProfile = store$.profile.get()
                      setFirstName(currentProfile?.first_name || '')
                      setLastName(currentProfile?.last_name || '')
                      setIsEditing(false)
                    }}
                  >
                    <Text>Cancel</Text>
                  </Button>
                </XStack>
              </YStack>
            ) : (
              <YStack gap="$1">
                <XStack alignItems="center" gap="$2">
                  <Text fontWeight="700" fontSize="$6">
                    {profile?.first_name
                      ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
                      : 'Set your name'}
                  </Text>
                  <Button
                    size="$2"
                    circular
                    unstyled
                    icon={<Edit3 size={16} />}
                    onPress={() => setIsEditing(true)}
                  />
                </XStack>
                {profile?.username && (
                  <XStack gap="$1" alignItems="center">
                    <AtSign size={14} color="$gray10" />
                    <Text color="$gray10" fontSize="$3">
                      {profile.username}
                    </Text>
                  </XStack>
                )}
              </YStack>
            )}
          </YStack>

          {/* Activity Chart */}
          <ActivityChart defaultPeriod={7} />

          {/* Actions */}
          <YStack gap="$3">
            <H2 fontSize="$5">Settings</H2>

            <Card bg="$backgroundHover" overflow="hidden" br="$4">
              <Button
                bg="transparent"
                justifyContent="flex-start"
                icon={<Bell size={20} />}
                onPress={() => Alert.alert('Notifications', 'Notification settings coming soon!')}
              >
                Notifications
              </Button>
              <Separator />
              <Button
                bg="transparent"
                justifyContent="flex-start"
                icon={<Settings size={20} />}
                onPress={() => Alert.alert('Preferences', 'Preferences coming soon!')}
              >
                Preferences
              </Button>
            </Card>

            {/* Sign Out */}
            <Button
              size="$5"
              bg="$gray8"
              icon={<LogOut size={20} color="white" />}
              onPress={handleSignOut}
              accessibilityLabel="Sign out of your account"
            >
              <Text color="white" fontWeight="600">Sign Out</Text>
            </Button>

            {/* Danger Zone */}
            <YStack gap="$2" mt="$4">
              <XStack gap="$2" alignItems="center">
                <AlertTriangle size={16} color="$red10" />
                <Text fontWeight="600" color="$red10">Danger Zone</Text>
              </XStack>
              <Button
                size="$5"
                bg="$red10"
                icon={deletingAccount ? undefined : <Trash2 size={20} color="white" />}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                accessibilityLabel="Delete your account permanently"
              >
                <Text color="white" fontWeight="600">
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </Text>
              </Button>
              <Text color="$gray10" fontSize="$2" textAlign="center">
                This will permanently delete all your data
              </Text>
            </YStack>
          </YStack>

          {/* Footer */}
          <YStack alignItems="center" py="$4" gap="$2">
            <Text color="$gray10" fontSize="$2">
              fyt v1.0.0
            </Text>
            <Text color="$gray10" fontSize="$2">
              Built with ❤️ for fitness enthusiasts
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeArea>
  )
}

export default observer(ProfileScreen)
