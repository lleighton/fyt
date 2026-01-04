import { useState, useEffect } from 'react'
import { ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, H1, Button, Card, ScrollView, Avatar, Progress } from 'tamagui'
import { ArrowLeft, Target, Trophy, Users, Calendar, Award, TrendingUp } from '@tamagui/lucide-icons'
import { SafeArea } from '@/components/ui'

import { supabase } from '@/lib/supabase'
import { auth$ } from '@/lib/legend-state/store'

interface Goal {
  id: string
  title: string
  description?: string | null
  exercise_id?: string | null
  category?: string | null
  target_value: number
  target_unit: string
  starts_at: string
  ends_at: string
  current_value: number
  status: 'active' | 'completed' | 'cancelled'
  include_variants: boolean
  exercise?: {
    id: string
    name: string
    icon: string | null
  } | null
}

interface Contributor {
  user_id: string
  display_name: string
  avatar_url: string | null
  contribution: number
  contribution_count: number
}

interface GoalProgress {
  goal_id: string
  current_value: number
  target_value: number
  percentage: number
  contributor_count: number
  top_contributors: Contributor[]
}

/**
 * Goal Detail Screen
 *
 * Shows:
 * - Goal progress with visual bar
 * - Time remaining
 * - Contributor leaderboard
 * - Recent contributions
 */
function GoalDetailScreen() {
  const router = useRouter()
  const { id: groupId, goalId } = useLocalSearchParams<{ id: string; goalId: string }>()
  const session = auth$.session.get()

  const [goal, setGoal] = useState<Goal | null>(null)
  const [progress, setProgress] = useState<GoalProgress | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch goal and progress
  useEffect(() => {
    const fetchData = async () => {
      if (!goalId) return

      try {
        // Fetch goal details
        const { data: goalData, error: goalError } = await (supabase
          .from('group_goals') as any)
          .select(`
            *,
            exercise:exercises (
              id,
              name,
              icon
            )
          `)
          .eq('id', goalId)
          .single()

        if (goalError) {
          console.error('Error fetching goal:', goalError)
          return
        }

        setGoal(goalData)

        // Fetch progress
        const { data: progressData, error: progressError } = await (supabase.rpc as any)(
          'get_goal_progress',
          { p_goal_id: goalId }
        )

        if (progressError) {
          console.error('Error fetching progress:', progressError)
        } else if (progressData && progressData.length > 0) {
          setProgress(progressData[0])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [goalId])

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!goal) return ''
    const now = new Date()
    const ends = new Date(goal.ends_at)
    const diffMs = ends.getTime() - now.getTime()

    if (diffMs <= 0) return 'Ended'

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days} days, ${hours} hours left`
    if (hours > 0) return `${hours} hours left`
    return 'Ending soon'
  }

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  // Get goal icon
  const getGoalIcon = () => {
    if (goal?.exercise?.icon) return goal.exercise.icon
    if (goal?.category === 'upper_body') return '💪'
    if (goal?.category === 'core') return '🎯'
    if (goal?.category === 'lower_body') return '🦵'
    if (goal?.category === 'full_body') return '🔥'
    return '🏆'
  }

  if (loading) {
    return (
      <SafeArea edges={['top']}>
        <YStack flex={1} bg="$background" justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" />
          <Text mt="$4" color="$gray10">Loading goal...</Text>
        </YStack>
      </SafeArea>
    )
  }

  if (!goal) {
    return (
      <SafeArea edges={['top']}>
        <YStack flex={1} bg="$background" justifyContent="center" alignItems="center" p="$4">
          <Text color="$gray10" textAlign="center">Goal not found</Text>
          <Button mt="$4" onPress={() => router.back()}>Go Back</Button>
        </YStack>
      </SafeArea>
    )
  }

  const percentage = progress?.percentage ?? Math.min(100, (goal.current_value / goal.target_value) * 100)
  const isCompleted = goal.status === 'completed' || percentage >= 100
  const currentValue = progress?.current_value ?? goal.current_value
  const contributors = progress?.top_contributors || []

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <XStack px="$4" py="$3" gap="$3" alignItems="center">
          <Button
            size="$3"
            circular
            unstyled
            icon={<ArrowLeft size={24} />}
            onPress={() => router.back()}
          />
          <H1 fontSize="$6" flex={1} numberOfLines={1}>
            {goal.title}
          </H1>
        </XStack>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack px="$4" gap="$4" pb="$6">
            {/* Hero Card */}
            <Card
              bg={isCompleted ? '$green2' : '$orange2'}
              p="$5"
              br="$6"
              borderWidth={isCompleted ? 2 : 0}
              borderColor="$green7"
            >
              <YStack gap="$4" alignItems="center">
                {/* Icon */}
                <YStack
                  width={80}
                  height={80}
                  br="$6"
                  bg={isCompleted ? '$green4' : '$orange4'}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text fontSize={40}>{getGoalIcon()}</Text>
                </YStack>

                {/* Status Badge */}
                {isCompleted && (
                  <XStack bg="$green10" px="$3" py="$1.5" br="$4" gap="$2" alignItems="center">
                    <Trophy size={18} color="white" />
                    <Text color="white" fontWeight="700">Goal Completed!</Text>
                  </XStack>
                )}

                {/* Progress Numbers */}
                <YStack alignItems="center" gap="$1">
                  <XStack alignItems="baseline" gap="$2">
                    <Text fontSize={48} fontWeight="700" color={isCompleted ? '$green10' : '$orange10'}>
                      {formatNumber(currentValue)}
                    </Text>
                    <Text fontSize="$5" color="$gray10">
                      / {formatNumber(goal.target_value)}
                    </Text>
                  </XStack>
                  <Text color="$gray10" fontSize="$4">
                    {goal.target_unit}
                  </Text>
                </YStack>

                {/* Progress Bar */}
                <YStack width="100%" gap="$2">
                  <Progress value={percentage} bg="$gray4" height={16} br="$10">
                    <Progress.Indicator
                      animation="bouncy"
                      bg={isCompleted ? '$green10' : '$orange10'}
                    />
                  </Progress>
                  <XStack justifyContent="space-between">
                    <Text color="$gray10" fontSize="$3">
                      {goal.target_value - currentValue > 0
                        ? `${formatNumber(goal.target_value - currentValue)} to go`
                        : 'Target reached!'}
                    </Text>
                    <Text fontWeight="700" color={isCompleted ? '$green10' : '$orange10'}>
                      {Math.round(percentage)}%
                    </Text>
                  </XStack>
                </YStack>

                {/* Time Remaining */}
                {goal.status === 'active' && (
                  <XStack gap="$2" alignItems="center" bg="$gray4" px="$3" py="$2" br="$4">
                    <Calendar size={16} color="$gray11" />
                    <Text color="$gray11" fontWeight="500">
                      {getTimeRemaining()}
                    </Text>
                  </XStack>
                )}
              </YStack>
            </Card>

            {/* Goal Details */}
            <Card bg="$backgroundHover" p="$4" br="$4">
              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <Target size={18} color="$orange10" />
                  <Text fontWeight="600">
                    {goal.exercise?.name || goal.category?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'All Exercises'}
                  </Text>
                  {goal.include_variants && (
                    <XStack bg="$orange6" px="$2" py="$0.5" br="$2">
                      <Text fontSize="$2" color="white" fontWeight="600">
                        +variants
                      </Text>
                    </XStack>
                  )}
                </XStack>

                {goal.description && (
                  <Text color="$gray10">{goal.description}</Text>
                )}

                <XStack gap="$4">
                  <YStack>
                    <Text color="$gray10" fontSize="$2">Started</Text>
                    <Text fontWeight="600">
                      {new Date(goal.starts_at).toLocaleDateString()}
                    </Text>
                  </YStack>
                  <YStack>
                    <Text color="$gray10" fontSize="$2">Ends</Text>
                    <Text fontWeight="600">
                      {new Date(goal.ends_at).toLocaleDateString()}
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </Card>

            {/* Contributors Leaderboard */}
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Users size={20} color="$gray11" />
                <Text fontWeight="700" fontSize="$5">
                  Contributors ({progress?.contributor_count || 0})
                </Text>
              </XStack>

              {contributors.length === 0 ? (
                <Card bg="$backgroundHover" p="$5" br="$4" alignItems="center">
                  <TrendingUp size={40} color="$gray10" />
                  <Text color="$gray10" textAlign="center" mt="$3">
                    No contributions yet
                  </Text>
                  <Text color="$gray10" textAlign="center" mt="$1" fontSize="$3">
                    Complete tags to contribute to this goal!
                  </Text>
                </Card>
              ) : (
                <YStack gap="$2">
                  {contributors.map((contributor, index) => {
                    const isCurrentUser = contributor.user_id === session?.user?.id
                    const contributionPercentage = (contributor.contribution / currentValue) * 100

                    return (
                      <Card
                        key={contributor.user_id}
                        bg={isCurrentUser ? '$orange2' : '$backgroundHover'}
                        p="$3"
                        br="$4"
                        borderWidth={isCurrentUser ? 1 : 0}
                        borderColor="$orange7"
                      >
                        <XStack gap="$3" alignItems="center">
                          {/* Rank */}
                          <YStack width={32} height={32} alignItems="center" justifyContent="center">
                            {index === 0 ? (
                              <Award size={24} color={isCurrentUser ? '$yellow9' : '$yellow10'} />
                            ) : index === 1 ? (
                              <Award size={22} color="$gray10" />
                            ) : index === 2 ? (
                              <Award size={20} color={isCurrentUser ? '$orange11' : '$orange10'} />
                            ) : (
                              <Text fontSize="$4" fontWeight="700" color={isCurrentUser ? '$orange12' : '$gray11'}>
                                {index + 1}
                              </Text>
                            )}
                          </YStack>

                          {/* Avatar */}
                          <Avatar circular size="$4" bg="$orange10">
                            {contributor.avatar_url ? (
                              <Avatar.Image src={contributor.avatar_url} />
                            ) : (
                              <Avatar.Fallback justifyContent="center" alignItems="center">
                                <Text color="white" fontWeight="700">
                                  {(contributor.display_name ?? 'U').charAt(0).toUpperCase()}
                                </Text>
                              </Avatar.Fallback>
                            )}
                          </Avatar>

                          {/* Name & Stats */}
                          <YStack flex={1}>
                            <XStack gap="$2" alignItems="center">
                              <Text fontWeight="600" numberOfLines={1} color={isCurrentUser ? '$orange12' : '$color'}>
                                {contributor.display_name || 'User'}
                              </Text>
                              {isCurrentUser && (
                                <Text fontSize="$2" color="$orange11" fontWeight="600">
                                  (You)
                                </Text>
                              )}
                            </XStack>
                            <Text color={isCurrentUser ? '$orange11' : '$gray10'} fontSize="$2">
                              {contributor.contribution_count} completion{contributor.contribution_count !== 1 ? 's' : ''} • {Math.round(contributionPercentage)}% of total
                            </Text>
                          </YStack>

                          {/* Contribution Value */}
                          <YStack alignItems="flex-end">
                            <Text fontSize="$5" fontWeight="700" color={isCurrentUser ? '$orange12' : '$orange10'}>
                              {formatNumber(contributor.contribution)}
                            </Text>
                            <Text fontSize="$2" color={isCurrentUser ? '$orange11' : '$gray10'}>
                              {goal.target_unit}
                            </Text>
                          </YStack>
                        </XStack>
                      </Card>
                    )
                  })}
                </YStack>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </SafeArea>
  )
}

export default observer(GoalDetailScreen)
