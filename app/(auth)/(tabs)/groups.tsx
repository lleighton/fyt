import { useState } from 'react'
import { Alert, ActivityIndicator, RefreshControl } from 'react-native'
import { observer } from '@legendapp/state/react'
import { useRouter } from 'expo-router'
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  ScrollView,
  Avatar,
} from 'tamagui'
import {
  Users,
  Plus,
  Key,
  Crown,
  Lock,
  Globe,
  ChevronRight,
  Check,
  X,
  Mail,
} from '@tamagui/lucide-icons'
import { SafeArea, GroupsListSkeleton, InviteCardSkeleton } from '@/components/ui'

import { store$, auth$, groupInvites$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import { useScreenRefresh } from '@/lib/sync-service'

interface PendingInvite {
  invite_id: string
  group_id: string
  group_name: string
  group_avatar_url: string | null
  inviter_id: string
  inviter_name: string | null
  inviter_avatar_url: string | null
  created_at: string
}

/**
 * Groups tab screen
 *
 * Shows all groups the user is a member of
 * Shows pending group invitations
 * Allows creating or joining new groups
 */
function GroupsScreen() {
  const router = useRouter()
  const session = auth$.session.get()
  const allGroups = store$.groups.get()
  const groupInvitesData = groupInvites$.get()

  // Auto-refresh on focus + polling every 30s while visible
  const { isRefreshing, onRefresh } = useScreenRefresh(
    { groups: true, groupInvites: true },
    30000
  )

  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null)

  // Check if data is still loading (initial load)
  const isInitialLoading = allGroups === undefined || allGroups === null

  // Filter to groups where user is a member
  const myGroups = allGroups
    ? Object.values(allGroups).filter((group: any) =>
        group.members?.some((m: any) => m.user_id === session?.user?.id)
      )
    : []

  // Get pending invites from Legend State (real-time sync)
  const pendingInvites = groupInvitesData
    ? Object.values(groupInvitesData)
        .filter((invite: any) => invite?.status === 'pending')
        .map((invite: any) => ({
          invite_id: invite.id,
          group_id: invite.group_id,
          group_name: invite.group?.name || 'Unknown Group',
          group_avatar_url: invite.group?.avatar_url || null,
          inviter_id: invite.inviter_id,
          inviter_name: invite.inviter?.display_name || null,
          inviter_avatar_url: invite.inviter?.avatar_url || null,
          created_at: invite.created_at,
        }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : []

  const handleAcceptInvite = async (invite: PendingInvite) => {
    setProcessingInviteId(invite.invite_id)
    try {
      const { error } = await (supabase.rpc as any)('accept_group_invite', {
        p_invite_id: invite.invite_id,
      })

      if (error) throw error

      // Legend State will automatically update via realtime sync
      Alert.alert('Joined!', `You are now a member of "${invite.group_name}"`)

      // Navigate to the group
      router.push(`/(auth)/group/${invite.group_id}`)
    } catch (error: any) {
      console.error('Error accepting invite:', error)
      Alert.alert('Error', error.message || 'Failed to accept invitation')
    } finally {
      setProcessingInviteId(null)
    }
  }

  const handleDeclineInvite = async (invite: PendingInvite) => {
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline the invitation to "${invite.group_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingInviteId(invite.invite_id)
            try {
              const { error } = await (supabase.rpc as any)('decline_group_invite', {
                p_invite_id: invite.invite_id,
              })

              if (error) throw error
              // Legend State will automatically update via realtime sync
            } catch (error: any) {
              console.error('Error declining invite:', error)
              Alert.alert('Error', error.message || 'Failed to decline invitation')
            } finally {
              setProcessingInviteId(null)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header - Athletic Broadcast Style */}
        <YStack px="$4" py="$4" gap="$1">
          <Text
            color="$gray10"
            fontSize="$2"
            fontFamily="$body"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing={1.2}
          >
            Your Teams
          </Text>
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontFamily="$display"
              fontSize={40}
              color="$color"
              letterSpacing={1}
            >
              GROUPS
            </Text>
            <Button
              size="$4"
              circular
              bg="$coral6"
              icon={<Plus size={20} color="white" />}
              onPress={() => router.push('/(auth)/group/create')}
            />
          </XStack>
        </YStack>

        <ScrollView
          flex={1}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          <YStack p="$4" gap="$4">
            {/* Loading Skeleton */}
            {isInitialLoading && (
              <YStack gap="$4">
                <InviteCardSkeleton />
                <GroupsListSkeleton />
              </YStack>
            )}

            {/* Pending Invitations */}
            {!isInitialLoading && pendingInvites.length > 0 && (
              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <Mail size={18} color="$orange10" />
                  <Text fontWeight="700" fontSize="$4" color="$orange11">
                    Pending Invitations
                  </Text>
                  <XStack bg="$orange10" px="$2" py="$1" br="$10">
                    <Text color="white" fontSize="$2" fontWeight="700">
                      {pendingInvites.length}
                    </Text>
                  </XStack>
                </XStack>

                {pendingInvites.map((invite) => {
                  const isProcessing = processingInviteId === invite.invite_id

                  return (
                    <Card
                      key={invite.invite_id}
                      bg="$orange2"
                      p="$4"
                      br="$5"
                      borderWidth={2}
                      borderColor="$orange7"
                    >
                      <YStack gap="$3">
                        <XStack gap="$3" alignItems="center">
                          <Avatar circular size="$5" bg="$orange10">
                            {invite.group_avatar_url ? (
                              <Avatar.Image src={invite.group_avatar_url} />
                            ) : (
                              <Avatar.Fallback justifyContent="center" alignItems="center">
                                <Users size={24} color="white" />
                              </Avatar.Fallback>
                            )}
                          </Avatar>
                          <YStack flex={1} gap="$1">
                            <Text fontWeight="700" fontSize="$4">
                              {invite.group_name}
                            </Text>
                            <Text color="$gray11" fontSize="$3">
                              Invited by {invite.inviter_name || 'Someone'}
                            </Text>
                          </YStack>
                        </XStack>

                        <XStack gap="$2">
                          <Button
                            flex={1}
                            size="$4"
                            bg="$green10"
                            icon={
                              isProcessing ? (
                                <ActivityIndicator size="small" color="white" />
                              ) : (
                                <Check size={18} color="white" />
                              )
                            }
                            onPress={() => handleAcceptInvite(invite)}
                            disabled={isProcessing}
                          >
                            <Text color="white" fontWeight="600">
                              Accept
                            </Text>
                          </Button>
                          <Button
                            flex={1}
                            size="$4"
                            bg="$gray4"
                            icon={<X size={18} color="$gray11" />}
                            onPress={() => handleDeclineInvite(invite)}
                            disabled={isProcessing}
                          >
                            <Text color="$gray11" fontWeight="600">
                              Decline
                            </Text>
                          </Button>
                        </XStack>
                      </YStack>
                    </Card>
                  )
                })}
              </YStack>
            )}

            {/* Empty State */}
            {!isInitialLoading && myGroups.length === 0 && pendingInvites.length === 0 && (
              <YStack gap="$4" mt="$8">
                <YStack alignItems="center" gap="$3">
                  <YStack
                    width={100}
                    height={100}
                    bg="$gray3"
                    br="$12"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Users size={48} color="$gray10" />
                  </YStack>
                  <YStack alignItems="center" gap="$2">
                    <Text fontSize="$6" fontWeight="600" textAlign="center">
                      No Groups Yet
                    </Text>
                    <Text
                      color="$gray11"
                      textAlign="center"
                      maxWidth={300}
                      fontSize="$3"
                    >
                      Create a group to compete with friends or join an existing one
                      with an invite code
                    </Text>
                  </YStack>
                </YStack>

                <YStack gap="$3" mt="$4">
                  <Button
                    size="$5"
                    bg="$orange10"
                    icon={<Plus size={20} />}
                    onPress={() => router.push('/(auth)/group/create')}
                  >
                    Create New Group
                  </Button>
                  <Button
                    size="$5"
                    variant="outlined"
                    icon={<Key size={20} />}
                    onPress={() => router.push('/(auth)/group/join')}
                  >
                    Join with Code
                  </Button>
                </YStack>
              </YStack>
            )}

            {/* Groups List */}
            {!isInitialLoading && myGroups.length > 0 && (
              <>
                {/* Quick Actions */}
                <XStack gap="$2">
                  <Button
                    flex={1}
                    size="$4"
                    bg="$orange10"
                    icon={<Plus size={18} />}
                    onPress={() => router.push('/(auth)/group/create')}
                  >
                    Create
                  </Button>
                  <Button
                    flex={1}
                    size="$4"
                    variant="outlined"
                    icon={<Key size={18} />}
                    onPress={() => router.push('/(auth)/group/join')}
                  >
                    Join
                  </Button>
                </XStack>

                {/* Groups */}
                <YStack gap="$3">
                  {myGroups.map((group: any) => {
                    const isAdmin = group.members?.some(
                      (m: any) => m.user_id === session?.user?.id && m.role === 'admin'
                    )

                    return (
                      <Card
                        key={group.id}
                        bg="$gray2"
                        p="$5"
                        br="$6"
                        borderWidth={0}
                        shadowColor="$shadowColor"
                        shadowOffset={{ width: 0, height: 2 }}
                        shadowOpacity={0.1}
                        shadowRadius={8}
                        elevation={2}
                        pressStyle={{ scale: 0.98 }}
                        animation="quick"
                        onPress={() => router.push(`/(auth)/group/${group.id}`)}
                      >
                        <XStack gap="$4" alignItems="center">
                          {/* Avatar */}
                          <Avatar circular size="$6" bg="$orange10">
                            {group.avatar_url ? (
                              <Avatar.Image src={group.avatar_url} />
                            ) : (
                              <Avatar.Fallback justifyContent="center" alignItems="center">
                                <Users size={28} color="white" />
                              </Avatar.Fallback>
                            )}
                          </Avatar>

                          {/* Info */}
                          <YStack flex={1} gap="$2">
                            <XStack gap="$2" alignItems="center">
                              <Text fontSize="$5" fontWeight="700">
                                {group.name}
                              </Text>
                              {isAdmin && <Crown size={16} color="$yellow10" />}
                            </XStack>

                            {group.description && (
                              <Text color="$gray11" fontSize="$3" numberOfLines={1}>
                                {group.description}
                              </Text>
                            )}

                            <XStack gap="$4" mt="$1">
                              <XStack gap="$1" alignItems="center">
                                <Users size={14} color="$gray11" />
                                <Text color="$gray11" fontSize="$3">
                                  {group.member_count || 0} members
                                </Text>
                              </XStack>
                              <XStack gap="$1" alignItems="center">
                                {group.is_private ? (
                                  <Lock size={14} color="$gray11" />
                                ) : (
                                  <Globe size={14} color="$gray11" />
                                )}
                                <Text color="$gray11" fontSize="$3">
                                  {group.is_private ? 'Private' : 'Public'}
                                </Text>
                              </XStack>
                            </XStack>
                          </YStack>

                          {/* Chevron */}
                          <ChevronRight size={20} color="$gray10" />
                        </XStack>
                      </Card>
                    )
                  })}
                </YStack>
              </>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </SafeArea>
  )
}

export default observer(GroupsScreen)
