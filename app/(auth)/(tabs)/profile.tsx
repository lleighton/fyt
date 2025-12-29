import { useState, useEffect, useCallback } from 'react'
import { Alert, ActivityIndicator } from 'react-native'
import { observer } from '@legendapp/state/react'
import { useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
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
} from '@tamagui/lucide-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { store$, auth$, profile$, completions$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import ActivityChart from '@/components/activity/ActivityChart'

/**
 * Profile screen
 *
 * Shows user info, stats, and settings
 */
function ProfileScreen() {
  const profile = store$.profile.get()
  const completions = store$.completions.get()
  const currentStreak = store$.currentStreak()
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

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
    try {
      // Get fresh profile from store
      const currentProfile = store$.profile.get()
      if (!currentProfile) {
        Alert.alert('Error', 'No profile loaded. Please try reloading the app.')
        return
      }

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to upload an avatar')
        return
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      })

      if (result.canceled || !result.assets || !result.assets[0]) {
        return
      }

      setUploadingAvatar(true)

      const image = result.assets[0]
      const fileExt = image.uri.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${currentProfile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Read file as base64 using expo-file-system
      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: 'base64',
      })

      // Decode base64 to ArrayBuffer for Supabase upload
      const arrayBuffer = decode(base64)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('tagfit')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('tagfit')
        .getPublicUrl(filePath)

      const avatarUrl = urlData.publicUrl

      // Update profile in Supabase
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
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
      const errorMessage = err?.message || 'Failed to upload avatar'
      Alert.alert('Error', errorMessage)
      console.error('Avatar upload error:', err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
        },
      },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView flex={1} bg="$background">
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
              bg="$red10"
              icon={<LogOut size={20} />}
              onPress={handleSignOut}
            >
              Sign Out
            </Button>
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
    </SafeAreaView>
  )
}

export default observer(ProfileScreen)
