import { YStack, Text, View } from 'tamagui'
import { Flame } from '@tamagui/lucide-icons'

interface StreakBadgeProps {
  streak: number
}

/**
 * Visual badge showing streak status
 *
 * Changes appearance based on streak length:
 * - 0-6 days: Bronze
 * - 7-29 days: Silver
 * - 30-99 days: Gold
 * - 100+ days: Fire (animated)
 */
export function StreakBadge({ streak }: StreakBadgeProps) {
  const { color, bgColor, label } = getStreakTier(streak)

  return (
    <YStack
      alignItems="center"
      justifyContent="center"
      bg={bgColor}
      px="$3"
      py="$2"
      br="$4"
      animation={streak >= 100 ? 'celebration' : undefined}
    >
      <Flame color={color} size={20} />
      <Text fontSize="$1" fontWeight="700" color={color} mt="$1">
        {label}
      </Text>
    </YStack>
  )
}

function getStreakTier(streak: number): {
  color: string
  bgColor: string
  label: string
} {
  if (streak >= 100) {
    return {
      color: '$red10',
      bgColor: '$red4',
      label: '🔥 LEGEND',
    }
  }
  if (streak >= 30) {
    return {
      color: '$yellow10',
      bgColor: '$yellow4',
      label: '⭐ GOLD',
    }
  }
  if (streak >= 7) {
    return {
      color: '$gray11',
      bgColor: '$gray4',
      label: '🥈 SILVER',
    }
  }
  if (streak > 0) {
    return {
      color: '$orange10',
      bgColor: '$orange4',
      label: '🥉 BRONZE',
    }
  }
  return {
    color: '$gray9',
    bgColor: '$gray3',
    label: 'START',
  }
}

export default StreakBadge
