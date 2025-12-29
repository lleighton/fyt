import { useState, useEffect } from 'react'
import { Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  H1,
  Button,
  Card,
  Avatar,
  ScrollView,
} from 'tamagui'
import { X, UserPlus, Check, AtSign } from '@tamagui/lucide-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { supabase } from '@/lib/supabase'
import { store$, auth$ } from '@/lib/legend-state/store'
import { UserSearch } from '@/components/user'

interface SelectedUser {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
}

/**
 * Invite members to group screen
 * Search and select users to invite
 */
function InviteMembersScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const session = auth$.session.get()
  const groups = store$.groups.get()

  const group = groups && id ? (groups as any)[id] : null

  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [loading, setLoading] = useState(false)
  const [existingMemberIds, setExistingMemberIds] = useState<string[]>([])

  // Get existing member IDs to exclude from search results
  useEffect(() => {
    if (group?.members) {
      const memberIds = group.members.map((m: any) => m.user_id)
      setExistingMemberIds(memberIds)
    }
  }, [group])

  const handleSelectUser = (user: any) => {
    // Check if already a member
    if (existingMemberIds.includes(user.id)) {
      Alert.alert('Already a member', `${user.first_name || user.username} is already in this group`)
      return
    }

    // Toggle selection
    const isSelected = selectedUsers.some((u) => u.id === user.id)
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
  }

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user to invite')
      return
    }

    if (!id || !session?.user?.id) {
      Alert.alert('Error', 'Missing group or session information')
      return
    }

    setLoading(true)

    try {
      // Insert all selected users as group members
      const membersToInsert = selectedUsers.map((user) => ({
        group_id: id,
        user_id: user.id,
        role: 'member' as const,
      }))

      const { error } = await (supabase
        .from('group_members') as any)
        .insert(membersToInsert)

      if (error) throw error

      // Update local store
      const currentGroup = (store$.groups as any)[id]?.get()
      if (currentGroup) {
        const newMembers = selectedUsers.map((user) => ({
          user_id: user.id,
          role: 'member',
          profile: {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            display_name: user.display_name || `${user.first_name} ${user.last_name}`.trim(),
            avatar_url: user.avatar_url,
          },
          created_at: new Date().toISOString(),
        }))

        ;(store$.groups as any)[id].set({
          ...currentGroup,
          members: [...(currentGroup.members || []), ...newMembers],
          member_count: (currentGroup.member_count || 0) + selectedUsers.length,
        })
      }

      Alert.alert(
        'Invited!',
        `${selectedUsers.length} ${selectedUsers.length === 1 ? 'member has' : 'members have'} been added to the group`,
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (error: any) {
      console.error('Error inviting members:', error)
      if (error.code === '23505') {
        Alert.alert('Error', 'One or more users are already members of this group')
      } else {
        Alert.alert('Error', error.message || 'Failed to invite members')
      }
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = (user: SelectedUser) => {
    if (user.first_name) {
      return `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    }
    return user.display_name || user.username
  }

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center" p="$4">
          <Text>Group not found</Text>
          <Button mt="$4" onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Button>
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <H1 fontSize="$7">Invite Members</H1>
          <Button
            size="$3"
            circular
            unstyled
            icon={<X size={24} />}
            onPress={() => router.back()}
          />
        </XStack>

        {/* Group Name */}
        <XStack px="$4" pb="$2">
          <Text color="$gray10">
            Inviting to <Text fontWeight="600">{group.name}</Text>
          </Text>
        </XStack>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <YStack px="$4" pb="$3">
            <Text fontWeight="600" fontSize="$3" mb="$2">
              Selected ({selectedUsers.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2">
                {selectedUsers.map((user) => (
                  <Card
                    key={user.id}
                    bg="$blue2"
                    px="$3"
                    py="$2"
                    br="$10"
                    borderWidth={1}
                    borderColor="$blue7"
                    pressStyle={{ scale: 0.95 }}
                    animation="quick"
                    onPress={() => handleRemoveUser(user.id)}
                  >
                    <XStack gap="$2" alignItems="center">
                      <Avatar circular size="$2">
                        {user.avatar_url ? (
                          <Avatar.Image src={user.avatar_url} />
                        ) : (
                          <Avatar.Fallback bg="$blue10" justifyContent="center" alignItems="center">
                            <Text color="white" fontSize="$1" fontWeight="700">
                              {(user.first_name || user.username || 'U')[0]?.toUpperCase() || 'U'}
                            </Text>
                          </Avatar.Fallback>
                        )}
                      </Avatar>
                      <Text fontSize="$3" fontWeight="500">
                        {user.first_name || user.username}
                      </Text>
                      <X size={14} color="$blue10" />
                    </XStack>
                  </Card>
                ))}
              </XStack>
            </ScrollView>
          </YStack>
        )}

        {/* Search */}
        <YStack flex={1} px="$4">
          <UserSearch
            onSelectUser={handleSelectUser}
            selectedUserIds={[...selectedUsers.map((u) => u.id), ...existingMemberIds]}
            placeholder="Search by username or name"
          />
        </YStack>

        {/* Invite Button */}
        <YStack px="$4" py="$4" borderTopWidth={1} borderTopColor="$gray4">
          <Button
            size="$5"
            bg={selectedUsers.length > 0 ? '$green10' : '$gray6'}
            icon={
              loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <UserPlus size={20} color="white" />
              )
            }
            onPress={handleInvite}
            disabled={selectedUsers.length === 0 || loading}
            opacity={selectedUsers.length > 0 && !loading ? 1 : 0.5}
          >
            <Text color="white" fontWeight="700">
              {loading
                ? 'Inviting...'
                : selectedUsers.length === 0
                ? 'Select users to invite'
                : `Invite ${selectedUsers.length} ${selectedUsers.length === 1 ? 'Member' : 'Members'}`}
            </Text>
          </Button>
        </YStack>
      </YStack>
    </SafeAreaView>
  )
}

export default observer(InviteMembersScreen)
