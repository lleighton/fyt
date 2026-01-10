import { useRouter } from 'expo-router'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, View } from 'tamagui'
import { TrendingUp, TrendingDown, Activity } from '@tamagui/lucide-icons'

import { store$ } from '@/lib/legend-state/store'
import { StatsSummaryCard, StatsSummaryCardVariant } from '@/components/ui'

interface VolumeSummaryCardProps {
  variant?: StatsSummaryCardVariant
}

// Category colors for the stacking bar
const CATEGORY_COLORS: Record<string, string> = {
  upper_body: '#F43F5E', // coral
  lower_body: '#22C55E', // green
  core: '#F59E0B', // amber
  full_body: '#A855F7', // purple
}

/**
 * VolumeSummaryCard - Shows weekly volume with stacking bar breakdown
 * Taps to navigate to full volume detail page
 */
function VolumeSummaryCard({ variant = 'glass' }: VolumeSummaryCardProps) {
  const router = useRouter()
  const volumeData = store$.getVolumeByPeriod(7)
  const categoryBreakdown = store$.getCategoryBreakdown(7)

  const hasData = volumeData.total > 0

  return (
    <StatsSummaryCard
      colorScheme="amber"
      variant={variant}
      headerIcon={<Activity color="white" size={20} />}
      title="THIS WEEK"
      hasData={hasData}
      showFooter={false}
      emptyState={{
        icon: '📊',
        title: 'No activity this week',
        subtitle: 'Complete some tags to see your volume!',
      }}
      onPress={() => router.push('/(auth)/stats/volume' as any)}
      accessibilityLabel={`This week volume: ${volumeData.total} total. Tap to view details`}
    >
      {/* Hero number + change indicator */}
      <XStack alignItems="flex-end" gap="$3">
        <Text
          fontFamily="$mono"
          fontSize={56}
          fontWeight="800"
          color="$amber12"
          lineHeight={60}
        >
          {store$.formatNumber(volumeData.total)}
        </Text>
        <YStack pb="$2">
          <Text color="$amber11" fontSize="$4" fontWeight="600">
            reps
          </Text>
        </YStack>
      </XStack>

      {/* Stacking bar */}
      <StackingBar categories={categoryBreakdown.categories} total={categoryBreakdown.total} />

      {/* Comparison badge */}
      <XStack alignItems="center" gap="$2">
        {volumeData.percentChange !== 0 && (
          <XStack
            bg={volumeData.percentChange > 0 ? '$green5' : '$red5'}
            px="$2.5"
            py="$1.5"
            br="$2"
            alignItems="center"
            gap="$1.5"
          >
            {volumeData.percentChange > 0 ? (
              <TrendingUp size={16} color="$green11" />
            ) : (
              <TrendingDown size={16} color="$gray11" />
            )}
            <Text
              fontSize="$3"
              fontWeight="800"
              color={volumeData.percentChange > 0 ? '$green11' : '$gray11'}
            >
              {volumeData.percentChange > 0 ? '+' : ''}
              {volumeData.percentChange}%
            </Text>
          </XStack>
        )}
        <Text color="$amber11" fontSize="$3" fontWeight="600">
          vs last week
        </Text>
      </XStack>
    </StatsSummaryCard>
  )
}

/**
 * Horizontal stacking bar showing category distribution
 */
function StackingBar({
  categories,
  total,
}: {
  categories: Array<{ name: string; label: string; value: number; percentage: number; color: string }>
  total: number
}) {
  if (total === 0) return null

  // Filter out categories with 0 value
  const nonZeroCategories = categories.filter((c) => c.value > 0)

  return (
    <YStack gap="$2.5">
      {/* Bar */}
      <XStack height={16} br="$3" overflow="hidden" bg="rgba(255,255,255,0.4)">
        {nonZeroCategories.map((category, index) => (
          <View
            key={category.name}
            flex={category.percentage}
            bg={CATEGORY_COLORS[category.name] || '$gray6'}
            borderTopLeftRadius={index === 0 ? '$3' : 0}
            borderBottomLeftRadius={index === 0 ? '$3' : 0}
            borderTopRightRadius={index === nonZeroCategories.length - 1 ? '$3' : 0}
            borderBottomRightRadius={index === nonZeroCategories.length - 1 ? '$3' : 0}
          />
        ))}
      </XStack>

      {/* Legend */}
      <XStack flexWrap="wrap" gap="$3">
        {nonZeroCategories.map((category) => (
          <XStack key={category.name} alignItems="center" gap="$1.5">
            <View
              width={10}
              height={10}
              br="$2"
              bg={CATEGORY_COLORS[category.name] || '$gray6'}
            />
            <Text fontSize="$2" fontWeight="600" color="$amber12">
              {category.label} {category.percentage}%
            </Text>
          </XStack>
        ))}
      </XStack>
    </YStack>
  )
}

export default observer(VolumeSummaryCard)
