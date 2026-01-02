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
import { SafeArea } from '@/components/ui'

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
  const [excludedUserIds, setExcludedUserIds] = useState<string[]>([])

  // Get existing member IDs and pending invite IDs to exclude from search results
  useEffect(() => {
    const loadExcludedUsers = async () => {
      if (!id) return

      const excluded: string[] = []

      // Add existing members
      if (group?.members) {
        group.members.forEach((m: any) => excluded.push(m.user_id))
      }

      // Add users with pending invitations
      const { data: pendingInvites } = await (supabase
        .from('group_invites') as any)
        .select('invitee_id')
        .eq('group_id', id)
        .eq('status', 'pending')

      if (pendingInvites) {
        pendingInvites.forEach((inv: any) => excluded.push(inv.invitee_id))
      }

      setExcludedUserIds(excluded)
    }

    loadExcludedUsers()
  }, [group, id])

  const handleSelectUser = (user: any) => {
    // Check if already excluded (member or has pending invite)
    if (excludedUserIds.includes(user.id)) {
      Alert.alert('Cannot invite', `${user.first_name || user.username} is already a member or has a pending invitation`)
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
      // Create invitations for all selected users
      const invitesToInsert = selectedUsers.map((user) => ({
        group_id: id,
        inviter_id: session.user.id,
        invitee_id: user.id,
        status: 'pending' as const,
      }))

      const { data: insertedInvites, error } = await (supabase
        .from('group_invites') as any)
        .insert(invitesToInsert)
        .select('id')

      if (error) throw error

      // Send push notifications for each invite
      if (insertedInvites) {
        for (const invite of insertedInvites) {
          try {
            await supabase.functions.invoke('send-group-invite-notification', {
              body: { invite_id: invite.id },
            })
          } catch (notifError) {
            console.warn('Failed to send notification for invite:', invite.id, notifError)
            // Don't fail the whole operation for notification errors
          }
        }
      }

      Alert.alert(
        'Invitations Sent!',
        `${selectedUsers.length} ${selectedUsers.length === 1 ? 'invitation has' : 'invitations have'} been sent. They will need to accept to join the group.`,
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (error: any) {
      console.error('Error sending invitations:', error)
      if (error.code === '23505') {
        Alert.alert('Error', 'One or more users already have pending invitations')
      } else {
        Alert.alert('Error', error.message || 'Failed to send invitations')
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
      <SafeArea>
        <YStack flex={1} justifyContent="center" alignItems="center" p="$4">
          <Text>Group not found</Text>
          <Button mt="$4" onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Button>
        </YStack>
      </SafeArea>
    )
  }

  return (
    <SafeArea edges={['top', 'bottom']}>
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
                    bg="$orange2"
                    px="$3"
                    py="$2"
                    br="$10"
                    borderWidth={1}
                    borderColor="$orange7"
                    pressStyle={{ scale: 0.95 }}
                    animation="quick"
                    onPress={() => handleRemoveUser(user.id)}
                  >
                    <XStack gap="$2" alignItems="center">
                      <Avatar circular size="$2">
                        {user.avatar_url ? (
                          <Avatar.Image src={user.avatar_url} />
                        ) : (
                          <Avatar.Fallback bg="$orange10" justifyContent="center" alignItems="center">
                            <Text color="white" fontSize="$1" fontWeight="700">
                              {(user.first_name || user.username || 'U')[0]?.toUpperCase() || 'U'}
                            </Text>
                          </Avatar.Fallback>
                        )}
                      </Avatar>
                      <Text fontSize="$3" fontWeight="500">
                        {user.first_name || user.username}
                      </Text>
                      <X size={14} color="$orange10" />
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
            selectedUserIds={[...selectedUsers.map((u) => u.id), ...excludedUserIds]}
            placeholder="Search by username or name"
          />
        </YStack>

        {/* Invite Button */}
        <YStack px="$4" py="$4" borderTopWidth={1} borderTopColor="$gray4">
          <Button
            size="$5"
            bg={selectedUsers.length > 0 ? '$orange10' : '$gray6'}
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
    </SafeArea>
  )
}

export default observer(InviteMembersScreen)
