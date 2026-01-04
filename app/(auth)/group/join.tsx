import { useState, useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  H1,
  Button,
  Card,
  Input,
} from 'tamagui'
import {
  X,
  Users,
  Key,
  ArrowRight,
} from '@tamagui/lucide-icons'
import { KeyboardSafeArea } from '@/components/ui'
import { Alert } from 'react-native'

import { auth$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import { GroupEvents } from '@/lib/analytics'
import type { Database } from '@/types/database.types'

/**
 * Join group screen
 *
 * Enter an invite code to join an existing group
 */
function JoinGroupScreen() {
  const router = useRouter()
  const { code } = useLocalSearchParams<{ code?: string }>()
  const session = auth$.session.get()

  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-populate invite code from deep link
  useEffect(() => {
    if (code && typeof code === 'string') {
      const cleanCode = code.trim().toUpperCase()
      setInviteCode(cleanCode)

      // Auto-join if code is valid length
      if (cleanCode.length === 6) {
        // Small delay to show the UI before joining
        setTimeout(() => {
          handleJoinGroup(cleanCode)
        }, 500)
      }
    }
  }, [code])

  const handleJoinGroup = async (providedCode?: string) => {
    if (!session?.user) {
      Alert.alert('Error', 'You must be logged in to join a group')
      return
    }

    const codeToUse = providedCode || inviteCode.trim().toUpperCase()
    if (codeToUse.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-character invite code')
      return
    }

    setLoading(true)
    try {
      // Find group by invite code
      const { data: groups, error: findError } = await (supabase
        .from('groups')
        .select('*')
        .eq('invite_code', codeToUse)
        .limit(1) as any)

      if (findError) throw findError

      if (!groups || groups.length === 0) {
        Alert.alert('Error', 'Invalid invite code. Please check and try again.')
        setLoading(false)
        return
      }

      const group = groups[0]

      // Check if already a member
      const { data: existingMember } = await (supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', session.user.id)
        .limit(1) as any)

      if (existingMember && existingMember.length > 0) {
        Alert.alert(
          'Already a Member',
          `You're already a member of ${group.name}`,
          [
            {
              text: 'View Group',
              onPress: () => router.replace(`/(auth)/group/${group.id}`),
            },
          ]
        )
        setLoading(false)
        return
      }

      // Add user as member
      const memberData: Database['public']['Tables']['group_members']['Insert'] = {
        group_id: group.id,
        user_id: session.user.id,
        role: 'member',
      }

      // @ts-expect-error - Supabase generated types have issues with insert
      const { error: memberError } = await supabase
        .from('group_members')
        .insert(memberData)

      if (memberError) throw memberError

      // Track group join
      GroupEvents.joined({
        groupId: group.id,
        method: code ? 'link' : 'code',
      })

      Alert.alert(
        'Welcome!',
        `You've joined ${group.name}. Start competing with your group!`,
        [
          {
            text: 'View Group',
            onPress: () => router.replace(`/(auth)/group/${group.id}`),
          },
        ]
      )
    } catch (err) {
      Alert.alert('Error', 'Failed to join group')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardSafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <H1 fontSize="$7">Join Group</H1>
          <Button
            size="$3"
            circular
            unstyled
            icon={<X size={24} />}
            onPress={() => router.back()}
          />
        </XStack>

        <YStack flex={1} justifyContent="center" p="$4" gap="$4">
          {/* Icon */}
          <YStack alignItems="center" gap="$3" mb="$4">
            <YStack
              width={80}
              height={80}
              bg="$orange10"
              br="$10"
              alignItems="center"
              justifyContent="center"
            >
              <Users size={40} color="white" />
            </YStack>
            <YStack alignItems="center" gap="$2">
              <Text fontSize="$6" fontWeight="600">
                Join a Fitness Group
              </Text>
              <Text color="$gray10" textAlign="center" maxWidth={300}>
                Enter the invite code shared by your friend to join their group
              </Text>
            </YStack>
          </YStack>

          {/* Invite Code Input */}
          <Card bg="$backgroundHover" p="$4" br="$4">
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Key size={20} color="$orange10" />
                <Text fontWeight="600" fontSize="$4">
                  Invite Code
                </Text>
              </XStack>
              <Input
                placeholder="ABCD12"
                placeholderTextColor="$gray10"
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                size="$6"
                textAlign="center"
                letterSpacing={4}
                fontSize="$7"
                fontWeight="700"
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
                color="$color"
                bg="$backgroundStrong"
              />
              <Text color="$gray10" fontSize="$2" textAlign="center">
                Enter the 6-character code
              </Text>
            </YStack>
          </Card>

          {/* Join Button */}
          <Button
            size="$5"
            bg="$orange10"
            icon={<ArrowRight size={20} />}
            disabled={loading || inviteCode.length !== 6}
            onPress={handleJoinGroup}
          >
            {loading ? 'Joining...' : 'Join Group'}
          </Button>

          {/* Divider */}
          <XStack alignItems="center" gap="$3" my="$2">
            <YStack flex={1} height={1} bg="$borderColor" />
            <Text color="$gray10" fontSize="$2">
              OR
            </Text>
            <YStack flex={1} height={1} bg="$borderColor" />
          </XStack>

          {/* Create Group Button */}
          <Button
            size="$4"
            variant="outlined"
            onPress={() => router.push('/(auth)/group/create')}
          >
            Create Your Own Group
          </Button>
        </YStack>
      </YStack>
    </KeyboardSafeArea>
  )
}

export default observer(JoinGroupScreen)
