import { useRouter } from 'expo-router'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, View, useTheme } from 'tamagui'
import { Target } from '@tamagui/lucide-icons'

import { store$ } from '@/lib/legend-state/store'
import { StatsSummaryCard, StatsSummaryCardVariant } from '@/components/ui'

interface CategoryBreakdownCardProps {
  variant?: StatsSummaryCardVariant
}

// Category display config
const CATEGORY_CONFIG: Record<string, { label: string; emoji: string }> = {
  upper_body: { label: 'Upper Body', emoji: '💪' },
  lower_body: { label: 'Lower Body', emoji: '🦵' },
  core: { label: 'Core', emoji: '🎯' },
  full_body: { label: 'Full Body', emoji: '🏃' },
}

/**
 * CategoryBreakdownCard - Shows exercise distribution balance
 * Taps to navigate to full categories detail page
 */
function CategoryBreakdownCard({ variant = 'glass' }: CategoryBreakdownCardProps) {
  const router = useRouter()
  const breakdown = store$.getCategoryBreakdown(90) // Last 90 days

  const hasData = breakdown.total > 0
  const dominantCategory = CATEGORY_CONFIG[breakdown.dominant]

  return (
    <StatsSummaryCard
      colorScheme="purple"
      variant={variant}
      headerIcon={<Target color="white" size={20} />}
      title="YOUR BALANCE"
      hasData={hasData}
      showFooter={false}
      emptyState={{
        icon: '⚖️',
        title: 'Build your balance',
        subtitle: 'Complete different exercises to see your distribution',
      }}
      onPress={() => router.push('/(auth)/stats/categories' as any)}
      accessibilityLabel={`Exercise balance breakdown. ${hasData ? `Most: ${dominantCategory?.label || 'Unknown'}` : 'No data yet'}. Tap for details`}
    >
      {/* Segmented bar */}
      <SegmentedBar categories={breakdown.categories} />

      {/* Dominant category badge */}
      {dominantCategory && (
        <XStack alignItems="center" gap="$2.5">
          <Text fontSize={24}>{dominantCategory.emoji}</Text>
          <Text color="$purple11" fontSize="$4" fontWeight="600">
            Strongest:{' '}
            <Text fontWeight="800" color="$purple12">
              {dominantCategory.label}
            </Text>
          </Text>
        </XStack>
      )}
    </StatsSummaryCard>
  )
}

/**
 * Segmented horizontal bar with percentages
 */
function SegmentedBar({
  categories,
}: {
  categories: Array<{ name: string; label: string; value: number; percentage: number; color: string }>
}) {
  const theme = useTheme()

  // Get actual colors from theme
  const getColor = (colorToken: string) => {
    const key = colorToken.replace('$', '')
    return (theme as any)[key]?.val || colorToken
  }

  // Filter and sort by value
  const sortedCategories = [...categories]
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)

  if (sortedCategories.length === 0) return null

  return (
    <YStack gap="$3">
      {/* Bar */}
      <XStack height={28} br="$3" overflow="hidden" bg="rgba(255,255,255,0.4)">
        {sortedCategories.map((category, index) => (
          <View
            key={category.name}
            flex={category.percentage}
            bg={getColor(category.color)}
            justifyContent="center"
            alignItems="center"
            borderTopLeftRadius={index === 0 ? '$3' : 0}
            borderBottomLeftRadius={index === 0 ? '$3' : 0}
            borderTopRightRadius={index === sortedCategories.length - 1 ? '$3' : 0}
            borderBottomRightRadius={index === sortedCategories.length - 1 ? '$3' : 0}
          >
            {category.percentage >= 15 && (
              <Text fontSize={12} fontWeight="800" color="white">
                {category.percentage}%
              </Text>
            )}
          </View>
        ))}
      </XStack>

      {/* Legend row */}
      <XStack flexWrap="wrap" gap="$3" justifyContent="space-between">
        {sortedCategories.map((category) => (
          <XStack key={category.name} alignItems="center" gap="$1.5" minWidth="40%">
            <View
              width={12}
              height={12}
              br="$2"
              bg={getColor(category.color)}
            />
            <Text fontSize="$3" fontWeight="600" color="$purple11">
              {category.label}
            </Text>
            <Text fontSize="$3" fontWeight="800" color="$purple12">
              {category.percentage}%
            </Text>
          </XStack>
        ))}
      </XStack>
    </YStack>
  )
}

export default observer(CategoryBreakdownCard)
