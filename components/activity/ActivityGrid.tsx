import { useMemo, useRef, useEffect } from 'react'
import { observer } from '@legendapp/state/react'
import { XStack, YStack, View, Text, ScrollView } from 'tamagui'

import { store$ } from '@/lib/legend-state/store'

/**
 * GitHub-style activity grid
 *
 * Shows last 365 days of workout activity with color intensity
 * based on number of completions per day.
 */
export const ActivityGrid = observer(({
  activityData
}: {
  activityData?: Record<string, number>
}) => {
  const activityGrid = activityData || store$.activityGrid()
  const scrollViewRef = useRef<any>(null)

  console.log('[ActivityGrid] Total days in grid:', Object.keys(activityGrid).length)
  const daysWithActivity = Object.entries(activityGrid).filter(([_, count]) => count > 0)
  console.log('[ActivityGrid] Days with activity:', daysWithActivity.length)
  console.log('[ActivityGrid] Activity days:', daysWithActivity.slice(0, 5))

  // Generate weeks for display (last 52 weeks)
  const weeks = useMemo(() => {
    const result: Array<Array<{ date: string; count: number }>> = []
    const today = new Date()

    // Start from Sunday of current week
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(12, 0, 0, 0) // Normalize time to avoid DST issues

    // Go back 52 weeks
    for (let week = 0; week < 52; week++) {
      const weekData: Array<{ date: string; count: number }> = []

      for (let day = 0; day < 7; day++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() - (week * 7) + day)
        date.setHours(12, 0, 0, 0) // Set to noon to avoid DST issues
        const key = date.toISOString().split('T')[0] || ''

        weekData.push({
          date: key,
          count: activityGrid[key] || 0,
        })
      }

      result.unshift(weekData) // Add to beginning to show oldest first
    }

    console.log('[ActivityGrid] Generated weeks:', result.length)
    // Check if any week has non-zero data
    const weeksWithActivity = result.filter(week =>
      week.some(day => day.count > 0)
    )
    console.log('[ActivityGrid] Weeks with activity:', weeksWithActivity.length)
    if (weeksWithActivity.length > 0) {
      console.log('[ActivityGrid] Sample week with activity:', weeksWithActivity[0])
    }

    return result
  }, [activityGrid])

  // Scroll to end (most recent weeks) on mount
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false })
    }, 100)
  }, [])

  return (
    <YStack gap="$1">
      {/* Month labels would go here */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
      >
        <XStack gap="$0.5" px="$2">
          {weeks.map((week, weekIndex) => (
            <YStack key={weekIndex} gap="$0.5">
              {week.map((day) => (
                <ActivityCell key={day.date} count={day.count} />
              ))}
            </YStack>
          ))}
        </XStack>
      </ScrollView>

      {/* Legend */}
      <XStack gap="$2" alignItems="center" mt="$2">
        <Text fontSize="$3" color="$gray10">
          Less
        </Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            w={12}
            h={12}
            br="$1"
            bg={getColorForLevel(level)}
          />
        ))}
        <Text fontSize="$3" color="$gray10">
          More
        </Text>
      </XStack>
    </YStack>
  )
})

/**
 * Single cell in the activity grid
 */
function ActivityCell({ count }: { count: number }) {
  const level = getLevel(count)
  const color = getColorForLevel(level)

  return (
    <View
      w={12}
      h={12}
      br="$1"
      bg={color}
      borderWidth={count > 0 ? 2 : 0.5}
      borderColor={count > 0 ? "$green10" : "$gray6"}
    />
  )
}

/**
 * Convert count to intensity level (0-4)
 */
function getLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

/**
 * Get color for intensity level
 */
function getColorForLevel(level: number): string {
  switch (level) {
    case 0:
      return '$gray5'
    case 1:
      return '$green7'  // More visible than $green4
    case 2:
      return '$green8'  // More visible than $green6
    case 3:
      return '$green9'  // More visible than $green8
    case 4:
      return '$green10'
    default:
      return '$gray5'
  }
}

export default ActivityGrid
