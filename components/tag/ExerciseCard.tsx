import { Card, XStack, YStack, Text } from 'tamagui'
import { Clock, Hash } from '@tamagui/lucide-icons'
import type { Database } from '@/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface ExerciseCardProps {
  exercise: Exercise
  selected?: boolean
  onSelect: () => void
}

/**
 * Exercise selection card component
 * Shows exercise name, icon, category, and type (reps/time)
 */
export function ExerciseCard({ exercise, selected, onSelect }: ExerciseCardProps) {
  const isTimeBased = exercise.type === 'time'

  // Get category display name
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'upper_body':
        return 'Upper Body'
      case 'lower_body':
        return 'Lower Body'
      case 'core':
        return 'Core'
      case 'full_body':
        return 'Full Body'
      default:
        return category
    }
  }

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

  return (
    <Card
      bg={selected ? '$blue2' : '$gray2'}
      p="$3"
      br="$4"
      borderWidth={selected ? 2 : 0}
      borderColor={selected ? '$blue10' : 'transparent'}
      pressStyle={{ scale: 0.98, bg: selected ? '$blue3' : '$gray3' }}
      animation="quick"
      onPress={onSelect}
    >
      <XStack gap="$3" alignItems="center">
        {/* Icon */}
        <YStack
          width={48}
          height={48}
          br="$4"
          bg={selected ? '$blue4' : '$gray4'}
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={24}>{exercise.icon || '💪'}</Text>
        </YStack>

        {/* Content */}
        <YStack flex={1} gap="$1">
          <Text fontWeight="700" fontSize="$4">
            {exercise.name}
          </Text>
          <XStack gap="$2" alignItems="center">
            {/* Type indicator */}
            <XStack gap="$1" alignItems="center">
              {isTimeBased ? (
                <Clock size={12} color="$gray10" />
              ) : (
                <Hash size={12} color="$gray10" />
              )}
              <Text fontSize="$2" color="$gray10">
                {isTimeBased ? 'Time' : 'Reps'}
              </Text>
            </XStack>

            <Text color="$gray8">•</Text>

            {/* Difficulty */}
            <Text fontSize="$2" color={getDifficultyColor(exercise.difficulty)}>
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
            bg="$blue10"
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
