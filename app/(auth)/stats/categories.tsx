import { useMemo } from 'react'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, ScrollView, View, Card } from 'tamagui'
import { Target, TrendingUp } from '@tamagui/lucide-icons'
import { SafeArea, ScreenHeader } from '@/components/ui'

import { store$, personalRecords$ } from '@/lib/legend-state/store'

// Category configuration
const CATEGORIES: Array<{
  key: string
  label: string
  emoji: string
  color: string
  bgColor: string
}> = [
  { key: 'upper_body', label: 'Upper Body', emoji: '💪', color: '#F43F5E', bgColor: '$coral3' },
  { key: 'lower_body', label: 'Lower Body', emoji: '🦵', color: '#22C55E', bgColor: '$green3' },
  { key: 'core', label: 'Core', emoji: '🎯', color: '#F59E0B', bgColor: '$amber3' },
  { key: 'full_body', label: 'Full Body', emoji: '🏃', color: '#A855F7', bgColor: '$purple3' },
]

/**
 * Categories Detail Page
 * Shows exercise distribution with breakdown by category
 */
function CategoriesDetailPage() {
  const breakdown = store$.getCategoryBreakdown(90) // All time
  const prs = store$.getUserPRs()

  // Group PRs by category
  const prsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    CATEGORIES.forEach((cat) => {
      grouped[cat.key] = prs.filter((pr: any) => pr?.exercise?.category === cat.key)
    })
    return grouped
  }, [prs])

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        <ScreenHeader
          subtitle="Stats"
          title="BALANCE"
          titleIcon={<Target size={20} color="$purple10" />}
        />

        <ScrollView flex={1}>
          <YStack px="$4" py="$3" gap="$5">
            {/* Overview Bar */}
            {breakdown.total > 0 && (
              <Card bg="$gray2" br="$4" borderWidth={1} borderColor="$gray4" p="$4">
                <YStack gap="$3">
                  <Text
                    fontFamily="$display"
                    fontSize={16}
                    color="$gray11"
                    letterSpacing={1}
                  >
                    OVERALL DISTRIBUTION
                  </Text>

                  {/* Full bar */}
                  <XStack height={32} br="$3" overflow="hidden" bg="$gray4">
                    {breakdown.categories
                      .filter((c: { value: number }) => c.value > 0)
                      .sort((a: { name: string }, b: { name: string }) => {
                        const order = ['upper_body', 'lower_body', 'core', 'full_body']
                        return order.indexOf(a.name) - order.indexOf(b.name)
                      })
                      .map((category: { name: string; percentage: number }, index: number, arr: any[]) => {
                        const catConfig = CATEGORIES.find((c) => c.key === category.name)
                        return (
                          <View
                            key={category.name}
                            flex={category.percentage}
                            bg={catConfig?.color || '$gray6'}
                            justifyContent="center"
                            alignItems="center"
                            borderTopLeftRadius={index === 0 ? '$3' : 0}
                            borderBottomLeftRadius={index === 0 ? '$3' : 0}
                            borderTopRightRadius={index === arr.length - 1 ? '$3' : 0}
                            borderBottomRightRadius={index === arr.length - 1 ? '$3' : 0}
                          >
                            {category.percentage >= 12 && (
                              <Text fontSize={12} fontWeight="700" color="white">
                                {category.percentage}%
                              </Text>
                            )}
                          </View>
                        )
                      })}
                  </XStack>

                  {/* Legend */}
                  <XStack flexWrap="wrap" gap="$3">
                    {breakdown.categories
                      .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
                      .map((category: { name: string; value: number }) => {
                        const catConfig = CATEGORIES.find((c) => c.key === category.name)
                        return (
                          <XStack key={category.name} alignItems="center" gap="$1.5" minWidth="45%">
                            <View
                              width={12}
                              height={12}
                              br="$2"
                              bg={catConfig?.color || '$gray6'}
                            />
                            <Text fontSize="$2" color="$gray11">
                              {catConfig?.label || category.name}
                            </Text>
                          </XStack>
                        )
                      })}
                  </XStack>
                </YStack>
              </Card>
            )}

            {/* Category Sections */}
            {CATEGORIES.map((category) => {
              const catData = breakdown.categories.find((c) => c.name === category.key)
              const categoryPRs = prsByCategory[category.key] || []

              return (
                <CategorySection
                  key={category.key}
                  category={category}
                  volume={catData?.value || 0}
                  percentage={catData?.percentage || 0}
                  prs={categoryPRs}
                  total={breakdown.total}
                />
              )
            })}

            {/* Empty state */}
            {breakdown.total === 0 && (
              <YStack py="$10" alignItems="center" gap="$3">
                <Text fontSize={48}>⚖️</Text>
                <Text
                  fontFamily="$display"
                  fontSize={24}
                  color="$gray12"
                  textAlign="center"
                >
                  BUILD YOUR BALANCE
                </Text>
                <Text color="$gray10" fontSize="$3" textAlign="center" maxWidth={280}>
                  Complete different types of exercises to see how your training is distributed!
                </Text>
              </YStack>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </SafeArea>
  )
}

/**
 * Category section component
 */
function CategorySection({
  category,
  volume,
  percentage,
  prs,
  total,
}: {
  category: { key: string; label: string; emoji: string; color: string; bgColor: string }
  volume: number
  percentage: number
  prs: any[]
  total: number
}) {
  const hasActivity = volume > 0 || prs.length > 0

  return (
    <Card bg="$gray2" br="$4" borderWidth={1} borderColor="$gray4" overflow="hidden">
      {/* Header */}
      <XStack
        bg={category.bgColor}
        p="$4"
        alignItems="center"
        gap="$3"
      >
        <Text fontSize={32}>{category.emoji}</Text>
        <YStack flex={1}>
          <Text
            fontFamily="$display"
            fontSize={20}
            color="$gray12"
            letterSpacing={1}
          >
            {category.label.toUpperCase()}
          </Text>
          <Text color="$gray11" fontSize="$2">
            {percentage}% of total volume
          </Text>
        </YStack>
        <YStack alignItems="flex-end">
          <Text
            fontFamily="$mono"
            fontSize={28}
            fontWeight="700"
            color="$gray12"
          >
            {store$.formatNumber(volume)}
          </Text>
          <Text color="$gray10" fontSize="$2">
            reps
          </Text>
        </YStack>
      </XStack>

      {/* Content */}
      <YStack p="$4" gap="$3">
        {/* Progress bar */}
        {total > 0 && (
          <View height={8} br="$2" bg="$gray4" overflow="hidden">
            <View
              height="100%"
              width={`${percentage}%`}
              bg={category.color}
              br="$2"
            />
          </View>
        )}

        {/* Top exercises */}
        {prs.length > 0 ? (
          <YStack gap="$2">
            <Text color="$gray10" fontSize="$2" fontWeight="600">
              Top Exercises ({prs.length})
            </Text>
            {prs.slice(0, 3).map((pr: any) => (
              <XStack
                key={pr.id}
                bg="$gray3"
                br="$3"
                p="$3"
                alignItems="center"
                gap="$3"
              >
                <Text fontSize={20}>{pr.exercise?.icon || '💪'}</Text>
                <YStack flex={1}>
                  <Text fontWeight="600" color="$gray12" numberOfLines={1}>
                    {pr.exercise?.name || 'Exercise'}
                  </Text>
                  <Text color="$gray10" fontSize="$2">
                    {pr.total_completions || 1}x completed
                  </Text>
                </YStack>
                <YStack alignItems="flex-end">
                  <XStack alignItems="center" gap="$1">
                    <TrendingUp size={14} color={category.color} />
                    <Text
                      fontFamily="$mono"
                      fontWeight="700"
                      color={category.color}
                    >
                      {pr.best_value}
                    </Text>
                  </XStack>
                  <Text color="$gray10" fontSize="$1">
                    PR
                  </Text>
                </YStack>
              </XStack>
            ))}
          </YStack>
        ) : (
          <YStack py="$3" alignItems="center">
            <Text color="$gray10" fontSize="$3">
              No {category.label.toLowerCase()} exercises yet
            </Text>
          </YStack>
        )}
      </YStack>
    </Card>
  )
}

export default observer(CategoriesDetailPage)
