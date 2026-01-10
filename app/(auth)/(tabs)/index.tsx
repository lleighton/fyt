import { useState, useCallback } from 'react'
import { RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  Card,
  ScrollView,
  View,
} from 'tamagui'
import { LinearGradient } from '@tamagui/linear-gradient'
import { Flame, Send, Clock, ChevronRight, Zap } from '@tamagui/lucide-icons'
import { SafeArea, StreakCard, ItemCard } from '@/components/ui'
import { PRsSummaryCard, VolumeSummaryCard, CategoryBreakdownCard } from '@/components/stats'

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
        <YStack px="$4" py="$5" gap="$5">
          {/* Header - Athletic Broadcast Style */}
          <YStack gap="$1">
            <Text
              color="$gray10"
              fontSize="$2"
              fontFamily="$body"
              textTransform="uppercase"
              letterSpacing={1.5}
            >
              Welcome back
            </Text>
            <Text
              fontFamily="$display"
              fontSize={36}
              color="$color"
              letterSpacing={1}
            >
              {(profile?.display_name || 'Athlete').toUpperCase()}
            </Text>
          </YStack>

          {/* Streak Cards - Scoreboard Style */}
          {/* Variants: 'gradient' | 'subtle' | 'glass' | 'accent' | 'minimal' | 'glow' */}
          <XStack gap="$3">
            <StreakCard
              label="Activity"
              value={currentStreak}
              unit="day streak"
              icon={<Flame color="$coral11" size={16} />}
              colorScheme="coral"
              variant="glass"
            />
            <StreakCard
              label="Tag Streak"
              value={tagStreak}
              unit="day streak"
              icon={<Zap color="$green11" size={16} />}
              colorScheme="green"
              variant="glass"
            />
          </XStack>

          {/* Stats Summary Cards */}
          <PRsSummaryCard />
          <VolumeSummaryCard />

          {/* Activity Grid - Heatmap Style */}
          <Card
            bg="$gray2"
            p="$5"
            br="$4"
            borderWidth={1}
            borderColor="$gray4"
            accessible={true}
            accessibilityLabel="Activity heatmap showing daily workout completions over the past year"
          >
            <YStack gap="$4">
              <XStack justifyContent="space-between" alignItems="flex-end">
                <YStack gap="$0.5">
                  <Text
                    color="$gray11"
                    fontSize="$1"
                    fontFamily="$body"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing={1.2}
                  >
                    Activity
                  </Text>
                  <Text
                    fontFamily="$display"
                    fontSize={24}
                    color="$gray12"
                    letterSpacing={0.5}
                  >
                    365 DAYS
                  </Text>
                </YStack>
                <Text
                  color="$gray10"
                  fontSize="$2"
                  fontFamily="$body"
                >
                  Your workout history
                </Text>
              </XStack>
              <ActivityGrid activityData={activityGrid} />
            </YStack>
          </Card>

          {/* Category Balance Card */}
          <CategoryBreakdownCard />

          {/* Pending Tags Section */}
          {pendingTags.length > 0 && (
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$2" alignItems="center">
                  <Clock size={18} color="$coral10" />
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
                  bg="$coral10"
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
                  <ItemCard
                    key={tagRecipient.id}
                    icon={tag.exercise?.icon || '💪'}
                    title={`${tag.sender?.display_name || 'Someone'} tagged you`}
                    subtitle={`${tag.value} ${tag.exercise?.type === 'time' ? 'sec' : 'reps'} of ${tag.exercise?.name}`}
                    meta={
                      <XStack gap="$1" alignItems="center">
                        <Clock size={12} color="$coral12" />
                        <Text color="$coral12" fontSize="$2" fontWeight="600">
                          {hoursLeft}h left to respond
                        </Text>
                      </XStack>
                    }
                    colorScheme="coral"
                    bordered
                    onPress={() => router.push(`/(auth)/tag/${tag.id}/respond` as any)}
                  />
                )
              })}
            </YStack>
          )}

          {/* Tag Someone - Primary CTA - Bold & Distinctive */}
          <Card
            br="$4"
            borderWidth={0}
            overflow="hidden"
            position="relative"
            shadowColor="$coral8"
            shadowOffset={{ width: 0, height: 8 }}
            shadowOpacity={0.3}
            shadowRadius={16}
            elevation={8}
            pressStyle={{ scale: 0.97, opacity: 0.95 }}
            animation="bouncy"
            onPress={() => router.push('/(auth)/tag/create')}
          >
            {/* Main gradient background */}
            <LinearGradient
              colors={['$coral5', '$coral6', '$coral7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
            />
            {/* Corner highlight gradient */}
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.3, 0.7]}
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
            />
            <XStack gap="$4" alignItems="center" p="$5">
              <YStack
                width={60}
                height={60}
                br="$3"
                bg="rgba(255,255,255,0.15)"
                borderWidth={2}
                borderColor="rgba(255,255,255,0.2)"
                justifyContent="center"
                alignItems="center"
              >
                <Send size={28} color="white" />
              </YStack>
              <YStack flex={1} gap="$1">
                <Text
                  color="white"
                  fontFamily="$display"
                  fontSize={26}
                  letterSpacing={1}
                >
                  TAG SOMEONE
                </Text>
                <Text
                  color="rgba(255,255,255,0.85)"
                  fontSize="$3"
                  fontFamily="$body"
                >
                  Challenge a friend to match your workout
                </Text>
              </YStack>
              <ChevronRight size={24} color="rgba(255,255,255,0.6)" />
            </XStack>
          </Card>

        </YStack>
      </ScrollView>
    </SafeArea>
  )
}

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
