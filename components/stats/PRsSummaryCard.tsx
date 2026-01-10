import { useRouter } from 'expo-router'
import { observer } from '@legendapp/state/react'
import { Text } from 'tamagui'
import { Trophy } from '@tamagui/lucide-icons'

import { store$ } from '@/lib/legend-state/store'
import { StatsSummaryCard, StatsSummaryCardVariant, StatCellGrid } from '@/components/ui'

interface PRsSummaryCardProps {
  variant?: StatsSummaryCardVariant
}

/**
 * PRsSummaryCard - Compact 2x2 grid showing recent personal records
 * Taps to navigate to full PRs detail page
 */
function PRsSummaryCard({ variant = 'glass' }: PRsSummaryCardProps) {
  const router = useRouter()
  const prs = store$.getUserPRs(4)

  // Transform PRs to StatCellGrid format
  const prItems = prs.map((pr: any) => ({
    id: pr.id,
    icon: pr.exercise?.icon || '💪',
    title: pr.exercise?.name || 'Exercise',
    value: pr.best_value,
    change: pr.last_value && pr.best_value > pr.last_value
      ? pr.best_value - pr.last_value
      : undefined,
  }))

  return (
    <StatsSummaryCard
      colorScheme="coral"
      variant={variant}
      headerIcon={<Trophy color="white" size={20} />}
      title="PERSONAL RECORDS"
      headerRight={
        prs.length > 0 ? (
          <Text color="$coral11" fontSize="$4" fontWeight="800">
            {prs.length} PRs
          </Text>
        ) : undefined
      }
      hasData={prs.length > 0}
      emptyState={{
        icon: '🏆',
        title: 'No PRs yet',
        subtitle: 'Complete tags to set records!',
      }}
      onPress={() => router.push('/(auth)/stats/prs' as any)}
      accessibilityLabel="Personal records summary. Tap to view all"
    >
      <StatCellGrid items={prItems} colorScheme="coral" />
    </StatsSummaryCard>
  )
}

export default observer(PRsSummaryCard)
