import { Card, XStack, YStack, Text } from 'tamagui'
import { CheckCircle } from '@tamagui/lucide-icons'

export type ChallengeType = 'amrap' | 'max_effort' | 'for_time' | 'workout'

interface ChallengeTypeCardProps {
  icon: React.ReactNode
  type: ChallengeType
  title: string
  description: string
  example?: string
  selected: boolean
  onSelect: () => void
}

// Type-specific color schemes
const TYPE_COLORS: Record<ChallengeType, { bg: string; border: string }> = {
  amrap: { bg: '$blue2', border: '$blue10' },
  max_effort: { bg: '$orange2', border: '$orange10' },
  for_time: { bg: '$green2', border: '$green10' },
  workout: { bg: '$orange2', border: '$orange10' },
}

/**
 * Challenge type selection card
 *
 * Displays a selectable card for different challenge types with
 * color-coded styling based on the type.
 */
export function ChallengeTypeCard({
  icon,
  type,
  title,
  description,
  example,
  selected,
  onSelect,
}: ChallengeTypeCardProps) {
  const colors = TYPE_COLORS[type]

  return (
    <Card
      bg={selected ? colors.bg : '$gray2'}
      p="$5"
      br="$6"
      borderWidth={selected ? 2 : 0}
      borderColor={selected ? colors.border : 'transparent'}
      shadowColor={selected ? '$shadowColor' : 'transparent'}
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={selected ? 0.15 : 0}
      shadowRadius={selected ? 8 : 0}
      elevation={selected ? 2 : 0}
      pressStyle={{ scale: 0.97 }}
      animation="quick"
      onPress={onSelect}
    >
      <XStack gap="$4" alignItems="flex-start">
        <YStack pt="$0.5">{icon}</YStack>
        <YStack flex={1} gap="$2">
          <Text fontWeight="700" fontSize="$6" color="$gray12">
            {title}
          </Text>
          <Text color="$gray11" fontSize="$3" lineHeight="$3">
            {description}
          </Text>
          {example && (
            <Text color="$gray10" fontSize="$2" fontStyle="italic" mt="$1">
              e.g. {example}
            </Text>
          )}
        </YStack>
        {selected && <CheckCircle size={28} color={colors.border} />}
      </XStack>
    </Card>
  )
}
