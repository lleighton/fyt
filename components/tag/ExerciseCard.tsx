import { Card, XStack, YStack, Text } from 'tamagui'
import { Clock, Hash, ArrowRight } from '@tamagui/lucide-icons'
import type { Database } from '@/types/database.types'

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

  // Get difficulty color
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return '$green10'
      case 2:
        return '$orange10'
      case 3:
        return '$red10'
      default:
        return '$gray10'
    }
  }

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'Easy'
      case 2:
        return 'Medium'
      case 3:
        return 'Hard'
      default:
        return ''
    }
  }

  // Format scaling factor as percentage
  const formatScaling = (factor: number) => {
    return `${Math.round(factor * 100)}%`
  }

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
        {/* Icon */}
        <YStack
          width={48}
          height={48}
          br="$4"
          bg={selected ? '$orange4' : '$gray4'}
          justifyContent="center"
          alignItems="center"
          position="relative"
        >
          <Text fontSize={24}>{exercise.icon || '💪'}</Text>

          {/* Scaling badge overlay */}
          {isVariant && !compact && (
            <YStack
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
            </YStack>
          )}
        </YStack>

        {/* Content */}
        <YStack flex={1} gap="$1">
          <XStack gap="$2" alignItems="center">
            <Text fontWeight="700" fontSize="$4">
              {exercise.name}
            </Text>

            {/* Compact scaling badge - use darker bg for better contrast */}
            {isVariant && compact && (
              <XStack bg="$orange6" px="$1.5" py="$0.5" br="$2">
                <Text fontSize={11} color="white" fontWeight="600">
                  {formatScaling(variantInfo!.scalingFactor)}
                </Text>
              </XStack>
            )}
          </XStack>

          {/* Variant info line */}
          {isVariant && !compact && (
            <XStack gap="$1" alignItems="center">
              <ArrowRight size={12} color="$orange10" />
              <Text fontSize="$2" color="$orange10" fontWeight="500">
                Counts toward {variantInfo!.parentExercise!.name}
              </Text>
            </XStack>
          )}

          <XStack gap="$2" alignItems="center">
            {/* Type indicator */}
            <XStack gap="$1" alignItems="center">
              {isTimeBased ? (
                <Clock size={14} color="$gray10" />
              ) : (
                <Hash size={14} color="$gray10" />
              )}
              <Text fontSize="$3" color="$gray10">
                {isTimeBased ? 'Time' : 'Reps'}
              </Text>
            </XStack>

            <Text color="$gray8">•</Text>

            {/* Difficulty */}
            <Text fontSize="$3" color={getDifficultyColor(exercise.difficulty)}>
              {getDifficultyLabel(exercise.difficulty)}
            </Text>
          </XStack>
        </YStack>

        {/* Selected indicator */}
        {selected && (
          <YStack
            width={24}
            height={24}
            br="$10"
            bg="$orange10"
            justifyContent="center"
            alignItems="center"
          >
            <Text color="white" fontSize="$2" fontWeight="700">
              ✓
            </Text>
          </YStack>
        )}
      </XStack>
    </Card>
  )
}
