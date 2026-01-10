import { useState, useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  ScrollView,
  Avatar,
  Tabs as TamaguiTabs,
  View,
} from 'tamagui'
import {
  Users,
  Trophy,
  Share2,
  Settings,
  Copy,
  Crown,
  Medal,
  TrendingUp,
  UserPlus,
  Camera,
  Clock as ClockIcon,
  Zap,
  LogOut,
  Target,
  Tag,
  BarChart3,
} from '@tamagui/lucide-icons'
import {
  SafeArea,
  HeaderBackButton,
  LeaderboardSkeleton,
  TagListSkeleton,
  MembersListSkeleton,
  SkeletonCircle,
  SkeletonText,
} from '@/components/ui'
import { GroupExerciseStats, GoalCard } from '@/components/group'
import { Alert, Share, ActivityIndicator } from 'react-native'
import * as Clipboard from 'expo-clipboard'

import { store$, auth$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import { useFocusRefresh } from '@/lib/sync-service'

/**
 * Group detail screen
 *
 * Shows group info, members, leaderboard, and activity feed
 */
function GroupDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const session = auth$.session.get()
  const groups = store$.groups.get()

  const group = groups && id ? (groups as any)[id] : null

  // Tags for this group
  const [groupTags, setGroupTags] = useState<any[]>([])
  const [loadingTags, setLoadingTags] = useState(false)

  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [timeFilter, setTimeFilter] = useState<'all_time' | 'week' | 'month'>('all_time')
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false)

  // Leave group state
  const [leavingGroup, setLeavingGroup] = useState(false)

  // Stats tab state
  const [statsTimeFilter, setStatsTimeFilter] = useState<'week' | 'month' | 'all_time'>('week')
  const [activeGoals, setActiveGoals] = useState<any[]>([])
  const [loadingGoals, setLoadingGoals] = useState(false)

  // Auto-refresh groups data on focus + polling every 30s
  useFocusRefresh({ groups: true }, 30000)

  // Fetch leaderboard data - stale-while-revalidate pattern
  useEffect(() => {
    if (!id) return

    const fetchLeaderboard = async () => {
      // Only show loading skeleton if we have NO data (first load)
      // Otherwise, keep showing stale data while we fetch fresh data
      const isFirstLoad = leaderboardData.length === 0
      if (isFirstLoad) {
        setLoadingLeaderboard(true)
      }

      try {
        const { data, error } = await supabase.rpc('get_group_leaderboard', {
          p_group_id: id,
          p_time_filter: timeFilter,
        })

        if (error) {
          console.error('Error fetching leaderboard:', error)
        } else {
          setLeaderboardData(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        if (isFirstLoad) {
          setLoadingLeaderboard(false)
        }
      }
    }

    fetchLeaderboard()
  }, [id, timeFilter])

  // Fetch tags for this group - stale-while-revalidate pattern
  useEffect(() => {
    if (!id) return

    const fetchGroupTags = async () => {
      // Only show loading skeleton if we have NO data (first load)
      const isFirstLoad = groupTags.length === 0
      if (isFirstLoad) {
        setLoadingTags(true)
      }

      try {
        // Fetch tags that were explicitly created for this group
        const { data, error } = await (supabase
          .from('tags') as any)
          .select(`
            id,
            value,
            is_public,
            expires_at,
            created_at,
            sender_id,
            sender:profiles!tags_sender_id_fkey (
              id,
              display_name,
              first_name,
              avatar_url
            ),
            exercise:exercises (
              id,
              name,
              icon,
              type,
              unit
            ),
            recipients:tag_recipients!tag_recipients_tag_id_fkey (
              id,
              recipient_id,
              status,
              completed_value
            )
          `)
          .eq('group_id', id) // Only tags explicitly created for this group
          .eq('deleted', false)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) {
          console.error('[GroupDetail] Error fetching tags:', error)
        } else {
          setGroupTags(data || [])
        }
      } catch (err) {
        console.error('[GroupDetail] Error:', err)
      } finally {
        if (isFirstLoad) {
          setLoadingTags(false)
        }
      }
    }

    fetchGroupTags()
  }, [id])

  // Fetch active goals for this group
  useEffect(() => {
    if (!id) return

    const fetchGoals = async () => {
      const isFirstLoad = activeGoals.length === 0
      if (isFirstLoad) {
        setLoadingGoals(true)
      }

      try {
        const { data, error } = await (supabase
          .from('group_goals') as any)
          .select(`
            *,
            exercise:exercises (
              id,
              name,
              icon
            )
          `)
          .eq('group_id', id)
          .eq('status', 'active')
          .order('ends_at', { ascending: true })

        if (error) {
          console.error('Error fetching goals:', error)
        } else {
          setActiveGoals(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        if (isFirstLoad) {
          setLoadingGoals(false)
        }
      }
    }

    fetchGoals()
  }, [id])

  const handleCopyInviteCode = async () => {
    if (!group?.invite_code) return

    try {
      await Clipboard.setStringAsync(group.invite_code)
      Alert.alert('Copied!', 'Invite code copied to clipboard')
    } catch (err) {
      console.error(err)
      Alert.alert('Error', 'Failed to copy invite code')
    }
  }

  const handleShareGroup = async () => {
    if (!group) return

    try {
      const inviteLink = `https://fyt.it.com/group/join?code=${group.invite_code}`
      const message = `🏋️ Join "${group.name}" on fyt!\n\n${inviteLink}\n\nOr use invite code: ${group.invite_code}\n\nLet's compete and get fit together! 💪`

      await Share.share({
        message,
        title: `Join ${group.name}`,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateGroupTag = () => {
    router.push({
      pathname: '/(auth)/tag/create',
      params: { groupId: id },
    })
  }

  const handlePickGroupImage = async () => {
    if (!group || !id) return

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to upload a group image')
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

      setUploadingImage(true)

      const image = result.assets[0]
      const fileExt = image.uri.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${id}-${Date.now()}.${fileExt}`
      const filePath = `groups/${fileName}`

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

      // Update group in Supabase
      const { error: updateError } = await (supabase
        .from('groups') as any)
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Update local state
      store$.groups[id].avatar_url.set(avatarUrl)

      Alert.alert('Success', 'Group image updated!')
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to upload group image'
      Alert.alert('Error', errorMessage)
      console.error('Group image upload error:', err)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group?.name}"?`,
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

  // Check if still loading vs group not found
  const isInitialLoading = groups === undefined || groups === null

  if (!group) {
    if (isInitialLoading) {
      // Show skeleton while loading
      return (
        <SafeArea edges={['top']}>
          <YStack flex={1} bg="$background">
            {/* Header skeleton */}
            <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
              <SkeletonCircle size={32} />
              <SkeletonText width={120} height={20} />
              <SkeletonCircle size={32} />
            </XStack>

            {/* Group header skeleton */}
            <YStack alignItems="center" p="$4" gap="$3">
              <SkeletonCircle size={96} />
              <SkeletonText width={180} height={24} />
              <SkeletonText width={250} height={14} />
              <XStack gap="$4" mt="$2">
                <SkeletonText width={80} height={14} />
                <SkeletonText width={60} height={14} />
              </XStack>
            </YStack>

            {/* Tabs skeleton */}
            <YStack p="$4" gap="$3">
              <XStack gap="$2">
                <SkeletonText width={80} height={36} />
                <SkeletonText width={80} height={36} />
                <SkeletonText width={80} height={36} />
              </XStack>
              <LeaderboardSkeleton count={4} />
            </YStack>
          </YStack>
        </SafeArea>
      )
    }

    // Group actually not found
    return (
      <SafeArea>
        <YStack flex={1} justifyContent="center" alignItems="center" p="$4">
          <Text>Group not found</Text>
          <Button mt="$4" onPress={() => router.back()}>
            Go Back
          </Button>
        </YStack>
      </SafeArea>
    )
  }

  const members = group.members || []
  const isAdmin = members.some(
    (m: any) => m.user_id === session?.user?.id && m.role === 'admin'
  )

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <HeaderBackButton />
          <XStack gap="$2">
            <Button
              size="$3"
              circular
              unstyled
              icon={<Share2 />}
              onPress={handleShareGroup}
            />
            {!isAdmin && (
              <Button
                size="$3"
                circular
                unstyled
                icon={leavingGroup ? <ActivityIndicator size="small" /> : <LogOut />}
                onPress={handleLeaveGroup}
                disabled={leavingGroup}
              />
            )}
            {isAdmin && (
              <Button
                size="$3"
                circular
                unstyled
                icon={<Settings />}
                onPress={() => router.push(`/(auth)/group/${id}/settings` as any)}
              />
            )}
          </XStack>
        </XStack>

        <ScrollView flex={1}>
          <YStack p="$4" gap="$4">
            {/* Group Header - Athletic Broadcast Style */}
            <XStack gap="$4" alignItems="center">
              {/* Avatar */}
              <YStack position="relative">
                <Avatar circular size="$9" bg="$coral9">
                  {group.avatar_url ? (
                    <Avatar.Image src={group.avatar_url} />
                  ) : (
                    <Avatar.Fallback justifyContent="center" alignItems="center">
                      <Users size={40} color="white" />
                    </Avatar.Fallback>
                  )}
                </Avatar>
                {isAdmin && (
                  uploadingImage ? (
                    <YStack
                      position="absolute"
                      bottom={0}
                      right={0}
                      bg="$coral9"
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
                      bg="$coral9"
                      icon={<Camera size={16} color="white" />}
                      onPress={handlePickGroupImage}
                    />
                  )
                )}
              </YStack>

              {/* Stats Row - Scoreboard Style */}
              <XStack flex={1} justifyContent="space-around">
                <YStack alignItems="center">
                  <Text fontFamily="$mono" fontWeight="700" fontSize={32} lineHeight={40}>
                    {group.member_count || 0}
                  </Text>
                  <Text color="$gray10" fontSize="$2" fontFamily="$body" textTransform="uppercase" letterSpacing={0.5}>
                    Members
                  </Text>
                </YStack>

                <YStack alignItems="center">
                  <Text fontFamily="$mono" fontWeight="700" fontSize={32} lineHeight={40}>
                    {groupTags.length}
                  </Text>
                  <Text color="$gray10" fontSize="$2" fontFamily="$body" textTransform="uppercase" letterSpacing={0.5}>
                    Tags
                  </Text>
                </YStack>
              </XStack>
            </XStack>

            {/* Name and Description */}
            <YStack gap="$1">
              <Text fontFamily="$display" fontSize={28} letterSpacing={0.5}>
                {group.name.toUpperCase()}
              </Text>
              {group.description && (
                <Text color="$gray10" fontSize="$3" fontFamily="$body">
                  {group.description}
                </Text>
              )}
            </YStack>

            {/* Action Buttons */}
            <XStack gap="$3">
              <Button
                flex={1}
                size="$5"
                bg="$coral6"
                br="$3"
                icon={<UserPlus size={20} color="white" />}
                onPress={() => router.push(`/(auth)/group/${id}/invite` as any)}
                animation="bouncy"
                pressStyle={{ scale: 0.97 }}
              >
                <Text color="white" fontFamily="$body" fontWeight="700">Invite</Text>
              </Button>
              <Button
                flex={1}
                size="$5"
                bg="$coral6"
                br="$3"
                icon={<Zap size={20} color="white" />}
                onPress={handleCreateGroupTag}
                animation="bouncy"
                pressStyle={{ scale: 0.97 }}
              >
                <Text color="white" fontFamily="$body" fontWeight="700">Tag</Text>
              </Button>
            </XStack>

            {/* Tabs - with text labels for accessibility */}
            <TamaguiTabs
              defaultValue="tags"
              orientation="horizontal"
              flexDirection="column"
            >
              <TamaguiTabs.List gap="$2">
                <TamaguiTabs.Tab value="tags" flex={1} accessibilityLabel="Tags tab">
                  <YStack alignItems="center" gap="$1">
                    <Tag size={18} />
                    <Text fontSize="$2" fontWeight="500">Tags</Text>
                  </YStack>
                </TamaguiTabs.Tab>
                <TamaguiTabs.Tab value="stats" flex={1} accessibilityLabel="Stats tab">
                  <YStack alignItems="center" gap="$1">
                    <BarChart3 size={18} />
                    <Text fontSize="$2" fontWeight="500">Stats</Text>
                  </YStack>
                </TamaguiTabs.Tab>
                <TamaguiTabs.Tab value="members" flex={1} accessibilityLabel="Members tab">
                  <YStack alignItems="center" gap="$1">
                    <Users size={18} />
                    <Text fontSize="$2" fontWeight="500">Members</Text>
                  </YStack>
                </TamaguiTabs.Tab>
                <TamaguiTabs.Tab value="leaderboard" flex={1} accessibilityLabel="Leaderboard tab">
                  <YStack alignItems="center" gap="$1">
                    <Trophy size={18} />
                    <Text fontSize="$2" fontWeight="500">Ranks</Text>
                  </YStack>
                </TamaguiTabs.Tab>
              </TamaguiTabs.List>

              {/* Tags Tab */}
              <TamaguiTabs.Content value="tags" pt="$4">
                <YStack gap="$2">
                  {loadingTags ? (
                    <TagListSkeleton count={3} />
                  ) : groupTags.length === 0 ? (
                    <Card bg="$gray2" p="$6" br="$4" alignItems="center">
                      <Zap size={48} color="$gray8" />
                      <Text fontFamily="$display" fontSize={20} letterSpacing={0.5} mt="$3">
                        NO GROUP TAGS YET
                      </Text>
                      <Text color="$gray10" textAlign="center" mt="$2" fontFamily="$body" fontSize="$3">
                        Be the first to challenge your group
                      </Text>
                      <Button
                        mt="$4"
                        size="$4"
                        bg="$coral6"
                        br="$3"
                        icon={<Zap size={20} color="white" />}
                        onPress={handleCreateGroupTag}
                        animation="bouncy"
                        pressStyle={{ scale: 0.97 }}
                      >
                        <Text color="white" fontFamily="$body" fontWeight="700">Create First Tag</Text>
                      </Button>
                    </Card>
                  ) : (
                    groupTags.map((tag: any) => {
                      const isExpired = new Date(tag.expires_at) < new Date()
                      const completedCount = tag.recipients?.filter((r: any) => r.status === 'completed').length || 0
                      const totalRecipients = tag.recipients?.length || 0

                      return (
                        <Card
                          key={tag.id}
                          bg="$backgroundHover"
                          p="$4"
                          br="$4"
                          pressStyle={{ scale: 0.98 }}
                          animation="quick"
                          onPress={() => router.push(`/(auth)/tag/${tag.id}` as any)}
                          opacity={isExpired ? 0.6 : 1}
                        >
                          <YStack gap="$2">
                            <XStack justifyContent="space-between" alignItems="flex-start">
                              <YStack flex={1}>
                                <Text fontWeight="600" fontSize="$5" numberOfLines={1}>
                                  {tag.exercise?.name || 'Exercise'}
                                </Text>
                                <Text color="$gray10" fontSize="$3">
                                  {tag.value} {tag.exercise?.unit || 'reps'} • from {tag.sender?.display_name || tag.sender?.first_name || 'Someone'}
                                </Text>
                              </YStack>
                              <Zap size={20} color={isExpired ? '$gray10' : '$green10'} />
                            </XStack>

                            <XStack justifyContent="space-between" alignItems="center">
                              <XStack gap="$1" alignItems="center">
                                <ClockIcon size={14} color="$gray10" />
                                <Text color="$gray10" fontSize="$3">
                                  {isExpired ? 'Finished' : (() => {
                                    const hoursLeft = Math.ceil(
                                      (new Date(tag.expires_at).getTime() - new Date().getTime()) /
                                        (1000 * 60 * 60)
                                    )
                                    if (hoursLeft <= 0) return 'Ending soon'
                                    if (hoursLeft < 24) return `${hoursLeft}h left`
                                    return `${Math.ceil(hoursLeft / 24)}d left`
                                  })()}
                                </Text>
                              </XStack>
                              <Text color="$gray10" fontSize="$3">
                                {completedCount}/{totalRecipients} completed
                              </Text>
                            </XStack>
                          </YStack>
                        </Card>
                      )
                    })
                  )}
                </YStack>
              </TamaguiTabs.Content>

              {/* Stats Tab */}
              <TamaguiTabs.Content value="stats" pt="$4">
                <YStack gap="$6">
                  {/* Active Goals Section */}
                  {activeGoals.length > 0 && (
                    <YStack gap="$3">
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontWeight="700" fontSize="$5">Active Goals</Text>
                        {isAdmin && (
                          <Button
                            size="$3"
                            bg="$coral6"
                            br="$2"
                            onPress={() => router.push(`/(auth)/group/${id}/goals` as any)}
                          >
                            <Text color="white" fontFamily="$body" fontWeight="600" fontSize="$2">Manage</Text>
                          </Button>
                        )}
                      </XStack>
                      {activeGoals.map((goal: any) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onPress={() => router.push(`/(auth)/group/${id}/goal/${goal.id}` as any)}
                        />
                      ))}
                    </YStack>
                  )}

                  {/* No Goals - Admin CTA */}
                  {activeGoals.length === 0 && isAdmin && (
                    <Card bg="$coral2" p="$5" br="$4" alignItems="center" borderWidth={1} borderColor="$coral5">
                      <View bg="$coral4" p="$3" br="$3">
                        <Target size={32} color="$coral11" />
                      </View>
                      <Text fontFamily="$display" fontSize={22} letterSpacing={0.5} mt="$3" textAlign="center">
                        SET A GROUP GOAL
                      </Text>
                      <Text color="$coral11" textAlign="center" mt="$2" mb="$4" fontFamily="$body" fontSize="$3">
                        Rally your group around a shared target!
                      </Text>
                      <Button
                        size="$4"
                        bg="$coral6"
                        br="$3"
                        onPress={() => router.push(`/(auth)/group/${id}/goals` as any)}
                        animation="bouncy"
                        pressStyle={{ scale: 0.97 }}
                      >
                        <Text color="white" fontFamily="$body" fontWeight="700">Create Goal</Text>
                      </Button>
                    </Card>
                  )}

                  {/* Exercise Stats Section */}
                  <YStack gap="$3">
                    <Text fontWeight="700" fontSize="$5">Group Totals</Text>
                    <GroupExerciseStats
                      groupId={id!}
                      timeFilter={statsTimeFilter}
                      onTimeFilterChange={setStatsTimeFilter}
                    />
                  </YStack>
                </YStack>
              </TamaguiTabs.Content>

              {/* Members Tab */}
              <TamaguiTabs.Content value="members" pt="$4">
                <YStack gap="$2">
                  {members.length === 0 ? (
                    <Card bg="$backgroundHover" p="$4" br="$4" alignItems="center">
                      <Users size={32} color="$gray10" />
                      <Text color="$gray10" mt="$2">
                        No members yet
                      </Text>
                    </Card>
                  ) : (
                    members.map((member: any) => (
                      <Card
                        key={member.user_id}
                        bg="$gray2"
                        p="$3"
                        br="$3"
                        borderWidth={1}
                        borderColor="$gray4"
                      >
                        <XStack gap="$3" alignItems="center">
                          <Avatar circular size="$4" bg="$coral6">
                            <Avatar.Fallback justifyContent="center" alignItems="center">
                              <Users size={20} color="white" />
                            </Avatar.Fallback>
                          </Avatar>
                          <YStack flex={1}>
                            <Text fontFamily="$body" fontWeight="600">
                              {member.profile?.display_name || 'User'}
                            </Text>
                            <Text color="$gray10" fontSize="$2" fontFamily="$body">
                              {member.joined_at
                                ? `Joined ${new Date(member.joined_at).toLocaleDateString()}`
                                : 'Member'}
                            </Text>
                          </YStack>
                          {member.role === 'admin' && (
                            <Crown size={20} color="$amber10" />
                          )}
                        </XStack>
                      </Card>
                    ))
                  )}
                </YStack>
              </TamaguiTabs.Content>

              {/* Leaderboard Tab */}
              <TamaguiTabs.Content value="leaderboard" pt="$4">
                <YStack gap="$4">
                  {/* Time Filter Buttons - Athletic Style */}
                  <XStack gap="$2" justifyContent="center">
                    <Button
                      size="$3"
                      br="$2"
                      bg={timeFilter === 'week' ? '$coral6' : '$gray3'}
                      onPress={() => setTimeFilter('week')}
                      flex={1}
                    >
                      <Text fontFamily="$body" fontWeight="600" fontSize="$2" color={timeFilter === 'week' ? 'white' : '$gray11'}>
                        Week
                      </Text>
                    </Button>
                    <Button
                      size="$3"
                      br="$2"
                      bg={timeFilter === 'month' ? '$coral6' : '$gray3'}
                      onPress={() => setTimeFilter('month')}
                      flex={1}
                    >
                      <Text fontFamily="$body" fontWeight="600" fontSize="$2" color={timeFilter === 'month' ? 'white' : '$gray11'}>
                        Month
                      </Text>
                    </Button>
                    <Button
                      size="$3"
                      br="$2"
                      bg={timeFilter === 'all_time' ? '$coral6' : '$gray3'}
                      onPress={() => setTimeFilter('all_time')}
                      flex={1}
                    >
                      <Text fontFamily="$body" fontWeight="600" fontSize="$2" color={timeFilter === 'all_time' ? 'white' : '$gray11'}>
                        All-time
                      </Text>
                    </Button>
                  </XStack>

                  {/* Leaderboard List */}
                  {loadingLeaderboard ? (
                    <LeaderboardSkeleton count={5} />
                  ) : leaderboardData.length === 0 ? (
                    <Card bg="$backgroundHover" p="$6" br="$4" alignItems="center">
                      <Trophy size={48} color="$gray10" />
                      <Text color="$gray10" textAlign="center" mt="$3">
                        No activity yet for this period
                      </Text>
                      <Text color="$gray10" textAlign="center" mt="$2" fontSize="$3">
                        Complete group tags to appear on the leaderboard!
                      </Text>
                    </Card>
                  ) : (
                    <YStack gap="$2">
                      {/* Top 3 Podium */}
                      {leaderboardData.length >= 3 && (
                        <Card bg="$backgroundHover" p="$4" br="$4" mb="$2">
                          <XStack justifyContent="space-around" alignItems="flex-end">
                            {/* 2nd Place */}
                            {leaderboardData[1] && (
                              <YStack alignItems="center" gap="$2" flex={1}>
                                <Medal size={24} color="$gray9" />
                                <Avatar circular size="$5">
                                  <Avatar.Fallback bg="$gray8" justifyContent="center" alignItems="center">
                                    <Users size={22} color="white" />
                                  </Avatar.Fallback>
                                </Avatar>
                                <Text fontSize="$2" fontFamily="$body" fontWeight="600" numberOfLines={1}>
                                  {leaderboardData[1].display_name || 'User'}
                                </Text>
                                <Text fontFamily="$mono" fontSize={24} fontWeight="700" color="$gray10" lineHeight={30}>
                                  {leaderboardData[1].group_challenge_points}
                                </Text>
                                <Text fontSize="$1" fontFamily="$body" color="$gray10" textTransform="uppercase" letterSpacing={0.5}>
                                  pts
                                </Text>
                              </YStack>
                            )}

                            {/* 1st Place */}
                            {leaderboardData[0] && (
                              <YStack alignItems="center" gap="$2" flex={1} mt="-$4">
                                <Crown size={32} color="$amber10" />
                                <Avatar circular size="$6">
                                  <Avatar.Fallback bg="$amber9" justifyContent="center" alignItems="center">
                                    <Users size={26} color="white" />
                                  </Avatar.Fallback>
                                </Avatar>
                                <Text fontSize="$3" fontFamily="$body" fontWeight="700" numberOfLines={1}>
                                  {leaderboardData[0].display_name || 'User'}
                                </Text>
                                <Text fontFamily="$mono" fontSize={32} fontWeight="700" color="$amber10" lineHeight={40}>
                                  {leaderboardData[0].group_challenge_points}
                                </Text>
                                <Text fontSize="$1" fontFamily="$body" color="$gray10" textTransform="uppercase" letterSpacing={0.5}>
                                  pts
                                </Text>
                              </YStack>
                            )}

                            {/* 3rd Place */}
                            {leaderboardData[2] && (
                              <YStack alignItems="center" gap="$2" flex={1}>
                                <Medal size={20} color="$coral9" />
                                <Avatar circular size="$4">
                                  <Avatar.Fallback bg="$coral8" justifyContent="center" alignItems="center">
                                    <Users size={18} color="white" />
                                  </Avatar.Fallback>
                                </Avatar>
                                <Text fontSize="$3" fontFamily="$body" fontWeight="600" numberOfLines={1}>
                                  {leaderboardData[2].display_name || 'User'}
                                </Text>
                                <Text fontFamily="$mono" fontSize={20} fontWeight="700" color="$coral10" lineHeight={26}>
                                  {leaderboardData[2].group_challenge_points}
                                </Text>
                                <Text fontSize="$1" fontFamily="$body" color="$gray10" textTransform="uppercase" letterSpacing={0.5}>
                                  pts
                                </Text>
                              </YStack>
                            )}
                          </XStack>
                        </Card>
                      )}

                      {/* Full Leaderboard List */}
                      {leaderboardData.map((member: any, index: number) => {
                        const isCurrentUser = member.user_id === session?.user?.id
                        return (
                        <Card
                          key={member.user_id}
                          bg={isCurrentUser ? '$coral2' : '$gray2'}
                          p="$3"
                          br="$3"
                          borderWidth={isCurrentUser ? 2 : 1}
                          borderColor={isCurrentUser ? '$coral7' : '$gray4'}
                          position="relative"
                          overflow="hidden"
                        >
                          {/* Highlight bar for top 3 */}
                          {index < 3 && (
                            <View
                              position="absolute"
                              left={0}
                              top={0}
                              bottom={0}
                              width={3}
                              bg={index === 0 ? '$amber10' : index === 1 ? '$gray8' : '$coral9'}
                            />
                          )}
                          <XStack gap="$3" alignItems="center">
                            {/* Rank */}
                            <View
                              width={36}
                              height={36}
                              alignItems="center"
                              justifyContent="center"
                              bg={index === 0 ? '$amber4' : index === 1 ? '$gray4' : index === 2 ? '$coral3' : '$gray3'}
                              br="$2"
                            >
                              {index === 0 ? (
                                <Crown size={20} color="$amber11" />
                              ) : index < 3 ? (
                                <Medal size={20} color={index === 1 ? '$gray10' : '$coral10'} />
                              ) : (
                                <Text fontFamily="$mono" fontWeight="700" fontSize="$4" color="$gray10">
                                  {member.rank}
                                </Text>
                              )}
                            </View>

                            {/* Avatar */}
                            <Avatar circular size="$4">
                              <Avatar.Fallback bg="$coral6" justifyContent="center" alignItems="center">
                                <Users size={18} color="white" />
                              </Avatar.Fallback>
                            </Avatar>

                            {/* Name and Stats */}
                            <YStack flex={1}>
                              <XStack alignItems="center" gap="$2">
                                <Text fontFamily="$body" fontWeight="600" fontSize="$4" numberOfLines={1}>
                                  {member.display_name || 'User'}
                                </Text>
                                {member.role === 'admin' && (
                                  <Crown size={14} color="$amber10" />
                                )}
                                {isCurrentUser && (
                                  <View bg="$coral5" px="$1.5" py="$0.5" br="$1">
                                    <Text color="$coral12" fontSize="$1" fontWeight="700">
                                      YOU
                                    </Text>
                                  </View>
                                )}
                              </XStack>
                              <XStack gap="$3" mt="$1">
                                <XStack gap="$1" alignItems="center">
                                  <Trophy size={12} color="$gray10" />
                                  <Text fontSize="$2" fontFamily="$body" color="$gray10">
                                    {member.group_challenge_completions} done
                                  </Text>
                                </XStack>
                              </XStack>
                            </YStack>

                            {/* Points - Scoreboard Style */}
                            <YStack alignItems="flex-end">
                              <Text fontFamily="$mono" fontWeight="700" fontSize={28} color={index < 3 ? (index === 0 ? '$amber10' : index === 1 ? '$gray10' : '$coral10') : '$color'} lineHeight={36}>
                                {member.group_challenge_points}
                              </Text>
                              <Text fontSize="$1" fontFamily="$body" color="$gray10" textTransform="uppercase" letterSpacing={0.5}>
                                pts
                              </Text>
                            </YStack>
                          </XStack>
                        </Card>
                      )})}
                    </YStack>
                  )}
                </YStack>
              </TamaguiTabs.Content>

              {/* Activity Tab */}
              <TamaguiTabs.Content value="activity" pt="$4">
                <Card bg="$backgroundHover" p="$6" br="$4" alignItems="center">
                  <Trophy size={48} color="$gray10" />
                  <Text color="$gray10" textAlign="center" mt="$3">
                    Activity feed coming soon!
                  </Text>
                </Card>
              </TamaguiTabs.Content>
            </TamaguiTabs>
          </YStack>
        </ScrollView>
      </YStack>
    </SafeArea>
  )
}

export default observer(GroupDetailScreen)
