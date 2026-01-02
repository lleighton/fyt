import { useState, useEffect } from 'react'
import { ActivityIndicator } from 'react-native'
import { YStack, XStack, Text, Card, Button } from 'tamagui'
import { TrendingUp, Users, Award } from '@tamagui/lucide-icons'
import { observer } from '@legendapp/state/react'

import { supabase } from '@/lib/supabase'

interface ExerciseStat {
  exercise_id: string
  exercise_name: string
  exercise_icon: string | null
  total_value: number
  completion_count: number
  top_contributor_id: string | null
  top_contributor_name: string | null
  top_contributor_value: number
}

interface GroupExerciseStatsProps {
  groupId: string
  timeFilter: 'week' | 'month' | 'all_time'
  onTimeFilterChange: (filter: 'week' | 'month' | 'all_time') => void
}

/**
 * Group Exercise Stats Component
 *
 * Displays aggregated exercise totals for a group with:
 * - Total reps/time per exercise
 * - Top contributor per exercise
 * - Time filter controls
 */
function GroupExerciseStatsComponent({
  groupId,
  timeFilter,
  onTimeFilterChange,
}: GroupExerciseStatsProps) {
  const [stats, setStats] = useState<ExerciseStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const isFirstLoad = stats.length === 0
      if (isFirstLoad) {
        setLoading(true)
      }

      try {
        const { data, error } = await (supabase.rpc as any)(
          'get_group_exercise_totals',
          {
            p_group_id: groupId,
            p_time_filter: timeFilter,
            p_include_variants: true,
          }
        )

        if (error) {
          console.error('Error fetching exercise stats:', error)
        } else {
          setStats(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        if (isFirstLoad) {
          setLoading(false)
        }
      }
    }

    fetchStats()
  }, [groupId, timeFilter])

  // Format large numbers (e.g., 10500 -> 10.5k)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <YStack gap="$4">
      {/* Time Filter Buttons */}
      <XStack gap="$2" justifyContent="center">
        <Button
          size="$3"
          bg={timeFilter === 'week' ? '$purple10' : '$backgroundHover'}
          color={timeFilter === 'week' ? 'white' : '$gray11'}
          onPress={() => onTimeFilterChange('week')}
          flex={1}
        >
          Week
        </Button>
        <Button
          size="$3"
          bg={timeFilter === 'month' ? '$purple10' : '$backgroundHover'}
          color={timeFilter === 'month' ? 'white' : '$gray11'}
          onPress={() => onTimeFilterChange('month')}
          flex={1}
        >
          Month
        </Button>
        <Button
          size="$3"
          bg={timeFilter === 'all_time' ? '$purple10' : '$backgroundHover'}
          color={timeFilter === 'all_time' ? 'white' : '$gray11'}
          onPress={() => onTimeFilterChange('all_time')}
          flex={1}
        >
          All-time
        </Button>
      </XStack>

      {/* Stats Grid */}
      {loading ? (
        <YStack alignItems="center" py="$6">
          <ActivityIndicator size="large" />
          <Text mt="$3" color="$gray10">Loading stats...</Text>
        </YStack>
      ) : stats.length === 0 ? (
        <Card bg="$backgroundHover" p="$6" br="$4" alignItems="center">
          <TrendingUp size={48} color="$gray10" />
          <Text color="$gray10" textAlign="center" mt="$3">
            No group activity yet
          </Text>
          <Text color="$gray10" textAlign="center" mt="$2" fontSize="$3">
            Complete tags to see group totals here!
          </Text>
        </Card>
      ) : (
        <YStack gap="$3">
          {stats.map((stat) => (
            <Card
              key={stat.exercise_id}
              bg="$backgroundHover"
              p="$4"
              br="$4"
            >
              <XStack gap="$4" alignItems="center">
                {/* Exercise Icon */}
                <YStack
                  width={56}
                  height={56}
                  br="$4"
                  bg="$purple4"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text fontSize={28}>{stat.exercise_icon || '💪'}</Text>
                </YStack>

                {/* Exercise Info */}
                <YStack flex={1} gap="$1">
                  <Text fontWeight="700" fontSize="$4">
                    {stat.exercise_name}
                  </Text>

                  {/* Total */}
                  <XStack gap="$2" alignItems="center">
                    <TrendingUp size={14} color="$purple10" />
                    <Text color="$purple11" fontWeight="600">
                      {formatNumber(stat.total_value)} total
                    </Text>
                    <Text color="$gray10" fontSize="$2">
                      ({stat.completion_count} completions)
                    </Text>
                  </XStack>

                  {/* Top Contributor */}
                  {stat.top_contributor_name && (
                    <XStack gap="$2" alignItems="center">
                      <Award size={14} color="$yellow10" />
                      <Text color="$gray10" fontSize="$3">
                        Top: {stat.top_contributor_name} ({formatNumber(stat.top_contributor_value)})
                      </Text>
                    </XStack>
                  )}
                </YStack>

                {/* Big Total Number */}
                <YStack alignItems="flex-end">
                  <Text fontSize="$7" fontWeight="700" color="$purple10">
                    {formatNumber(stat.total_value)}
                  </Text>
                </YStack>
              </XStack>
            </Card>
          ))}
        </YStack>
      )}
    </YStack>
  )
}

export const GroupExerciseStats = observer(GroupExerciseStatsComponent)
