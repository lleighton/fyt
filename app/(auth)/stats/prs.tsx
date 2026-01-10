import { useState } from 'react'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, ScrollView, View, Card } from 'tamagui'
import { Trophy, TrendingUp } from '@tamagui/lucide-icons'
import { SafeArea, ScreenHeader } from '@/components/ui'

import { store$ } from '@/lib/legend-state/store'

// Category filter options
const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'upper_body', label: 'Upper' },
  { key: 'lower_body', label: 'Lower' },
  { key: 'core', label: 'Core' },
  { key: 'full_body', label: 'Full' },
]

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  upper_body: '$coral4',
  lower_body: '$green4',
  core: '$amber4',
  full_body: '$purple4',
}

/**
 * PRs Detail Page - "The Vault"
 * Full showcase of all personal records
 */
function PRsDetailPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const prs = store$.getPRsByCategory(selectedCategory)

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        <ScreenHeader
          subtitle="Personal Records"
          title="THE VAULT"
          titleIcon={<Trophy size={20} color="$coral10" />}
        />

        {/* Category Filter */}
        <XStack px="$4" py="$2" gap="$2">
          {CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              flex={1}
              py="$2"
              br="$3"
              bg={selectedCategory === cat.key ? '$coral10' : '$gray3'}
              pressStyle={{ opacity: 0.8 }}
              onPress={() => setSelectedCategory(cat.key)}
              accessible={true}
              accessibilityLabel={`Filter by ${cat.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategory === cat.key }}
            >
              <Text
                textAlign="center"
                fontSize="$2"
                fontWeight="600"
                color={selectedCategory === cat.key ? 'white' : '$gray11'}
              >
                {cat.label}
              </Text>
            </View>
          ))}
        </XStack>

        {/* PRs Grid */}
        <ScrollView flex={1} px="$4" py="$3">
          {prs.length > 0 ? (
            <YStack gap="$3">
              {/* Grid - 2 columns */}
              <XStack flexWrap="wrap" gap="$3">
                {prs.map((pr) => (
                  <PRCard key={pr.id} pr={pr} />
                ))}
              </XStack>
            </YStack>
          ) : (
            <YStack flex={1} py="$10" alignItems="center" gap="$3">
              <Text fontSize={48}>🏆</Text>
              <Text
                fontFamily="$display"
                fontSize={24}
                color="$gray12"
                textAlign="center"
              >
                NO PRS YET
              </Text>
              <Text color="$gray10" fontSize="$3" textAlign="center" maxWidth={280}>
                Complete tags to set personal records and fill your vault!
              </Text>
            </YStack>
          )}
        </ScrollView>
      </YStack>
    </SafeArea>
  )
}

/**
 * Individual PR card component
 */
function PRCard({ pr }: { pr: any }) {
  const exercise = pr?.exercise
  const category = exercise?.category || 'full_body'
  const bgColor = CATEGORY_COLORS[category] || '$gray4'

  // Calculate improvement from last attempt
  const improvement = pr?.last_value && pr?.best_value !== pr?.last_value
    ? pr.best_value - pr.last_value
    : null

  // Format date
  const bestDate = pr?.best_date
    ? new Date(pr.best_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <Card
      width="48%"
      bg="$gray2"
      br="$4"
      borderWidth={1}
      borderColor="$gray4"
      overflow="hidden"
    >
      {/* Icon header with category color */}
      <View bg={bgColor} p="$3" alignItems="center">
        <Text fontSize={32}>{exercise?.icon || '💪'}</Text>
      </View>

      <YStack p="$3" gap="$2">
        {/* Exercise name */}
        <Text
          fontSize="$3"
          fontWeight="700"
          color="$gray12"
          numberOfLines={1}
        >
          {exercise?.name || 'Exercise'}
        </Text>

        {/* Best value */}
        <XStack alignItems="flex-end" gap="$1">
          <Text
            fontFamily="$mono"
            fontSize={36}
            fontWeight="700"
            color="$coral10"
            lineHeight={40}
          >
            {pr.best_value}
          </Text>
          <Text color="$gray10" fontSize="$2" pb="$1">
            {exercise?.type === 'time' ? 'sec' : 'reps'}
          </Text>
        </XStack>

        {/* Improvement badge */}
        {improvement !== null && (
          <XStack
            bg={improvement > 0 ? '$green3' : '$gray3'}
            px="$2"
            py="$1"
            br="$2"
            alignSelf="flex-start"
            alignItems="center"
            gap="$1"
          >
            <TrendingUp size={12} color={improvement > 0 ? '$green11' : '$gray10'} />
            <Text
              fontSize="$2"
              fontWeight="700"
              color={improvement > 0 ? '$green11' : '$gray10'}
            >
              {improvement > 0 ? '+' : ''}{improvement} from last
            </Text>
          </XStack>
        )}

        {/* Stats row */}
        <XStack justifyContent="space-between" pt="$1">
          <YStack>
            <Text color="$gray10" fontSize="$1">
              Total
            </Text>
            <Text fontWeight="600" fontSize="$2" color="$gray11">
              {pr.total_completions || 1}x
            </Text>
          </YStack>
          <YStack alignItems="flex-end">
            <Text color="$gray10" fontSize="$1">
              Set on
            </Text>
            <Text fontWeight="600" fontSize="$2" color="$gray11">
              {bestDate}
            </Text>
          </YStack>
        </XStack>
      </YStack>
    </Card>
  )
}

export default observer(PRsDetailPage)
