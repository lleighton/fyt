import { Card, XStack, YStack, Text, View } from 'tamagui'
import { Clock, Hash, ArrowRight, CheckCircle } from '@tamagui/lucide-icons'
import type { Database } from '@/types/database.types'
import { IconBox } from '@/components/ui'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface ExerciseCardProps {
  exercise: Exercise
  selected?: boolean
  onSelect: () => void
  /** Variant info - if this exercise is a scaled variant of another */
  variantInfo?: {
    isVariant: boolean
    parentExercise: Exercise | null
    scalingFactor: number
  }
  /** Whether to show compact variant indicator (for lists) */
  compact?: boolean
}

// Difficulty color/label helpers
const DIFFICULTY_CONFIG: Record<number, { color: string; label: string }> = {
  1: { color: '$green10', label: 'Easy' },
  2: { color: '$orange10', label: 'Medium' },
  3: { color: '$red10', label: 'Hard' },
}

/**
 * Exercise selection card component
 * Shows exercise name, icon, category, type (reps/time), and variant scaling if applicable
 */
export function ExerciseCard({
  exercise,
  selected,
  onSelect,
  variantInfo,
  compact = false,
}: ExerciseCardProps) {
  const isTimeBased = exercise.type === 'time'
  const isVariant = variantInfo?.isVariant && variantInfo?.parentExercise
  const difficulty = DIFFICULTY_CONFIG[exercise.difficulty] || { color: '$gray10', label: '' }

  const formatScaling = (factor: number) => `${Math.round(factor * 100)}%`

  return (
    <Card
      bg={selected ? '$orange2' : '$gray2'}
      p="$3"
      br="$4"
      borderWidth={selected ? 2 : 0}
      borderColor={selected ? '$orange10' : 'transparent'}
      pressStyle={{ scale: 0.98, bg: selected ? '$orange3' : '$gray3' }}
      animation="quick"
      onPress={onSelect}
    >
      <XStack gap="$3" alignItems="center">
        {/* Icon with optional scaling badge */}
        <View position="relative">
          <IconBox
            icon={exercise.icon || '💪'}
            colorScheme={selected ? 'orange' : 'gray'}
            size="md"
          />
          {isVariant && !compact && (
            <View
              position="absolute"
              bottom={-4}
              right={-4}
              bg="$orange10"
              px="$1.5"
              py="$0.5"
              br="$2"
            >
              <Text fontSize={10} color="white" fontWeight="700">
                {formatScaling(variantInfo!.scalingFactor)}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <YStack flex={1} gap="$1">
          <XStack gap="$2" alignItems="center">
            <Text fontWeight="700" fontSize="$4">
              {exercise.name}
            </Text>
            {isVariant && compact && (
              <XStack bg="$orange6" px="$1.5" py="$0.5" br="$2">
                <Text fontSize={11} color="white" fontWeight="600">
                  {formatScaling(variantInfo!.scalingFactor)}
                </Text>
              </XStack>
            )}
          </XStack>

          {isVariant && !compact && (
            <XStack gap="$1" alignItems="center">
              <ArrowRight size={12} color="$orange10" />
              <Text fontSize="$2" color="$orange10" fontWeight="500">
                Counts toward {variantInfo!.parentExercise!.name}
              </Text>
            </XStack>
          )}

          <XStack gap="$2" alignItems="center">
            <XStack gap="$1" alignItems="center">
              {isTimeBased ? <Clock size={14} color="$gray10" /> : <Hash size={14} color="$gray10" />}
              <Text fontSize="$3" color="$gray10">
                {isTimeBased ? 'Time' : 'Reps'}
              </Text>
            </XStack>
            <Text color="$gray8">•</Text>
            <Text fontSize="$3" color={difficulty.color}>
              {difficulty.label}
            </Text>
          </XStack>
        </YStack>

        {selected && <CheckCircle size={24} color="$orange10" />}
      </XStack>
    </Card>
  )
}
