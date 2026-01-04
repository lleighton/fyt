import { useState } from 'react'
import { Alert } from 'react-native'
import {
  YStack,
  XStack,
  Text,
  H2,
  Button,
  Card,
  Input,
} from 'tamagui'
import {
  Plus,
  Trash2,
  CheckCircle,
} from '@tamagui/lucide-icons'

import type { ChallengeStep } from '@/types/database.types'

interface StepBuilderProps {
  steps: ChallengeStep[]
  onUpdateSteps: (steps: ChallengeStep[]) => void
}

/**
 * Step builder for multi-step workout challenges
 *
 * Allows users to add, remove, and configure exercises
 * with different types (reps, time, distance, strength)
 */
export function StepBuilder({ steps, onUpdateSteps }: StepBuilderProps) {
  const [newStep, setNewStep] = useState<Partial<ChallengeStep>>({
    exercise: '',
    type: 'strength',
    weight_unit: 'lbs',
  })

  const addStep = () => {
    if (!newStep.exercise) {
      Alert.alert('Error', 'Please enter an exercise name')
      return
    }

    // Validate strength type has required fields
    if (newStep.type === 'strength') {
      if (!newStep.target_sets || !newStep.target_reps) {
        Alert.alert('Error', 'Please enter sets and reps for strength exercises')
        return
      }
    }

    onUpdateSteps([
      ...steps,
      {
        exercise: newStep.exercise,
        type: newStep.type as ChallengeStep['type'],
        target_value: newStep.target_value,
        target_unit: newStep.target_unit,
        target_sets: newStep.target_sets,
        target_reps: newStep.target_reps,
        target_weight: newStep.target_weight,
        weight_unit: newStep.weight_unit || 'lbs',
      },
    ])

    // Reset form
    setNewStep({ exercise: '', type: 'strength', weight_unit: 'lbs' })
  }

  const removeStep = (index: number) => {
    onUpdateSteps(steps.filter((_, i) => i !== index))
  }

  return (
    <YStack gap="$3">
      <YStack gap="$2">
        <H2 fontSize="$6">Build Your Workout</H2>

        {/* Progress indicator */}
        <XStack gap="$2" alignItems="center">
          <Text color="$gray10" fontSize="$3">
            {steps.length < 2 ? (
              <>
                Add at least{' '}
                <Text fontWeight="700" color="$orange10">
                  2 exercises
                </Text>{' '}
                to continue
              </>
            ) : (
              <>
                <Text fontWeight="700" color="$green10">
                  ✓
                </Text>{' '}
                {steps.length} exercises added
              </>
            )}
          </Text>
        </XStack>
      </YStack>

      {/* Existing Steps List */}
      {steps.length > 0 && (
        <YStack gap="$3">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              step={step}
              index={index}
              onRemove={() => removeStep(index)}
            />
          ))}
        </YStack>
      )}

      {/* Add New Step Form */}
      <AddStepForm
        newStep={newStep}
        onUpdateNewStep={setNewStep}
        onAdd={addStep}
      />

      {/* Success message when ready to continue */}
      {steps.length >= 2 && (
        <Card
          bg="$green2"
          p="$5"
          br="$6"
          borderWidth={0}
          shadowColor="$green10"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.15}
          shadowRadius={8}
          elevation={2}
        >
          <YStack gap="$3" alignItems="center">
            <XStack gap="$3" alignItems="center">
              <CheckCircle size={28} color="$green10" />
              <Text fontSize="$6" fontWeight="700" color="$green11">
                Workout Ready!
              </Text>
            </XStack>
            <Text fontSize="$4" color="$green11" textAlign="center" fontWeight="600">
              {steps.length} exercises added. Scroll down and tap "Continue" to proceed.
            </Text>
          </YStack>
        </Card>
      )}

      {/* Helpful tip when user hasn't added enough steps */}
      {steps.length === 1 && (
        <Card
          bg="$orange2"
          p="$4"
          br="$5"
          borderWidth={0}
          shadowColor="$orange10"
          shadowOffset={{ width: 0, height: 1 }}
          shadowOpacity={0.1}
          shadowRadius={4}
          elevation={1}
        >
          {/* WCAG: $orange12 provides 5.40:1 contrast on $orange2 */}
          <Text fontSize="$4" color="$orange12" textAlign="center" fontWeight="600">
            Add at least one more exercise to continue
          </Text>
        </Card>
      )}
    </YStack>
  )
}

/**
 * Individual step card showing exercise details
 */
function StepCard({
  step,
  index,
  onRemove,
}: {
  step: ChallengeStep
  index: number
  onRemove: () => void
}) {
  return (
    <Card
      bg="$gray2"
      p="$4"
      br="$5"
      borderWidth={0}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 1 }}
      shadowOpacity={0.08}
      shadowRadius={4}
      elevation={1}
    >
      <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
        <YStack flex={1} gap="$2">
          <XStack gap="$2" alignItems="center">
            <Text
              fontSize="$1"
              fontWeight="700"
              color="$gray11"
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              Step {index + 1}
            </Text>
            <XStack bg="$orange10" px="$2" py="$0.5" br="$6">
              <Text
                fontSize="$1"
                color="white"
                textTransform="uppercase"
                fontWeight="700"
                letterSpacing={0.5}
              >
                {step.type.replace('_', ' ')}
              </Text>
            </XStack>
          </XStack>
          <Text fontWeight="700" fontSize="$5" color="$gray12">
            {step.exercise}
          </Text>
          {step.type === 'strength' ? (
            <Text fontSize="$3" color="$gray11" fontWeight="600">
              {step.target_sets} sets × {step.target_reps} reps
              {step.target_weight && ` @ ${step.target_weight} ${step.weight_unit}`}
            </Text>
          ) : step.target_value ? (
            <Text fontSize="$3" color="$gray11" fontWeight="600">
              Target: {step.target_value} {step.target_unit}
            </Text>
          ) : null}
        </YStack>
        <Button
          size="$3"
          circular
          unstyled
          icon={<Trash2 size={20} color="$red10" />}
          onPress={onRemove}
          pressStyle={{ opacity: 0.6 }}
        />
      </XStack>
    </Card>
  )
}

/**
 * Form for adding a new step to the workout
 */
function AddStepForm({
  newStep,
  onUpdateNewStep,
  onAdd,
}: {
  newStep: Partial<ChallengeStep>
  onUpdateNewStep: (step: Partial<ChallengeStep>) => void
  onAdd: () => void
}) {
  return (
    <Card
      bg="$gray2"
      p="$5"
      br="$6"
      borderWidth={0}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 1 }}
      shadowOpacity={0.08}
      shadowRadius={4}
      elevation={1}
    >
      <YStack gap="$3">
        <Text
          fontWeight="600"
          fontSize="$4"
          color="$gray12"
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          Add Exercise
        </Text>

        <YStack gap="$2">
          <Text fontSize="$3" color="$gray11">
            Exercise Name
          </Text>
          <Input
            placeholder="e.g., 1K Run, 50 Burpees"
            value={newStep.exercise}
            onChangeText={(text) => onUpdateNewStep({ ...newStep, exercise: text })}
            size="$4"
          />
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$3" color="$gray11">
            Type
          </Text>
          <XStack gap="$2" flexWrap="wrap">
            {(['reps', 'time', 'distance', 'strength'] as const).map((type) => (
              <Button
                key={type}
                size="$3"
                variant={newStep.type === type ? undefined : 'outlined'}
                bg={newStep.type === type ? '$orange10' : undefined}
                onPress={() => onUpdateNewStep({ ...newStep, type })}
                flex={1}
                minWidth={80}
              >
                {type}
              </Button>
            ))}
          </XStack>
        </YStack>

        {/* Strength-specific fields */}
        {newStep.type === 'strength' && (
          <StrengthFields newStep={newStep} onUpdateNewStep={onUpdateNewStep} />
        )}

        <Button size="$4" bg="$orange10" icon={<Plus size={18} />} onPress={onAdd}>
          Add Step
        </Button>
      </YStack>
    </Card>
  )
}

/**
 * Strength-specific form fields (sets, reps, weight)
 */
function StrengthFields({
  newStep,
  onUpdateNewStep,
}: {
  newStep: Partial<ChallengeStep>
  onUpdateNewStep: (step: Partial<ChallengeStep>) => void
}) {
  return (
    <>
      <XStack gap="$2">
        <YStack flex={1} gap="$2">
          <Text fontSize="$3" color="$gray11">
            Sets
          </Text>
          <Input
            placeholder="3"
            keyboardType="number-pad"
            value={newStep.target_sets?.toString() || ''}
            onChangeText={(text) =>
              onUpdateNewStep({ ...newStep, target_sets: parseInt(text) || undefined })
            }
            size="$4"
          />
        </YStack>
        <YStack flex={1} gap="$2">
          <Text fontSize="$3" color="$gray11">
            Reps
          </Text>
          <Input
            placeholder="10"
            keyboardType="number-pad"
            value={newStep.target_reps?.toString() || ''}
            onChangeText={(text) =>
              onUpdateNewStep({ ...newStep, target_reps: parseInt(text) || undefined })
            }
            size="$4"
          />
        </YStack>
      </XStack>

      <YStack gap="$2">
        <Text fontSize="$3" color="$gray11">
          Target Weight (optional)
        </Text>
        <XStack gap="$2">
          <Input
            flex={1}
            placeholder="135"
            keyboardType="decimal-pad"
            value={newStep.target_weight?.toString() || ''}
            onChangeText={(text) =>
              onUpdateNewStep({ ...newStep, target_weight: parseFloat(text) || undefined })
            }
            size="$4"
          />
          <XStack gap="$1">
            <Button
              size="$4"
              minWidth={60}
              variant={newStep.weight_unit === 'lbs' ? undefined : 'outlined'}
              bg={newStep.weight_unit === 'lbs' ? '$orange10' : undefined}
              onPress={() => onUpdateNewStep({ ...newStep, weight_unit: 'lbs' })}
            >
              lbs
            </Button>
            <Button
              size="$4"
              minWidth={60}
              variant={newStep.weight_unit === 'kg' ? undefined : 'outlined'}
              bg={newStep.weight_unit === 'kg' ? '$orange10' : undefined}
              onPress={() => onUpdateNewStep({ ...newStep, weight_unit: 'kg' })}
            >
              kg
            </Button>
          </XStack>
        </XStack>
      </YStack>
    </>
  )
}
