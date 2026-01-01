import { useState } from 'react'
import { useRouter } from 'expo-router'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  H1,
  Button,
  Card,
  ScrollView,
  Input,
  TextArea,
  Switch,
} from 'tamagui'
import {
  X,
  Users,
  Lock,
  Globe,
  CheckCircle,
} from '@tamagui/lucide-icons'
import { SafeArea } from '@/components/ui'
import { Alert, Share } from 'react-native'
import * as Clipboard from 'expo-clipboard'

import { auth$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import { GroupEvents } from '@/lib/analytics'
import type { Database } from '@/types/database.types'

/**
 * Group creation screen
 *
 * Create a fitness group for friends, gym buddies, or public challenges
 */
function CreateGroupScreen() {
  const router = useRouter()
  const session = auth$.session.get()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [loading, setLoading] = useState(false)

  const generateInviteCode = () => {
    // Generate 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleCreateGroup = async () => {
    if (!session?.user) {
      Alert.alert('Error', 'You must be logged in to create a group')
      return
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name')
      return
    }

    setLoading(true)
    try {
      // Create group
      const groupData: Database['public']['Tables']['groups']['Insert'] = {
        name: name.trim(),
        description: description.trim() || null,
        is_private: isPrivate,
        invite_code: generateInviteCode(),
        creator_id: session.user.id,
      }

      // @ts-expect-error - Supabase generated types have issues with insert
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single()

      if (groupError) throw groupError

      // Add creator as admin member
      const memberData: Database['public']['Tables']['group_members']['Insert'] = {
        group_id: group.id,
        user_id: session.user.id,
        role: 'admin',
      }

      // @ts-expect-error - Supabase generated types have issues with insert
      const { error: memberError } = await supabase
        .from('group_members')
        .insert(memberData)

      if (memberError) throw memberError

      // Track group creation
      GroupEvents.created({
        groupId: group.id,
        isPrivate,
      })

      // Show success with sharing options
      Alert.alert(
        '🎉 Group Created!',
        `${name} is ready!\n\nInvite Code: ${group.invite_code}\n\nShare this code with friends to invite them.`,
        [
          {
            text: 'Copy Code',
            onPress: async () => {
              await Clipboard.setStringAsync(group.invite_code)
              Alert.alert('Copied!', 'Invite code copied to clipboard')
              router.replace(`/(auth)/group/${group.id}`)
            },
          },
          {
            text: 'Share',
            onPress: async () => {
              try {
                const inviteLink = `https://fyt.it.com/group/join?code=${group.invite_code}`
                const message = `🏋️ Join "${name}" on fyt!\n\n${inviteLink}\n\nOr use invite code: ${group.invite_code}\n\nLet's compete and get fit together! 💪`
                await Share.share({
                  message,
                  title: `Join ${name}`,
                })
              } catch (err) {
                console.error(err)
              }
              router.replace(`/(auth)/group/${group.id}`)
            },
          },
          {
            text: 'View Group',
            style: 'cancel',
            onPress: () => router.replace(`/(auth)/group/${group.id}`),
          },
        ]
      )
    } catch (err) {
      Alert.alert('Error', 'Failed to create group')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <H1 fontSize="$7">Create Group</H1>
          <Button
            size="$3"
            circular
            unstyled
            icon={<X />}
            onPress={() => router.back()}
          />
        </XStack>

        <ScrollView flex={1}>
          <YStack p="$4" gap="$4">
            {/* Info Card */}
            <Card bg="$blue2" p="$4" br="$4" borderWidth={1} borderColor="$blue10">
              <XStack gap="$3" alignItems="center">
                <Users size={32} color="$blue10" />
                <YStack flex={1}>
                  <Text fontWeight="600" fontSize="$4">
                    Create Your Fitness Squad
                  </Text>
                  <Text color="$gray10" fontSize="$3">
                    Build a community, share challenges, and compete together
                  </Text>
                </YStack>
              </XStack>
            </Card>

            {/* Group Name */}
            <YStack gap="$2">
              <Text fontWeight="600">Group Name *</Text>
              <Input
                placeholder="e.g., Morning Warriors, Gym Bros"
                value={name}
                onChangeText={setName}
                size="$5"
                autoFocus
              />
            </YStack>

            {/* Description */}
            <YStack gap="$2">
              <Text fontWeight="600">Description (optional)</Text>
              <TextArea
                placeholder="Tell people what your group is about"
                value={description}
                onChangeText={setDescription}
                size="$4"
                numberOfLines={4}
              />
            </YStack>

            {/* Privacy Setting */}
            <Card bg="$backgroundHover" p="$4" br="$4">
              <YStack gap="$3">
                <Text fontWeight="600" fontSize="$4">
                  Privacy
                </Text>

                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  p="$3"
                  br="$3"
                  bg={isPrivate ? '$blue2' : 'transparent'}
                >
                  <XStack gap="$3" alignItems="center" flex={1}>
                    <Lock size={24} color={isPrivate ? '$blue10' : '$gray10'} />
                    <YStack flex={1}>
                      <Text fontWeight="600">Private Group</Text>
                      <Text color="$gray10" fontSize="$2">
                        Invite-only, members need your code to join
                      </Text>
                    </YStack>
                  </XStack>
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                    size="$3"
                  >
                    <Switch.Thumb animation="quick" />
                  </Switch>
                </XStack>

                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  p="$3"
                  br="$3"
                  bg={!isPrivate ? '$green2' : 'transparent'}
                >
                  <XStack gap="$3" alignItems="center" flex={1}>
                    <Globe size={24} color={!isPrivate ? '$green10' : '$gray10'} />
                    <YStack flex={1}>
                      <Text fontWeight="600">Public Group</Text>
                      <Text color="$gray10" fontSize="$2">
                        Anyone can discover and join your group
                      </Text>
                    </YStack>
                  </XStack>
                </XStack>
              </YStack>
            </Card>

            {/* What Happens Next */}
            <YStack gap="$2">
              <Text fontWeight="600" fontSize="$4">
                What happens next?
              </Text>
              <YStack gap="$2" pl="$2">
                <XStack gap="$2" alignItems="flex-start">
                  <CheckCircle size={16} color="$green10" />
                  <Text flex={1} color="$gray10" fontSize="$3">
                    You'll get a unique invite code to share
                  </Text>
                </XStack>
                <XStack gap="$2" alignItems="flex-start">
                  <CheckCircle size={16} color="$green10" />
                  <Text flex={1} color="$gray10" fontSize="$3">
                    Members can join challenges and compete
                  </Text>
                </XStack>
                <XStack gap="$2" alignItems="flex-start">
                  <CheckCircle size={16} color="$green10" />
                  <Text flex={1} color="$gray10" fontSize="$3">
                    Track group leaderboards and activity
                  </Text>
                </XStack>
              </YStack>
            </YStack>
          </YStack>
        </ScrollView>

        {/* Create Button */}
        <YStack p="$4" bg="$background" borderTopWidth={1} borderColor="$borderColor">
          <Button
            size="$5"
            bg="$blue10"
            icon={<Users size={20} />}
            disabled={loading || !name.trim()}
            onPress={handleCreateGroup}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </YStack>
      </YStack>
    </SafeArea>
  )
}

export default observer(CreateGroupScreen)
