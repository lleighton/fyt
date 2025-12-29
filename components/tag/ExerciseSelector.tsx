import { useState, useMemo } from 'react'
import { YStack, XStack, Text, Input, ScrollView } from 'tamagui'
import { Search } from '@tamagui/lucide-icons'
import { observer } from '@legendapp/state/react'

import { store$ } from '@/lib/legend-state/store'
import { ExerciseCard } from './ExerciseCard'
import type { Database } from '@/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface ExerciseSelectorProps {
  selectedExercise: Exercise | null
  onSelectExercise: (exercise: Exercise) => void
}

type CategoryKey = 'upper_body' | 'core' | 'lower_body' | 'full_body'

const CATEGORIES: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: 'upper_body', label: 'Upper Body', emoji: '💪' },
  { key: 'core', label: 'Core', emoji: '🎯' },
  { key: 'lower_body', label: 'Lower Body', emoji: '🦵' },
  { key: 'full_body', label: 'Full Body', emoji: '🔥' },
]

/**
 * Exercise selector component with categories and search
 */
function ExerciseSelectorComponent({
  selectedExercise,
  onSelectExercise,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)

  // Get exercises from store
  const exercisesData = store$.exercises.get()
  const exercises: Exercise[] = exercisesData ? Object.values(exercisesData) : []

  // Filter exercises by search and category
  const filteredExercises = useMemo(() => {
    return exercises
      .filter((ex) => {
        const matchesSearch =
          !searchQuery ||
          ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ex.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || ex.category === selectedCategory
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => a.display_order - b.display_order)
  }, [exercises, searchQuery, selectedCategory])

  // Group exercises by category for display
  const exercisesByCategory = useMemo(() => {
    const grouped: Record<CategoryKey, Exercise[]> = {
      upper_body: [],
      core: [],
      lower_body: [],
      full_body: [],
    }

    filteredExercises.forEach((ex) => {
      const cat = ex.category as CategoryKey
      if (grouped[cat]) {
        grouped[cat].push(ex)
      }
    })

    return grouped
  }, [filteredExercises])

  return (
    <YStack flex={1} gap="$4">
      {/* Search Input */}
      <XStack
        bg="$gray3"
        br="$4"
        px="$3"
        py="$2"
        gap="$2"
        alignItems="center"
      >
        <Search size={20} color="$gray10" />
        <Input
          flex={1}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          bg="transparent"
          borderWidth={0}
          size="$4"
          placeholderTextColor="$gray10"
        />
      </XStack>

      {/* Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center' }}
        style={{ flexGrow: 0 }}
      >
        <XStack gap="$2" pr="$4" alignItems="center">
          {/* All categories option */}
          <CategoryPill
            label="All"
            emoji="📋"
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
          />
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.key}
              label={cat.label}
              emoji={cat.emoji}
              selected={selectedCategory === cat.key}
              onPress={() =>
                setSelectedCategory(selectedCategory === cat.key ? null : cat.key)
              }
            />
          ))}
        </XStack>
      </ScrollView>

      {/* Exercise List */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack gap="$4" pb="$4">
          {selectedCategory ? (
            // Show only selected category
            <YStack gap="$2">
              {filteredExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  selected={selectedExercise?.id === exercise.id}
                  onSelect={() => onSelectExercise(exercise)}
                />
              ))}
              {filteredExercises.length === 0 && (
                <Text color="$gray10" textAlign="center" py="$4">
                  No exercises found
                </Text>
              )}
            </YStack>
          ) : (
            // Show all categories
            CATEGORIES.map((cat) => {
              const categoryExercises = exercisesByCategory[cat.key]
              if (categoryExercises.length === 0) return null

              return (
                <YStack key={cat.key} gap="$2">
                  <XStack gap="$2" alignItems="center" px="$1">
                    <Text fontSize={18}>{cat.emoji}</Text>
                    <Text fontWeight="700" fontSize="$4" color="$gray12">
                      {cat.label}
                    </Text>
                    <Text fontSize="$2" color="$gray10">
                      ({categoryExercises.length})
                    </Text>
                  </XStack>
                  {categoryExercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      selected={selectedExercise?.id === exercise.id}
                      onSelect={() => onSelectExercise(exercise)}
                    />
                  ))}
                </YStack>
              )
            })
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

/**
 * Category filter pill component
 */
function CategoryPill({
  label,
  emoji,
  selected,
  onPress,
}: {
  label: string
  emoji: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <XStack
      bg={selected ? '$blue10' : '$gray3'}
      px="$3"
      height={36}
      br="$10"
      gap="$1.5"
      alignItems="center"
      justifyContent="center"
      pressStyle={{ scale: 0.97, opacity: 0.9 }}
      animation="quick"
      onPress={onPress}
    >
      <Text fontSize={14}>{emoji}</Text>
      <Text
        fontSize="$3"
        fontWeight="600"
        color={selected ? 'white' : '$gray11'}
      >
        {label}
      </Text>
    </XStack>
  )
}

export const ExerciseSelector = observer(ExerciseSelectorComponent)
