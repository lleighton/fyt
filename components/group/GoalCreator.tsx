import { useState } from 'react'
import { Alert, ActivityIndicator } from 'react-native'
import { YStack, XStack, Text, Card, Button, Input, Switch, ScrollView } from 'tamagui'
import { Target, Calendar, Hash, Clock, Check } from '@tamagui/lucide-icons'
import { observer } from '@legendapp/state/react'

import { supabase } from '@/lib/supabase'
import { store$ } from '@/lib/legend-state/store'
import type { Database } from '@/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

type GoalType = 'exercise' | 'category'
type PeriodType = 'week' | 'month' | 'custom'
type CategoryKey = 'upper_body' | 'core' | 'lower_body' | 'full_body' | 'all'

interface GoalCreatorProps {
  groupId: string
  onSuccess: () => void
  onCancel: () => void
}

const CATEGORIES: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: 'all', label: 'All Exercises', emoji: '🎯' },
  { key: 'upper_body', label: 'Upper Body', emoji: '💪' },
  { key: 'core', label: 'Core', emoji: '🎯' },
  { key: 'lower_body', label: 'Lower Body', emoji: '🦵' },
  { key: 'full_body', label: 'Full Body', emoji: '🔥' },
]

const PERIOD_OPTIONS: { key: PeriodType; label: string; description: string }[] = [
  { key: 'week', label: 'This Week', description: 'Ends Sunday midnight' },
  { key: 'month', label: 'This Month', description: 'Ends last day of month' },
  { key: 'custom', label: 'Custom', description: 'Set your own end date' },
]

/**
 * Goal Creator Component
 *
 * Form for creating group goals with:
 * - Exercise or category selection
 * - Target value input
 * - Time period selection
 * - Variant inclusion toggle
 */
function GoalCreatorComponent({ groupId, onSuccess, onCancel }: GoalCreatorProps) {
  // Form state
  const [goalType, setGoalType] = useState<GoalType>('exercise')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all')
  const [title, setTitle] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [periodType, setPeriodType] = useState<PeriodType>('week')
  const [includeVariants, setIncludeVariants] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Get exercises from store
  const exercisesData = store$.exercises.get()
  const exercises: Exercise[] = exercisesData ? Object.values(exercisesData) : []

  // Filter to parent exercises only (not variants)
  const parentExercises = exercises.filter((e) => {
    const variantInfo = store$.getExerciseVariantInfo(e.id)
    return !variantInfo.isVariant
  })

  // Calculate dates based on period
  const getDates = (): { starts_at: string; ends_at: string } => {
    const now = new Date()
    let starts_at = new Date()
    let ends_at = new Date()

    if (periodType === 'week') {
      // Start now, end Sunday 23:59:59
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7
      ends_at.setDate(now.getDate() + daysUntilSunday)
      ends_at.setHours(23, 59, 59, 999)
    } else if (periodType === 'month') {
      // Start now, end last day of month 23:59:59
      ends_at = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else {
      // Custom: default to 2 weeks from now
      ends_at.setDate(now.getDate() + 14)
      ends_at.setHours(23, 59, 59, 999)
    }

    return {
      starts_at: starts_at.toISOString(),
      ends_at: ends_at.toISOString(),
    }
  }

  // Generate default title
  const getDefaultTitle = () => {
    const target = parseInt(targetValue, 10) || 0
    if (goalType === 'exercise' && selectedExercise) {
      return `${target} ${selectedExercise.name}`
    }
    if (goalType === 'category') {
      const cat = CATEGORIES.find((c) => c.key === selectedCategory)
      return `${target} ${cat?.label || 'exercises'}`
    }
    return ''
  }

  // Handle submit
  const handleSubmit = async () => {
    const target = parseInt(targetValue, 10)
    if (!target || target <= 0) {
      Alert.alert('Error', 'Please enter a valid target value')
      return
    }

    if (goalType === 'exercise' && !selectedExercise) {
      Alert.alert('Error', 'Please select an exercise')
      return
    }

    setSubmitting(true)

    try {
      const dates = getDates()
      const goalTitle = title.trim() || getDefaultTitle()

      const { error } = await (supabase.rpc as any)('create_group_goal', {
        p_group_id: groupId,
        p_exercise_id: goalType === 'exercise' ? selectedExercise?.id : null,
        p_category: goalType === 'category' ? selectedCategory : null,
        p_target_value: target,
        p_target_unit: selectedExercise?.type === 'time' ? 'seconds' : 'reps',
        p_period_type: periodType,
        p_starts_at: dates.starts_at,
        p_ends_at: dates.ends_at,
        p_title: goalTitle,
        p_description: null,
        p_include_variants: includeVariants,
      })

      if (error) throw error

      Alert.alert('Success', 'Goal created!', [
        { text: 'OK', onPress: onSuccess },
      ])
    } catch (err: any) {
      console.error('Error creating goal:', err)
      Alert.alert('Error', err.message || 'Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack gap="$4" pb="$4">
        {/* Goal Type Selection */}
        <YStack gap="$2">
          <Text fontWeight="700" fontSize="$4">Goal Type</Text>
          <XStack gap="$2">
            <Button
              flex={1}
              size="$4"
              bg={goalType === 'exercise' ? '$orange10' : '$gray3'}
              onPress={() => setGoalType('exercise')}
            >
              <Text color={goalType === 'exercise' ? 'white' : '$gray11'} fontWeight="600">
                Specific Exercise
              </Text>
            </Button>
            <Button
              flex={1}
              size="$4"
              bg={goalType === 'category' ? '$orange10' : '$gray3'}
              onPress={() => setGoalType('category')}
            >
              <Text color={goalType === 'category' ? 'white' : '$gray11'} fontWeight="600">
                Category
              </Text>
            </Button>
          </XStack>
        </YStack>

        {/* Exercise Selection */}
        {goalType === 'exercise' && (
          <YStack gap="$2">
            <Text fontWeight="700" fontSize="$4">Select Exercise</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
            >
              <XStack gap="$2" pr="$4">
                {parentExercises.slice(0, 10).map((exercise) => (
                  <Card
                    key={exercise.id}
                    bg={selectedExercise?.id === exercise.id ? '$orange2' : '$gray2'}
                    p="$3"
                    br="$4"
                    borderWidth={selectedExercise?.id === exercise.id ? 2 : 0}
                    borderColor="$orange10"
                    pressStyle={{ scale: 0.98 }}
                    animation="quick"
                    onPress={() => setSelectedExercise(exercise)}
                    minWidth={100}
                  >
                    <YStack alignItems="center" gap="$2">
                      <Text fontSize={28}>{exercise.icon || '💪'}</Text>
                      <Text
                        fontSize="$2"
                        fontWeight="600"
                        textAlign="center"
                        numberOfLines={2}
                      >
                        {exercise.name}
                      </Text>
                      {selectedExercise?.id === exercise.id && (
                        <Check size={16} color="$orange10" />
                      )}
                    </YStack>
                  </Card>
                ))}
              </XStack>
            </ScrollView>
          </YStack>
        )}

        {/* Category Selection */}
        {goalType === 'category' && (
          <YStack gap="$2">
            <Text fontWeight="700" fontSize="$4">Select Category</Text>
            <YStack gap="$2">
              {CATEGORIES.map((cat) => (
                <Card
                  key={cat.key}
                  bg={selectedCategory === cat.key ? '$orange2' : '$gray2'}
                  p="$3"
                  br="$4"
                  borderWidth={selectedCategory === cat.key ? 2 : 0}
                  borderColor="$orange10"
                  pressStyle={{ scale: 0.98 }}
                  animation="quick"
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <XStack gap="$3" alignItems="center">
                    <Text fontSize={24}>{cat.emoji}</Text>
                    <Text fontWeight="600" flex={1}>{cat.label}</Text>
                    {selectedCategory === cat.key && (
                      <Check size={20} color="$orange10" />
                    )}
                  </XStack>
                </Card>
              ))}
            </YStack>
          </YStack>
        )}

        {/* Target Value */}
        <YStack gap="$2">
          <Text fontWeight="700" fontSize="$4">Target</Text>
          <XStack gap="$3" alignItems="center">
            <Input
              flex={1}
              size="$5"
              keyboardType="number-pad"
              value={targetValue}
              onChangeText={setTargetValue}
              placeholder="1000"
              textAlign="center"
              fontSize={24}
              fontWeight="700"
            />
            <YStack bg="$gray3" px="$4" py="$3" br="$4">
              <Text color="$gray11" fontWeight="600">
                {selectedExercise?.type === 'time' ? 'seconds' : 'reps'}
              </Text>
            </YStack>
          </XStack>
          {/* Quick value buttons */}
          <XStack gap="$2" flexWrap="wrap">
            {[100, 500, 1000, 5000, 10000].map((val) => (
              <Button
                key={val}
                size="$3"
                bg={targetValue === val.toString() ? '$orange10' : '$gray3'}
                onPress={() => setTargetValue(val.toString())}
              >
                <Text
                  color={targetValue === val.toString() ? 'white' : '$gray11'}
                  fontWeight="600"
                >
                  {val >= 1000 ? `${val / 1000}k` : val}
                </Text>
              </Button>
            ))}
          </XStack>
        </YStack>

        {/* Time Period */}
        <YStack gap="$2">
          <Text fontWeight="700" fontSize="$4">Time Period</Text>
          <YStack gap="$2">
            {PERIOD_OPTIONS.map((period) => (
              <Card
                key={period.key}
                bg={periodType === period.key ? '$orange2' : '$gray2'}
                p="$3"
                br="$4"
                borderWidth={periodType === period.key ? 2 : 0}
                borderColor="$orange10"
                pressStyle={{ scale: 0.98 }}
                animation="quick"
                onPress={() => setPeriodType(period.key)}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontWeight="600">{period.label}</Text>
                    <Text color="$gray10" fontSize="$2">{period.description}</Text>
                  </YStack>
                  {periodType === period.key && (
                    <Check size={20} color="$orange10" />
                  )}
                </XStack>
              </Card>
            ))}
          </YStack>
        </YStack>

        {/* Include Variants Toggle */}
        {goalType === 'exercise' && selectedExercise && (
          <Card bg="$gray2" p="$4" br="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text fontWeight="600">Include Variants</Text>
                <Text color="$gray10" fontSize="$3">
                  Count scaled exercises (e.g., Knee Pushups toward Pushups)
                </Text>
              </YStack>
              <Switch
                size="$4"
                checked={includeVariants}
                onCheckedChange={setIncludeVariants}
                backgroundColor={includeVariants ? '$orange6' : '$gray5'}
              >
                <Switch.Thumb animation="quick" backgroundColor="white" />
              </Switch>
            </XStack>
          </Card>
        )}

        {/* Custom Title */}
        <YStack gap="$2">
          <Text fontWeight="700" fontSize="$4">Title (optional)</Text>
          <Input
            size="$4"
            value={title}
            onChangeText={setTitle}
            placeholder={getDefaultTitle() || 'e.g., "Team Pushup Challenge"'}
          />
        </YStack>

        {/* Action Buttons */}
        <XStack gap="$3" pt="$4">
          <Button
            flex={1}
            size="$5"
            bg="$gray3"
            onPress={onCancel}
            disabled={submitting}
          >
            <Text fontWeight="600">Cancel</Text>
          </Button>
          <Button
            flex={1}
            size="$5"
            bg="$orange10"
            onPress={handleSubmit}
            disabled={submitting || !targetValue}
            opacity={submitting || !targetValue ? 0.5 : 1}
            icon={submitting ? <ActivityIndicator color="white" /> : <Target size={20} color="white" />}
          >
            <Text color="white" fontWeight="600">
              {submitting ? 'Creating...' : 'Create Goal'}
            </Text>
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  )
}

export const GoalCreator = observer(GoalCreatorComponent)
