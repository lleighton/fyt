import { useState, useCallback } from 'react'
import { RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  H1,
  Card,
  ScrollView,
} from 'tamagui'
import { Flame, UserPlus, Send, Clock, ChevronRight, Zap } from '@tamagui/lucide-icons'
import { SafeArea } from '@/components/ui'

import { store$, auth$, profile$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import { ActivityGrid } from '@/components/activity/ActivityGrid'
import { useRefresh } from '@/lib/sync-service'

/**
 * Home screen / Dashboard
 *
 * Shows:
 * - Current streak
 * - Activity grid (GitHub-style)
 * - Tag Someone CTA
 * - Groups section
 */
function HomeScreen() {
  const router = useRouter()
  const session = auth$.session.get()
  const profile = store$.profile.get()
  const completions = store$.completions.get()

  // Pull-to-refresh
  const { isRefreshing, onRefresh } = useRefresh()

  // Fallback: Load data directly if sync fails
  const [directCompletions, setDirectCompletions] = useState<any[]>([])
  const [pendingTags, setPendingTags] = useState<any[]>([])
  const [tagStreak, setTagStreak] = useState(0)

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadDirectData = async () => {
        if (!session?.user) return

        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('[HomeScreen] Profile error:', profileError)
        } else if (profileData) {
          // Update profile$ observable directly
          ;(profile$ as any)[profileData.id].set(profileData)
          // Get tag streak from profile
          setTagStreak(profileData.tag_streak_public || 0)
        }

        // Load completions for activity grid (now includes all activity: tags, challenges, workouts)
        const { data: completionsData } = await supabase
          .from('completions')
          .select('id, completed_at')
          .eq('user_id', session.user.id)
          .eq('deleted', false)

        setDirectCompletions(completionsData || [])

        // Load pending tags (tags sent to this user that are still pending)
        const { data: pendingTagsData } = await (supabase
          .from('tag_recipients') as any)
          .select(`
            id,
            status,
            tag:tags (
              id,
              value,
              expires_at,
              sender:profiles!tags_sender_id_fkey (
                id,
                display_name,
                avatar_url
              ),
              exercise:exercises (
                id,
                name,
                icon,
                type,
                unit
              )
            )
          `)
          .eq('recipient_id', session.user.id)
          .eq('status', 'pending')
          .gt('tag.expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(5)

        setPendingTags(pendingTagsData || [])
      }

      loadDirectData()
    }, [session])
  )

  // Compute activity grid from completions
  const completionsArray = completions ? Object.values(completions) : directCompletions

  const activityGrid = computeActivityGrid(completionsArray)

  // Compute current streak
  const currentStreak = computeStreak(activityGrid)

  return (
    <SafeArea edges={['top']}>
      <ScrollView
        flex={1}
        bg="$background"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <YStack px="$4" py="$4" gap="$4">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack>
              <Text color="$gray10" fontSize="$3">
                Welcome back
              </Text>
              <H1 fontSize="$8">
                {profile?.display_name || 'Athlete'}
              </H1>
            </YStack>
          </XStack>

          {/* Streak Cards */}
          <XStack gap="$3">
            {/* Activity Streak */}
            <Card
              flex={1}
              bg="$gray4"
              p="$4"
              br="$6"
              borderWidth={0}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={8}
              elevation={2}
            >
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    color="$gray11"
                    fontSize="$2"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    Activity
                  </Text>
                  <Flame color="$orange10" size={24} />
                </XStack>
                <XStack alignItems="baseline" gap="$2">
                  <Text fontSize={48} fontWeight="700" color="$gray12">
                    {currentStreak}
                  </Text>
                  <Text fontSize="$5" fontWeight="600" color="$gray11">
                    {currentStreak === 1 ? 'day' : 'days'}
                  </Text>
                </XStack>
                <XStack
                  bg="$orange9"
                  px="$2.5"
                  py="$1.5"
                  br="$10"
                  alignSelf="flex-start"
                >
                  <Text
                    color="white"
                    fontSize="$2"
                    fontWeight="700"
                    textTransform="uppercase"
                  >
                    {currentStreak >= 7 ? 'On Fire' : 'Keep Going'}
                  </Text>
                </XStack>
              </YStack>
            </Card>

            {/* Tag Streak */}
            <Card
              flex={1}
              bg="$green3"
              p="$4"
              br="$6"
              borderWidth={0}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={8}
              elevation={2}
            >
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    color="$green11"
                    fontSize="$2"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    Tag Streak
                  </Text>
                  <Zap color="$green10" size={24} />
                </XStack>
                <XStack alignItems="baseline" gap="$2">
                  <Text fontSize={48} fontWeight="700" color="$green12">
                    {tagStreak}
                  </Text>
                  <Text fontSize="$5" fontWeight="600" color="$green11">
                    {tagStreak === 1 ? 'day' : 'days'}
                  </Text>
                </XStack>
                <XStack
                  bg={tagStreak >= 7 ? '$green10' : '$green9'}
                  px="$2.5"
                  py="$1.5"
                  br="$10"
                  alignSelf="flex-start"
                >
                  <Text
                    color="white"
                    fontSize="$2"
                    fontWeight="700"
                    textTransform="uppercase"
                  >
                    {tagStreak >= 7 ? 'Legend' : tagStreak > 0 ? 'Active' : 'Start Tagging'}
                  </Text>
                </XStack>
              </YStack>
            </Card>
          </XStack>

          {/* Activity Grid */}
          <Card
            bg="$gray2"
            p="$5"
            br="$6"
            borderWidth={0}
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={8}
            elevation={2}
          >
            <YStack gap="$4">
              <Text
                color="$gray11"
                fontSize="$2"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing={0.5}
              >
                Activity
              </Text>
              <ActivityGrid activityData={activityGrid} />
            </YStack>
          </Card>

          {/* Pending Tags Section */}
          {pendingTags.length > 0 && (
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$2" alignItems="center">
                  <Clock size={18} color="$orange10" />
                  <Text
                    color="$gray11"
                    fontSize="$3"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    You've Been Tagged!
                  </Text>
                </XStack>
                <XStack
                  bg="$orange10"
                  px="$2"
                  py="$1"
                  br="$10"
                >
                  <Text color="white" fontSize="$2" fontWeight="700">
                    {pendingTags.length}
                  </Text>
                </XStack>
              </XStack>

              {pendingTags.map((tagRecipient: any) => {
                const tag = tagRecipient.tag
                if (!tag) return null

                const expiresAt = new Date(tag.expires_at)
                const now = new Date()
                const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))

                return (
                  <Card
                    key={tagRecipient.id}
                    bg="$orange2"
                    p="$4"
                    br="$5"
                    borderWidth={2}
                    borderColor="$orange7"
                    pressStyle={{ scale: 0.98, bg: '$orange3' }}
                    animation="quick"
                    onPress={() => router.push(`/(auth)/tag/${tag.id}/respond` as any)}
                  >
                    <XStack gap="$3" alignItems="center">
                      <YStack
                        width={48}
                        height={48}
                        br="$4"
                        bg="$orange4"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Text fontSize={24}>{tag.exercise?.icon || '💪'}</Text>
                      </YStack>
                      <YStack flex={1} gap="$1">
                        <Text fontWeight="700" fontSize="$4">
                          {tag.sender?.display_name || 'Someone'} tagged you
                        </Text>
                        <Text color="$gray11" fontSize="$3">
                          {tag.value} {tag.exercise?.type === 'time' ? 'sec' : 'reps'} of {tag.exercise?.name}
                        </Text>
                        <XStack gap="$1" alignItems="center">
                          <Clock size={12} color="$orange10" />
                          <Text color="$orange10" fontSize="$2" fontWeight="600">
                            {hoursLeft}h left to respond
                          </Text>
                        </XStack>
                      </YStack>
                      <ChevronRight size={20} color="$orange10" />
                    </XStack>
                  </Card>
                )
              })}
            </YStack>
          )}

          {/* Tag Someone - Primary CTA */}
          <Card
            bg="$green9"
            p="$5"
            br="$6"
            borderWidth={0}
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.15}
            shadowRadius={12}
            elevation={4}
            pressStyle={{ scale: 0.98, opacity: 0.9 }}
            animation="quick"
            onPress={() => router.push('/(auth)/tag/create')}
          >
            <XStack gap="$4" alignItems="center">
              <YStack
                width={56}
                height={56}
                br="$4"
                bg="rgba(255,255,255,0.2)"
                justifyContent="center"
                alignItems="center"
              >
                <Send size={28} color="white" />
              </YStack>
              <YStack flex={1} gap="$1">
                <Text color="white" fontSize="$6" fontWeight="700">
                  Tag Someone
                </Text>
                <Text color="rgba(255,255,255,0.8)" fontSize="$3">
                  Challenge a friend to beat your workout
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Groups Section */}
          <XStack gap="$3">
            <Card
              flex={1}
              bg="$purple10"
              p="$4"
              br="$5"
              borderWidth={0}
              pressStyle={{ scale: 0.97, opacity: 0.9 }}
              animation="quick"
              onPress={() => router.push('/(auth)/group/create')}
            >
              <YStack gap="$2" alignItems="center">
                <UserPlus size={24} color="white" />
                <Text
                  color="white"
                  fontSize="$4"
                  fontWeight="600"
                  textAlign="center"
                >
                  Create Group
                </Text>
              </YStack>
            </Card>
            <Card
              flex={1}
              bg="$gray3"
              p="$4"
              br="$5"
              borderWidth={0}
              pressStyle={{ scale: 0.97, bg: '$gray4' }}
              animation="quick"
              onPress={() => router.push('/(auth)/group/join')}
            >
              <YStack gap="$2" alignItems="center">
                <Users size={24} color="$gray12" />
                <Text
                  color="$gray12"
                  fontSize="$4"
                  fontWeight="600"
                  textAlign="center"
                >
                  Join Group
                </Text>
              </YStack>
            </Card>
          </XStack>

        </YStack>
      </ScrollView>
    </SafeArea>
  )
}

// Import Users for group cards
import { Users } from '@tamagui/lucide-icons'

/**
 * Compute activity grid from completions array
 */
function computeActivityGrid(completionsArray: any[]): Record<string, number> {
  const grid: Record<string, number> = {}

  // Initialize last 365 days with 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(12, 0, 0, 0) // Set to noon to avoid DST issues
    const key = date.toISOString().split('T')[0]
    if (key) {
      grid[key] = 0
    }
  }

  // Count completions per day
  completionsArray.forEach((completion: any) => {
    if (completion?.completed_at) {
      const date = completion.completed_at.split('T')[0]
      if (date && grid[date] !== undefined) {
        grid[date]++
      }
    }
  })

  return grid
}

/**
 * Compute current streak from activity grid
 */
function computeStreak(grid: Record<string, number>): number {
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(12, 0, 0, 0) // Set to noon to avoid DST issues
    const key = date.toISOString().split('T')[0]

    if (key && grid[key] && grid[key] > 0) {
      streak++
    } else if (i > 0) {
      // Allow today to be incomplete
      break
    }
  }

  return streak
}

export default observer(HomeScreen)
