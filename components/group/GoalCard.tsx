import { useState, useEffect } from 'react'
import { YStack, XStack, Text, Card, Progress } from 'tamagui'
import { Target, Users, Calendar, Trophy } from '@tamagui/lucide-icons'
import { observer } from '@legendapp/state/react'

import { supabase } from '@/lib/supabase'

interface GoalProgress {
  goal_id: string
  current_value: number
  target_value: number
  percentage: number
  contributor_count: number
  top_contributors: Array<{
    user_id: string
    display_name: string
    contribution: number
  }>
}

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
    name: string
    icon: string | null
  } | null
}

interface GoalCardProps {
  goal: Goal
  onPress?: () => void
  showProgress?: boolean
}

/**
 * Goal Card Component
 *
 * Displays a group goal with:
 * - Progress bar
 * - Current vs target values
 * - Time remaining
 * - Top contributors (optional)
 */
function GoalCardComponent({ goal, onPress, showProgress = true }: GoalCardProps) {
  const [progress, setProgress] = useState<GoalProgress | null>(null)
  const [loading, setLoading] = useState(showProgress)

  useEffect(() => {
    if (!showProgress) return

    const fetchProgress = async () => {
      try {
        const { data, error } = await (supabase.rpc as any)(
          'get_goal_progress',
          { p_goal_id: goal.id }
        )

        if (error) {
          console.error('Error fetching goal progress:', error)
        } else if (data && data.length > 0) {
          setProgress(data[0])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [goal.id, showProgress])

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date()
    const ends = new Date(goal.ends_at)
    const diffMs = ends.getTime() - now.getTime()

    if (diffMs <= 0) return 'Ended'

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h left`
    return 'Ending soon'
  }

  // Get progress percentage
  const percentage = progress?.percentage ?? Math.min(100, (goal.current_value / goal.target_value) * 100)
  const isCompleted = goal.status === 'completed' || percentage >= 100

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  // Get goal icon
  const getGoalIcon = () => {
    if (goal.exercise?.icon) return goal.exercise.icon
    if (goal.category === 'upper_body') return '💪'
    if (goal.category === 'core') return '🎯'
    if (goal.category === 'lower_body') return '🦵'
    if (goal.category === 'full_body') return '🔥'
    return '🏆'
  }

  // Get goal label
  const getGoalLabel = () => {
    if (goal.exercise?.name) return goal.exercise.name
    if (goal.category === 'all') return 'All Exercises'
    if (goal.category) {
      return goal.category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    }
    return 'Exercise'
  }

  return (
    <Card
      bg={isCompleted ? '$green2' : '$backgroundHover'}
      p="$4"
      br="$4"
      borderWidth={isCompleted ? 2 : 0}
      borderColor="$green7"
      pressStyle={onPress ? { scale: 0.98, opacity: 0.9 } : undefined}
      animation={onPress ? 'quick' : undefined}
      onPress={onPress}
    >
      <YStack gap="$3">
        {/* Header Row */}
        <XStack justifyContent="space-between" alignItems="flex-start">
          <XStack gap="$3" alignItems="center" flex={1}>
            {/* Icon */}
            <YStack
              width={48}
              height={48}
              br="$4"
              bg={isCompleted ? '$green4' : '$orange4'}
              justifyContent="center"
              alignItems="center"
            >
              <Text fontSize={24}>{getGoalIcon()}</Text>
            </YStack>

            {/* Title & Label - adapt colors for WCAG on green/gray backgrounds */}
            <YStack flex={1}>
              <Text fontWeight="700" fontSize="$4" numberOfLines={1}>
                {goal.title}
              </Text>
              <XStack gap="$2" alignItems="center">
                <Target size={12} color={isCompleted ? '$green12' : '$gray10'} />
                <Text color={isCompleted ? '$green12' : '$gray10'} fontSize="$3">
                  {getGoalLabel()}
                </Text>
                {goal.include_variants && (
                  <Text color={isCompleted ? '$green11' : '$orange10'} fontSize="$2" fontWeight="600">
                    +variants
                  </Text>
                )}
              </XStack>
            </YStack>
          </XStack>

          {/* Status Badge */}
          {isCompleted ? (
            <XStack bg="$green10" px="$2" py="$1" br="$2">
              <Trophy size={14} color="white" />
              <Text color="white" fontSize="$2" fontWeight="600" ml="$1">
                Complete!
              </Text>
            </XStack>
          ) : (
            <XStack bg="$gray4" px="$2" py="$1" br="$2" gap="$1" alignItems="center">
              <Calendar size={12} color="$gray11" />
              <Text color="$gray11" fontSize="$2" fontWeight="500">
                {getTimeRemaining()}
              </Text>
            </XStack>
          )}
        </XStack>

        {/* Progress Bar */}
        <YStack gap="$2">
          <Progress value={percentage} bg="$gray4" height={12} br="$10">
            <Progress.Indicator
              animation="bouncy"
              bg={isCompleted ? '$green10' : '$orange10'}
            />
          </Progress>

          {/* Progress Numbers */}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="600" color={isCompleted ? '$green11' : '$orange11'}>
              {formatNumber(progress?.current_value ?? goal.current_value)} / {formatNumber(goal.target_value)}
            </Text>
            <Text fontWeight="700" color={isCompleted ? '$green10' : '$orange10'}>
              {Math.round(percentage)}%
            </Text>
          </XStack>
        </YStack>

        {/* Contributors - use $green12 on green bg for WCAG compliance */}
        {progress && progress.contributor_count > 0 && (
          <XStack gap="$2" alignItems="center">
            <Users size={14} color={isCompleted ? '$green12' : '$gray10'} />
            <Text color={isCompleted ? '$green12' : '$gray10'} fontSize="$3">
              {progress.contributor_count} contributor{progress.contributor_count !== 1 ? 's' : ''}
            </Text>
            {progress.top_contributors?.[0]?.display_name && (
              <Text color={isCompleted ? '$green12' : '$gray10'} fontSize="$3">
                • Top: {progress.top_contributors[0].display_name}
              </Text>
            )}
          </XStack>
        )}

        {/* Description */}
        {goal.description && (
          <Text color={isCompleted ? '$green12' : '$gray10'} fontSize="$3" numberOfLines={2}>
            {goal.description}
          </Text>
        )}
      </YStack>
    </Card>
  )
}

export const GoalCard = observer(GoalCardComponent)
