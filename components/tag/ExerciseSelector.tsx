import { useState, useMemo } from 'react'
import { YStack, XStack, Text, Input, ScrollView } from 'tamagui'
import { Search, ChevronDown, ChevronRight } from '@tamagui/lucide-icons'
import { observer } from '@legendapp/state/react'

import { store$ } from '@/lib/legend-state/store'
import { ExerciseCard } from './ExerciseCard'
import type { Database } from '@/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface ExerciseSelectorProps {
  selectedExercise: Exercise | null
  onSelectExercise: (exercise: Exercise) => void
  /** Show scaled variants under parent exercises */
  showVariants?: boolean
}

type CategoryKey = 'upper_body' | 'core' | 'lower_body' | 'full_body'

const CATEGORIES: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: 'upper_body', label: 'Upper Body', emoji: '💪' },
  { key: 'core', label: 'Core', emoji: '🎯' },
  { key: 'lower_body', label: 'Lower Body', emoji: '🦵' },
  { key: 'full_body', label: 'Full Body', emoji: '🔥' },
]

interface ExerciseWithVariants {
  exercise: Exercise
  isVariant: boolean
  parentId: string | null
  scalingFactor: number
  variants: Array<{ exercise: Exercise; scalingFactor: number }>
}

/**
 * Exercise selector component with categories, search, and variant support
 */
function ExerciseSelectorComponent({
  selectedExercise,
  onSelectExercise,
  showVariants = true,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())

  // Get exercises and variants from store
  const exercisesData = store$.exercises.get()
  const exercises: Exercise[] = exercisesData ? Object.values(exercisesData) : []

  // Get variant info for all exercises
  const exercisesWithVariantInfo = useMemo(() => {
    return exercises.map((exercise) => ({
      exercise,
      variantInfo: store$.getExerciseVariantInfo(exercise.id),
      variants: store$.getExerciseVariants(exercise.id),
    }))
  }, [exercises])

  // Filter and organize exercises
  const { parentExercises, variantExercises } = useMemo(() => {
    const parents: typeof exercisesWithVariantInfo = []
    const variants: typeof exercisesWithVariantInfo = []

    exercisesWithVariantInfo.forEach((item) => {
      const matchesSearch =
        !searchQuery ||
        item.exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.exercise.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || item.exercise.category === selectedCategory

      if (!matchesSearch || !matchesCategory) return

      if (item.variantInfo.isVariant && showVariants) {
        variants.push(item)
      } else {
        parents.push(item)
      }
    })

    return {
      parentExercises: parents.sort((a, b) => a.exercise.display_order - b.exercise.display_order),
      variantExercises: variants,
    }
  }, [exercisesWithVariantInfo, searchQuery, selectedCategory, showVariants])

  // Group parent exercises by category
  const exercisesByCategory = useMemo(() => {
    const grouped: Record<CategoryKey, typeof parentExercises> = {
      upper_body: [],
      core: [],
      lower_body: [],
      full_body: [],
    }

    parentExercises.forEach((item) => {
      const cat = item.exercise.category as CategoryKey
      if (grouped[cat]) {
        grouped[cat].push(item)
      }
    })

    return grouped
  }, [parentExercises])

  // Toggle variant expansion for a parent exercise
  const toggleExpanded = (exerciseId: string) => {
    const newExpanded = new Set(expandedParents)
    if (newExpanded.has(exerciseId)) {
      newExpanded.delete(exerciseId)
    } else {
      newExpanded.add(exerciseId)
    }
    setExpandedParents(newExpanded)
  }

  // Get variants for a parent exercise that match current filters
  const getMatchingVariants = (parentId: string) => {
    return variantExercises.filter((v) => v.variantInfo.parentExercise?.id === parentId)
  }

  // Render a single exercise with optional variants
  const renderExerciseWithVariants = (item: (typeof parentExercises)[0]) => {
    const variants = showVariants ? getMatchingVariants(item.exercise.id) : []
    const hasVariants = variants.length > 0
    const isExpanded = expandedParents.has(item.exercise.id)

    return (
      <YStack key={item.exercise.id} gap="$1">
        {/* Parent exercise card */}
        <XStack gap="$2" alignItems="center">
          {/* Expand/collapse button for variants */}
          {hasVariants && (
            <YStack
              width={24}
              height={24}
              justifyContent="center"
              alignItems="center"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => toggleExpanded(item.exercise.id)}
            >
              {isExpanded ? (
                <ChevronDown size={16} color="$gray10" />
              ) : (
                <ChevronRight size={16} color="$gray10" />
              )}
            </YStack>
          )}

          {/* Exercise card */}
          <YStack flex={1} ml={hasVariants ? 0 : '$6'}>
            <ExerciseCard
              exercise={item.exercise}
              selected={selectedExercise?.id === item.exercise.id}
              onSelect={() => onSelectExercise(item.exercise)}
            />
          </YStack>
        </XStack>

        {/* Variant exercises (collapsible) */}
        {hasVariants && isExpanded && (
          <YStack gap="$1" ml="$8" pl="$2" borderLeftWidth={2} borderLeftColor="$purple4">
            <Text fontSize="$2" color="$purple10" fontWeight="500" mb="$1">
              Easier variations:
            </Text>
            {variants.map((variant) => (
              <ExerciseCard
                key={variant.exercise.id}
                exercise={variant.exercise}
                selected={selectedExercise?.id === variant.exercise.id}
                onSelect={() => onSelectExercise(variant.exercise)}
                variantInfo={variant.variantInfo}
                compact
              />
            ))}
          </YStack>
        )}
      </YStack>
    )
  }

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
              {parentExercises
                .filter((item) => item.exercise.category === selectedCategory)
                .map(renderExerciseWithVariants)}
              {parentExercises.filter((item) => item.exercise.category === selectedCategory)
                .length === 0 && (
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
                  {categoryExercises.map(renderExerciseWithVariants)}
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
      bg={selected ? '$orange10' : '$gray3'}
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
