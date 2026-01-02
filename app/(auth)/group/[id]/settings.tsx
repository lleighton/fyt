import { useState, useEffect } from 'react'
import { Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import * as Clipboard from 'expo-clipboard'
import {
  YStack,
  XStack,
  Text,
  H2,
  Button,
  Card,
  ScrollView,
  Avatar,
  Input,
  Switch,
  TextArea,
  Separator,
} from 'tamagui'
import {
  ArrowLeft,
  Users,
  Copy,
  RefreshCw,
  Crown,
  Trash2,
  LogOut,
  Camera,
  MoreVertical,
  UserMinus,
  ShieldCheck,
  Shield,
  X,
  Mail,
} from '@tamagui/lucide-icons'
import {
  KeyboardSafeArea,
  MembersListSkeleton,
  SkeletonCircle,
  SkeletonText,
  Skeleton,
} from '@/components/ui'

import { store$, auth$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import { useFocusRefresh } from '@/lib/sync-service'
import { useImageUpload } from '@/lib/hooks'

interface PendingInvite {
  invite_id: string
  invitee_id: string
  invitee_name: string | null
  invitee_username: string | null
  invitee_avatar_url: string | null
  inviter_name: string | null
  created_at: string
}

/**
 * Group settings screen (Admin only)
 *
 * Allows admins to:
 * - Edit group info (name, description, avatar)
 * - Toggle privacy
 * - Manage invite code
 * - Manage members (remove, promote/demote)
 * - View/cancel pending invites
 * - Leave or delete group
 */
function GroupSettingsScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const session = auth$.session.get()
  const groups = store$.groups.get()

  const group = groups && id ? (groups as any)[id] : null

  // Form state
  const [name, setName] = useState(group?.name || '')
  const [description, setDescription] = useState(group?.description || '')
  const [isPrivate, setIsPrivate] = useState(group?.is_private ?? false)
  const [inviteCode, setInviteCode] = useState(group?.invite_code || '')

  // Image upload hook
  const { uploading: uploadingImage, pickAndUpload } = useImageUpload()

  // Loading states
  const [saving, setSaving] = useState(false)
  const [regeneratingCode, setRegeneratingCode] = useState(false)
  const [processingMember, setProcessingMember] = useState<string | null>(null)
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)
  const [leavingGroup, setLeavingGroup] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)

  // Pending invites
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])

  // Member action menu
  const [selectedMember, setSelectedMember] = useState<any>(null)

  // Auto-refresh groups data on focus + polling every 30s
  useFocusRefresh({ groups: true }, 30000)

  // Sync form state when group changes
  useEffect(() => {
    if (group) {
      setName(group.name || '')
      setDescription(group.description || '')
      setIsPrivate(group.is_private ?? false)
      setInviteCode(group.invite_code || '')
    }
  }, [group])

  // Load pending invites
  useEffect(() => {
    if (!id) return

    const loadPendingInvites = async () => {
      setLoadingInvites(true)
      try {
        const { data, error } = await (supabase.rpc as any)('get_group_pending_invites', {
          p_group_id: id,
        })

        if (error) {
          console.error('Error loading pending invites:', error)
        } else {
          setPendingInvites(data || [])
        }
      } catch (err) {
        console.error('Error loading pending invites:', err)
      } finally {
        setLoadingInvites(false)
      }
    }

    loadPendingInvites()
  }, [id])

  const members = group?.members || []
  const isAdmin = members.some(
    (m: any) => m.user_id === session?.user?.id && m.role === 'admin'
  )
  const adminCount = members.filter((m: any) => m.role === 'admin').length

  // Check if still loading
  const isInitialLoading = groups === undefined || groups === null

  // Show skeleton while loading
  if (!group && isInitialLoading) {
    return (
      <KeyboardSafeArea edges={['top', 'bottom']}>
        <YStack flex={1} bg="$background">
          {/* Header skeleton */}
          <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
            <SkeletonCircle size={32} />
            <SkeletonText width={140} height={20} />
            <YStack width={32} />
          </XStack>

          <YStack p="$4" gap="$6">
            {/* Group Info skeleton */}
            <YStack gap="$3">
              <SkeletonText width={100} height={16} />
              <Card bg="$gray2" p="$4" br="$4">
                <YStack gap="$4">
                  <XStack gap="$4" alignItems="center">
                    <SkeletonCircle size={64} />
                    <YStack flex={1} gap="$2">
                      <SkeletonText width={140} height={14} />
                      <SkeletonText width={180} height={12} />
                    </YStack>
                  </XStack>
                  <Skeleton width="100%" height={44} borderRadius={8} />
                  <Skeleton width="100%" height={80} borderRadius={8} />
                  <Skeleton width="100%" height={44} borderRadius={8} />
                </YStack>
              </Card>
            </YStack>

            {/* Members skeleton */}
            <YStack gap="$3">
              <SkeletonText width={120} height={16} />
              <MembersListSkeleton count={3} />
            </YStack>
          </YStack>
        </YStack>
      </KeyboardSafeArea>
    )
  }

  // Redirect if not admin (after loading)
  if (!group || !isAdmin) {
    return (
      <KeyboardSafeArea>
        <YStack flex={1} justifyContent="center" alignItems="center" p="$4">
          <Text>You don't have permission to access group settings</Text>
          <Button mt="$4" onPress={() => router.back()}>
            Go Back
          </Button>
        </YStack>
      </KeyboardSafeArea>
    )
  }

  const handleSaveInfo = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name cannot be empty')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await (supabase.rpc as any)('update_group_info', {
        p_group_id: id,
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_is_private: isPrivate,
      })

      if (error) throw error

      const result = typeof data === 'string' ? JSON.parse(data) : data
      if (!result.success) {
        throw new Error(result.error || 'Failed to update group')
      }

      // Update local state
      store$.groups[id!].name.set(name.trim())
      store$.groups[id!].description.set(description.trim() || null)
      store$.groups[id!].is_private.set(isPrivate)

      Alert.alert('Success', 'Group info updated')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update group info')
    } finally {
      setSaving(false)
    }
  }

  const handlePickImage = async () => {
    if (!id) return

    // Pick and upload image using the hook
    const result = await pickAndUpload({
      pathPrefix: 'groups',
      identifier: id,
    })

    if (!result) return

    try {
      // Update group in Supabase
      await (supabase.from('groups') as any)
        .update({ avatar_url: result.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', id)

      store$.groups[id].avatar_url.set(result.publicUrl)
      Alert.alert('Success', 'Group image updated')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update group')
    }
  }

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode)
      Alert.alert('Copied!', 'Invite code copied to clipboard')
    } catch (err) {
      Alert.alert('Error', 'Failed to copy invite code')
    }
  }

  const handleRegenerateCode = async () => {
    Alert.alert(
      'Regenerate Code',
      'The current invite code will no longer work. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            setRegeneratingCode(true)
            try {
              const { data, error } = await (supabase.rpc as any)('regenerate_invite_code', {
                p_group_id: id,
              })

              if (error) throw error

              setInviteCode(data)
              store$.groups[id!].invite_code.set(data)
              Alert.alert('Success', `New invite code: ${data}`)
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to regenerate code')
            } finally {
              setRegeneratingCode(false)
            }
          },
        },
      ]
    )
  }

  const handleRemoveMember = async (member: any) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.profile?.display_name || 'this member'} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setProcessingMember(member.user_id)
            try {
              const { data, error } = await (supabase.rpc as any)('remove_group_member', {
                p_group_id: id,
                p_user_id: member.user_id,
              })

              if (error) throw error

              const result = typeof data === 'string' ? JSON.parse(data) : data
              if (!result.success) {
                throw new Error(result.error)
              }

              Alert.alert('Success', 'Member removed')
              // Refresh will happen via realtime sync
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove member')
            } finally {
              setProcessingMember(null)
              setSelectedMember(null)
            }
          },
        },
      ]
    )
  }

  const handleChangeRole = async (member: any, newRole: 'admin' | 'member') => {
    const action = newRole === 'admin' ? 'Promote to admin' : 'Demote to member'

    Alert.alert(
      action,
      `${action} for ${member.profile?.display_name || 'this member'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setProcessingMember(member.user_id)
            try {
              const { data, error } = await (supabase.rpc as any)('change_member_role', {
                p_group_id: id,
                p_user_id: member.user_id,
                p_new_role: newRole,
              })

              if (error) throw error

              const result = typeof data === 'string' ? JSON.parse(data) : data
              if (!result.success) {
                throw new Error(result.error)
              }

              Alert.alert('Success', `Role updated to ${newRole}`)
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to change role')
            } finally {
              setProcessingMember(null)
              setSelectedMember(null)
            }
          },
        },
      ]
    )
  }

  const handleCancelInvite = async (invite: PendingInvite) => {
    Alert.alert(
      'Cancel Invitation',
      `Cancel invitation for ${invite.invitee_name || invite.invitee_username || 'this user'}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setProcessingInvite(invite.invite_id)
            try {
              const { data, error } = await (supabase.rpc as any)('cancel_group_invite', {
                p_invite_id: invite.invite_id,
              })

              if (error) throw error

              const result = typeof data === 'string' ? JSON.parse(data) : data
              if (!result.success) {
                throw new Error(result.error)
              }

              setPendingInvites((prev) => prev.filter((i) => i.invite_id !== invite.invite_id))
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel invitation')
            } finally {
              setProcessingInvite(null)
            }
          },
        },
      ]
    )
  }

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeavingGroup(true)
            try {
              const { data, error } = await (supabase.rpc as any)('leave_group', {
                p_group_id: id,
              })

              if (error) throw error

              const result = typeof data === 'string' ? JSON.parse(data) : data
              if (!result.success) {
                throw new Error(result.error)
              }

              Alert.alert('Left Group', 'You have left the group', [
                { text: 'OK', onPress: () => router.replace('/(auth)/(tabs)/groups') },
              ])
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to leave group')
              setLeavingGroup(false)
            }
          },
        },
      ]
    )
  }

  const handleDeleteGroup = async () => {
    Alert.alert(
      'Delete Group',
      `This will permanently delete "${group.name}" and remove all members. This cannot be undone.\n\nType the group name to confirm:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Show a prompt to confirm by typing group name
            Alert.prompt(
              'Confirm Deletion',
              `Type "${group.name}" to confirm deletion:`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async (typedName?: string) => {
                    if (typedName !== group.name) {
                      Alert.alert('Error', 'Group name does not match')
                      return
                    }

                    setDeletingGroup(true)
                    try {
                      const { data, error } = await (supabase.rpc as any)('delete_group', {
                        p_group_id: id,
                      })

                      if (error) throw error

                      const result = typeof data === 'string' ? JSON.parse(data) : data
                      if (!result.success) {
                        throw new Error(result.error)
                      }

                      Alert.alert('Deleted', 'The group has been deleted', [
                        { text: 'OK', onPress: () => router.replace('/(auth)/(tabs)/groups') },
                      ])
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Failed to delete group')
                      setDeletingGroup(false)
                    }
                  },
                },
              ],
              'plain-text'
            )
          },
        },
      ]
    )
  }

  return (
    <KeyboardSafeArea edges={['top', 'bottom']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <Button
            size="$3"
            circular
            unstyled
            icon={<ArrowLeft />}
            onPress={() => router.back()}
          />
          <Text fontSize="$5" fontWeight="700">
            Group Settings
          </Text>
          <YStack width={32} />
        </XStack>

        <ScrollView flex={1}>
          <YStack p="$4" gap="$6">
            {/* Group Info Section */}
            <YStack gap="$3">
              <Text fontWeight="700" fontSize="$4" color="$gray11">
                GROUP INFO
              </Text>

              <Card bg="$gray2" p="$4" br="$4">
                <YStack gap="$4">
                  {/* Avatar */}
                  <XStack gap="$4" alignItems="center">
                    <YStack position="relative">
                      <Avatar circular size="$8" bg="$orange10">
                        {group.avatar_url ? (
                          <Avatar.Image src={group.avatar_url} />
                        ) : (
                          <Avatar.Fallback justifyContent="center" alignItems="center">
                            <Users size={32} color="white" />
                          </Avatar.Fallback>
                        )}
                      </Avatar>
                      <Button
                        position="absolute"
                        bottom={-4}
                        right={-4}
                        size="$3"
                        circular
                        bg="$orange10"
                        icon={
                          uploadingImage ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Camera size={16} color="white" />
                          )
                        }
                        onPress={handlePickImage}
                        disabled={uploadingImage}
                      />
                    </YStack>
                    <YStack flex={1}>
                      <Text fontWeight="600">Change group photo</Text>
                      <Text color="$gray10" fontSize="$3">
                        Tap the camera icon to upload
                      </Text>
                    </YStack>
                  </XStack>

                  <Separator />

                  {/* Name */}
                  <YStack gap="$2">
                    <Text fontWeight="600" fontSize="$3">
                      Name
                    </Text>
                    <Input
                      value={name}
                      onChangeText={setName}
                      placeholder="Group name"
                      size="$4"
                    />
                  </YStack>

                  {/* Description */}
                  <YStack gap="$2">
                    <Text fontWeight="600" fontSize="$3">
                      Description
                    </Text>
                    <TextArea
                      value={description}
                      onChangeText={setDescription}
                      placeholder="What's this group about?"
                      size="$4"
                      numberOfLines={3}
                    />
                  </YStack>

                  {/* Save Button */}
                  <Button
                    bg="$orange10"
                    onPress={handleSaveInfo}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text color="white" fontWeight="600">Save Changes</Text>
                    )}
                  </Button>
                </YStack>
              </Card>
            </YStack>

            {/* Privacy Section */}
            <YStack gap="$3">
              <Text fontWeight="700" fontSize="$4" color="$gray11">
                PRIVACY
              </Text>

              <Card bg="$gray2" p="$4" br="$4">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <Text fontWeight="600">Private Group</Text>
                    <Text color="$gray10" fontSize="$3">
                      Requires invite code to join
                    </Text>
                  </YStack>
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                    size="$4"
                    backgroundColor={isPrivate ? '$orange6' : '$gray5'}
                  >
                    <Switch.Thumb animation="quick" backgroundColor="white" />
                  </Switch>
                </XStack>
              </Card>
            </YStack>

            {/* Invite Code Section */}
            <YStack gap="$3">
              <Text fontWeight="700" fontSize="$4" color="$gray11">
                INVITE CODE
              </Text>

              <Card bg="$gray2" p="$4" br="$4">
                <YStack gap="$3">
                  <XStack
                    bg="white"
                    px="$4"
                    py="$3"
                    br="$4"
                    alignItems="center"
                    justifyContent="center"
                    position="relative"
                  >
                    <Text fontWeight="700" fontSize={28} letterSpacing={4} color="black">
                      {inviteCode}
                    </Text>
                    <Button
                      position="absolute"
                      right="$3"
                      size="$3"
                      circular
                      bg="$orange10"
                      icon={<Copy size={18} color="white" />}
                      onPress={handleCopyCode}
                    />
                  </XStack>

                  <Button
                    bg="$orange10"
                    icon={
                      regeneratingCode ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <RefreshCw size={18} color="white" />
                      )
                    }
                    onPress={handleRegenerateCode}
                    disabled={regeneratingCode}
                  >
                    <Text color="white" fontWeight="600">Regenerate Code</Text>
                  </Button>
                  <Text color="$gray10" fontSize="$3" textAlign="center">
                    Regenerating will invalidate the old code
                  </Text>
                </YStack>
              </Card>
            </YStack>

            {/* Members Section */}
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="700" fontSize="$4" color="$gray11">
                  MEMBERS ({members.length})
                </Text>
              </XStack>

              <Card bg="$gray2" p="$2" br="$4">
                {members.map((member: any, index: number) => {
                  const isCurrentUser = member.user_id === session?.user?.id
                  const isMemberAdmin = member.role === 'admin'
                  const isProcessing = processingMember === member.user_id

                  return (
                    <YStack key={member.user_id}>
                      {index > 0 && <Separator my="$2" />}
                      <XStack p="$2" gap="$3" alignItems="center">
                        <Avatar circular size="$4" bg="$orange10">
                          {member.profile?.avatar_url ? (
                            <Avatar.Image src={member.profile.avatar_url} />
                          ) : (
                            <Avatar.Fallback justifyContent="center" alignItems="center">
                              <Users size={18} color="white" />
                            </Avatar.Fallback>
                          )}
                        </Avatar>

                        <YStack flex={1}>
                          <XStack gap="$2" alignItems="center">
                            <Text fontWeight="600">
                              {member.profile?.display_name || 'User'}
                            </Text>
                            {isCurrentUser && (
                              <Text color="$orange10" fontSize="$3">(You)</Text>
                            )}
                          </XStack>
                          <XStack gap="$2" alignItems="center">
                            {isMemberAdmin ? (
                              <>
                                <Crown size={12} color="$yellow10" />
                                <Text color="$yellow10" fontSize="$3">Admin</Text>
                              </>
                            ) : (
                              <Text color="$gray10" fontSize="$3">Member</Text>
                            )}
                          </XStack>
                        </YStack>

                        {/* Action button - not for current user */}
                        {!isCurrentUser && (
                          <Button
                            size="$3"
                            circular
                            bg="$gray4"
                            icon={
                              isProcessing ? (
                                <ActivityIndicator size="small" />
                              ) : (
                                <MoreVertical size={18} />
                              )
                            }
                            onPress={() => setSelectedMember(member)}
                            disabled={isProcessing}
                          />
                        )}
                      </XStack>
                    </YStack>
                  )
                })}
              </Card>
            </YStack>

            {/* Pending Invites Section */}
            {pendingInvites.length > 0 && (
              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <Mail size={18} color="$orange10" />
                  <Text fontWeight="700" fontSize="$4" color="$gray11">
                    PENDING INVITES ({pendingInvites.length})
                  </Text>
                </XStack>

                <Card bg="$orange2" p="$2" br="$4" borderWidth={1} borderColor="$orange6">
                  {pendingInvites.map((invite, index) => (
                    <YStack key={invite.invite_id}>
                      {index > 0 && <Separator my="$2" />}
                      <XStack p="$2" gap="$3" alignItems="center">
                        <Avatar circular size="$4" bg="$orange10">
                          {invite.invitee_avatar_url ? (
                            <Avatar.Image src={invite.invitee_avatar_url} />
                          ) : (
                            <Avatar.Fallback justifyContent="center" alignItems="center">
                              <Users size={18} color="white" />
                            </Avatar.Fallback>
                          )}
                        </Avatar>

                        <YStack flex={1}>
                          <Text fontWeight="600">
                            {invite.invitee_name || invite.invitee_username || 'User'}
                          </Text>
                          <Text color="$gray10" fontSize="$3">
                            Invited by {invite.inviter_name || 'Admin'}
                          </Text>
                        </YStack>

                        <Button
                          size="$3"
                          circular
                          bg="$red10"
                          icon={
                            processingInvite === invite.invite_id ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <X size={16} color="white" />
                            )
                          }
                          onPress={() => handleCancelInvite(invite)}
                          disabled={processingInvite === invite.invite_id}
                        />
                      </XStack>
                    </YStack>
                  ))}
                </Card>
              </YStack>
            )}

            {/* Danger Zone */}
            <YStack gap="$3">
              <Text fontWeight="700" fontSize="$4" color="$red10">
                DANGER ZONE
              </Text>

              <Card bg="$red2" p="$4" br="$4" borderWidth={1} borderColor="$red6">
                <YStack gap="$3">
                  <Button
                    bg="$gray10"
                    icon={
                      leavingGroup ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <LogOut size={18} color="white" />
                      )
                    }
                    onPress={handleLeaveGroup}
                    disabled={leavingGroup || deletingGroup}
                  >
                    <Text color="white" fontWeight="600">Leave Group</Text>
                  </Button>

                  <Button
                    bg="$red10"
                    icon={
                      deletingGroup ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Trash2 size={18} color="white" />
                      )
                    }
                    onPress={handleDeleteGroup}
                    disabled={leavingGroup || deletingGroup}
                  >
                    <Text color="white" fontWeight="600">Delete Group</Text>
                  </Button>

                  <Text color="$red10" fontSize="$3" textAlign="center">
                    Deleting the group will remove all members and cannot be undone
                  </Text>
                </YStack>
              </Card>
            </YStack>
          </YStack>
        </ScrollView>

        {/* Member Action Sheet */}
        {selectedMember && (
          <YStack
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="$background"
            p="$4"
            gap="$3"
            borderTopWidth={1}
            borderTopColor="$gray4"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: -4 }}
            shadowOpacity={0.1}
            shadowRadius={12}
            elevation={10}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="700" fontSize="$5">
                {selectedMember.profile?.display_name || 'Member'}
              </Text>
              <Button
                size="$3"
                circular
                unstyled
                icon={<X size={24} />}
                onPress={() => setSelectedMember(null)}
              />
            </XStack>

            {selectedMember.role === 'member' ? (
              <Button
                bg="$orange10"
                icon={<ShieldCheck size={18} color="white" />}
                onPress={() => handleChangeRole(selectedMember, 'admin')}
              >
                <Text color="white" fontWeight="600">Promote to Admin</Text>
              </Button>
            ) : adminCount > 1 ? (
              <Button
                bg="$gray10"
                icon={<Shield size={18} color="white" />}
                onPress={() => handleChangeRole(selectedMember, 'member')}
              >
                <Text color="white" fontWeight="600">Demote to Member</Text>
              </Button>
            ) : null}

            <Button
              bg="$red10"
              icon={<UserMinus size={18} color="white" />}
              onPress={() => handleRemoveMember(selectedMember)}
            >
              <Text color="white" fontWeight="600">Remove from Group</Text>
            </Button>

            <Button
              bg="$gray4"
              onPress={() => setSelectedMember(null)}
            >
              <Text fontWeight="600">Cancel</Text>
            </Button>
          </YStack>
        )}
      </YStack>
    </KeyboardSafeArea>
  )
}

export default observer(GroupSettingsScreen)
