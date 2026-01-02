import { useState, useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  H1,
  H2,
  Button,
  Card,
  ScrollView,
  Input,
  TextArea,
} from 'tamagui'
import {
  X,
  Zap,
  Weight,
  Clock,
  CheckCircle,
  UserPlus,
  ListOrdered,
  Users as UsersIcon,
} from '@tamagui/lucide-icons'
import { Alert } from 'react-native'
import { KeyboardSafeArea } from '@/components/ui'
import { ChallengeTypeCard, StepBuilder } from '@/components/challenge'
import type { ChallengeType } from '@/components/challenge'

import { store$, auth$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import type { Database, ChallengeStep } from '@/types/database.types'
type ChallengeFrequency = 'one_time' | 'daily' | 'weekly' | 'monthly'

interface ChallengeForm {
  type: ChallengeType | null
  title: string
  description: string
  exercise: string
  frequency: ChallengeFrequency
  duration_days: number | null
  duration_minutes?: number
  target_value?: number
  target_unit?: string
  steps: ChallengeStep[]
  invited_phones: string[]
}

/**
 * Get suggested exercises based on challenge type
 */
const getSuggestedExercises = (type: ChallengeType | null): string[] => {
  switch (type) {
    case 'max_effort':
      return [
        'Back Squat',
        'Bench Press',
        'Deadlift',
        'Overhead Press',
        'Front Squat',
        'Clean & Jerk',
        'Snatch',
        'Power Clean',
        'Barbell Row',
        'Weighted Pull-ups',
        'Weighted Dips',
        'Sumo Deadlift',
        'Trap Bar Deadlift',
        'Incline Bench',
        'Push Press',
        'Floor Press',
        'Leg Press',
        'Hack Squat',
        'Vertical Jump',
        'Broad Jump',
        'Med Ball Throw',
        'Weighted Muscle-up',
      ]
    case 'amrap':
      return [
        'Pushups',
        'Pull-ups',
        'Air Squats',
        'Burpees',
        'Sit-ups',
        'Box Jumps',
        'Kettlebell Swings',
        'Wall Balls',
        'Double Unders',
        'Jumping Lunges',
        'Mountain Climbers',
        'Thrusters',
        'Dips',
        'Chin-ups',
        'Muscle-ups',
        'Toes to Bar',
      ]
    case 'for_time':
      return [
        'Running',
        'Rowing',
        'Cycling',
        'Swimming',
        'Jump Rope',
        'Ski Erg',
        'Burpees',
        'Pushups',
        'Pull-ups',
        'Air Squats',
        'Box Jumps',
        'Wall Balls',
      ]
    case 'workout':
      return [
        'Pushups',
        'Pull-ups',
        'Air Squats',
        'Running',
        'Rowing',
        'Burpees',
        'Box Jumps',
        'Kettlebell Swings',
        'Wall Balls',
        'Thrusters',
        'Deadlift',
        'Clean & Jerk',
      ]
    default:
      return [
        'Pushups',
        'Pull-ups',
        'Air Squats',
        'Burpees',
        'Running',
        'Deadlift',
      ]
  }
}

// Initial empty form state
const INITIAL_FORM_STATE: ChallengeForm = {
  type: null,
  title: '',
  description: '',
  exercise: '',
  frequency: 'one_time',
  duration_days: null,
  steps: [],
  invited_phones: [],
}

/**
 * Challenge creation screen
 *
 * Multi-step flow to create and share challenges
 */
function CreateChallengeScreen() {
  const router = useRouter()
  const { groupId } = useLocalSearchParams<{ groupId?: string }>()
  const session = auth$.session.get()
  const groups = store$.groups.get()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<ChallengeForm>(INITIAL_FORM_STATE)

  // Get group name if creating for a group
  const group = groupId && groups ? (groups as any)[groupId] : null

  const updateForm = (updates: Partial<ChallengeForm>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const resetForm = () => {
    setForm(INITIAL_FORM_STATE)
    setStep(1)
  }

  // Get suggested exercises for current challenge type
  const suggestedExercises = getSuggestedExercises(form.type)

  // Clear form when component unmounts (screen closes)
  useEffect(() => {
    return () => {
      resetForm()
    }
  }, [])

  // Clear type-specific fields when challenge type changes
  useEffect(() => {
    if (form.type) {
      // When type changes, clear exercise and steps (type-specific data)
      setForm((prev) => ({
        ...prev,
        exercise: '',
        steps: [],
        // Keep title, description, frequency, duration - they're generic
      }))
      // Go back to step 1 to re-select exercise/workout
      if (step > 1) {
        setStep(2)
      }
    }
  }, [form.type])

  const handleCreateChallenge = async () => {
    if (!session?.user) {
      Alert.alert('Error', 'You must be logged in to create a challenge')
      return
    }

    setLoading(true)
    try {
      // Calculate ends_at from duration_days
      const startsAt = new Date()
      let endsAt: string | null = null

      // Calculate end date based on duration_days (or default 7 days for one-time)
      const durationInDays = form.duration_days || (form.frequency === 'one_time' ? 7 : null)
      if (durationInDays) {
        const endDate = new Date(startsAt)
        endDate.setDate(endDate.getDate() + durationInDays)
        endsAt = endDate.toISOString()
      }

      // Create challenge
      const challengeData: Database['public']['Tables']['challenges']['Insert'] = {
        creator_id: session.user.id,
        group_id: groupId || null,
        title: form.title,
        description: form.description || null,
        challenge_type: form.type!,
        exercise: form.type === 'workout' ? 'Multi-Step Workout' : form.exercise,
        frequency: form.frequency,
        duration_days: form.duration_days,
        steps: form.type === 'workout' && form.steps.length > 0 ? form.steps : null,
        config: {
          duration_minutes: form.duration_minutes,
          target_value: form.target_value,
          target_unit: form.target_unit,
        },
        is_public: false,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt,
      }

      // @ts-expect-error - Supabase generated types have issues with insert
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert(challengeData)
        .select()
        .single()

      if (challengeError) throw challengeError

      // Add creator as participant
      const participantData: Database['public']['Tables']['challenge_participants']['Insert'] = {
        challenge_id: challenge.id,
        user_id: session.user.id,
        status: 'accepted',
      }

      // @ts-expect-error - Supabase generated types have issues with insert
      const { error: participantError } = await supabase
        .from('challenge_participants')
        .insert(participantData)

      if (participantError) throw participantError

      // Invite friends (would need phone lookup or invitation system)
      // For now, just show success

      // Reset form for next challenge creation
      resetForm()

      Alert.alert(
        'Challenge Created!',
        `"${form.title}" is ready. Invite your friends to compete!`,
        [
          {
            text: 'View Challenge',
            onPress: () => router.replace(`/(auth)/challenge/${challenge.id}`),
          },
        ]
      )
    } catch (err) {
      Alert.alert('Error', 'Failed to create challenge')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.type !== null
      case 2:
        // Workout: need at least 2 steps
        if (form.type === 'workout') {
          return form.steps.length >= 2
        }
        // Other types: need exercise name
        return form.exercise.length > 0
      case 3:
        // For recurring challenges, must select duration
        if (form.frequency !== 'one_time' && !form.duration_days) {
          return false
        }
        return form.title.length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <KeyboardSafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <YStack>
          <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
            <H1 fontSize="$7">Create Challenge</H1>
            <Button size="$3" circular unstyled icon={<X />} onPress={() => router.back()} />
          </XStack>
          {group && (
            <XStack px="$4" pb="$3" gap="$2" alignItems="center">
              <UsersIcon size={16} color="$orange10" />
              <Text fontSize="$3" color="$orange10" fontWeight="600">
                For: {group.name}
              </Text>
            </XStack>
          )}
        </YStack>

        {/* Progress Indicator */}
        <XStack px="$4" py="$2" gap="$2">
          {[1, 2, 3, 4].map((i) => (
            <YStack
              key={i}
              flex={1}
              height={4}
              br="$2"
              bg={i <= step ? '$orange10' : '$gray5'}
            />
          ))}
        </XStack>

        <ScrollView flex={1}>
          <YStack p="$4" gap="$4">
            {/* Step 1: Challenge Type */}
            {step === 1 && (
              <YStack gap="$3">
                <H2 fontSize="$6">Choose Challenge Type</H2>
                <Text color="$gray10">
                  Select how you want to compete
                </Text>

                <ChallengeTypeCard
                  icon={<Zap size={32} color="$orange10" />}
                  type="amrap"
                  title="AMRAP"
                  description="Max reps or rounds in a time limit • Quick, competitive"
                  example="50 pushups in 2 mins OR Cindy (5-10-15 rounds)"
                  selected={form.type === 'amrap'}
                  onSelect={() => updateForm({ type: 'amrap' })}
                />

                <ChallengeTypeCard
                  icon={<Weight size={32} color="$orange10" />}
                  type="max_effort"
                  title="Max Effort"
                  description="Heaviest weight × reps • Strength PRs, no time limit"
                  example="Max bench press (225 lbs × 5 reps)"
                  selected={form.type === 'max_effort'}
                  onSelect={() => updateForm({ type: 'max_effort' })}
                />

                <ChallengeTypeCard
                  icon={<Clock size={32} color="$green10" />}
                  type="for_time"
                  title="For Time"
                  description="Fastest time to complete target • Benchmark workouts"
                  example="100 burpees for time OR 5 rounds of Fran"
                  selected={form.type === 'for_time'}
                  onSelect={() => updateForm({ type: 'for_time' })}
                />

                <ChallengeTypeCard
                  icon={<ListOrdered size={32} color="$purple10" />}
                  type="workout"
                  title="Workout"
                  description="Multi-exercise circuit or structured program"
                  example="Hyrox (8 stations) OR Leg Day (5 exercises)"
                  selected={form.type === 'workout'}
                  onSelect={() => updateForm({ type: 'workout', steps: [] })}
                />
              </YStack>
            )}

            {/* Step 2: Exercise or Step Builder */}
            {step === 2 && form.type !== 'workout' && (
              <YStack gap="$3">
                <H2 fontSize="$6">What Exercise?</H2>
                <Text color="$gray10">
                  Enter the name of the exercise
                </Text>

                <Input
                  placeholder="e.g., Pushups, Squats, Deadlift"
                  value={form.exercise}
                  onChangeText={(text) => updateForm({ exercise: text })}
                  size="$5"
                  autoFocus
                />

                {/* Suggested exercises - context-aware based on challenge type */}
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="600">
                    Suggested:
                  </Text>
                  <YStack gap="$2">
                    {/* Show first 12 suggestions in a 3-column grid */}
                    {Array.from({ length: Math.ceil(Math.min(suggestedExercises.length, 12) / 3) }).map((_, rowIndex) => (
                      <XStack key={rowIndex} gap="$2">
                        {suggestedExercises.slice(rowIndex * 3, rowIndex * 3 + 3).map((exercise) => (
                          <Button
                            key={exercise}
                            flex={1}
                            size="$3"
                            variant="outlined"
                            onPress={() => updateForm({ exercise })}
                          >
                            {exercise}
                          </Button>
                        ))}
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              </YStack>
            )}

            {/* Step 2: Workout Builder */}
            {step === 2 && form.type === 'workout' && (
              <StepBuilder
                steps={form.steps}
                onUpdateSteps={(steps) => updateForm({ steps })}
              />
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <YStack gap="$3">
                <H2 fontSize="$6">Challenge Details</H2>

                <YStack gap="$2">
                  <Text fontWeight="600">Title</Text>
                  <Input
                    placeholder="Give your challenge a catchy name"
                    value={form.title}
                    onChangeText={(text) => updateForm({ title: text })}
                    size="$5"
                    autoFocus
                  />
                </YStack>

                <YStack gap="$2">
                  <Text fontWeight="600">Description (optional)</Text>
                  <TextArea
                    placeholder="Add details about rules, prizes, or motivation"
                    value={form.description}
                    onChangeText={(text) => updateForm({ description: text })}
                    size="$4"
                    numberOfLines={4}
                  />
                </YStack>

                {/* Frequency Selection */}
                <YStack gap="$2">
                  <Text fontWeight="600">Challenge Frequency</Text>
                  <XStack gap="$2" flexWrap="wrap">
                    <Button
                      size="$3"
                      variant={form.frequency === 'one_time' ? 'default' : 'outlined'}
                      bg={form.frequency === 'one_time' ? '$orange10' : undefined}
                      onPress={() => updateForm({ frequency: 'one_time', duration_days: null })}
                      flex={1}
                      minWidth={100}
                    >
                      One-Time
                    </Button>
                    <Button
                      size="$3"
                      variant={form.frequency === 'daily' ? 'default' : 'outlined'}
                      bg={form.frequency === 'daily' ? '$orange10' : undefined}
                      onPress={() => updateForm({ frequency: 'daily' })}
                      flex={1}
                      minWidth={100}
                    >
                      Daily
                    </Button>
                    <Button
                      size="$3"
                      variant={form.frequency === 'weekly' ? 'default' : 'outlined'}
                      bg={form.frequency === 'weekly' ? '$orange10' : undefined}
                      onPress={() => updateForm({ frequency: 'weekly' })}
                      flex={1}
                      minWidth={100}
                    >
                      Weekly
                    </Button>
                    <Button
                      size="$3"
                      variant={form.frequency === 'monthly' ? 'default' : 'outlined'}
                      bg={form.frequency === 'monthly' ? '$orange10' : undefined}
                      onPress={() => updateForm({ frequency: 'monthly' })}
                      flex={1}
                      minWidth={100}
                    >
                      Monthly
                    </Button>
                  </XStack>
                </YStack>

                {/* Duration Selection */}
                {form.frequency !== 'one_time' ? (
                  <YStack gap="$2">
                    <Text fontWeight="600">Challenge Duration</Text>
                    <Text color="$gray10" fontSize="$2">
                      How long should this challenge run?
                    </Text>
                    <XStack gap="$2" flexWrap="wrap">
                      <Button
                        size="$3"
                        variant={form.duration_days === 7 ? 'default' : 'outlined'}
                        bg={form.duration_days === 7 ? '$orange10' : undefined}
                        onPress={() => updateForm({ duration_days: 7 })}
                        flex={1}
                        minWidth={80}
                      >
                        7 days
                      </Button>
                      <Button
                        size="$3"
                        variant={form.duration_days === 14 ? 'default' : 'outlined'}
                        bg={form.duration_days === 14 ? '$orange10' : undefined}
                        onPress={() => updateForm({ duration_days: 14 })}
                        flex={1}
                        minWidth={80}
                      >
                        14 days
                      </Button>
                      <Button
                        size="$3"
                        variant={form.duration_days === 30 ? 'default' : 'outlined'}
                        bg={form.duration_days === 30 ? '$orange10' : undefined}
                        onPress={() => updateForm({ duration_days: 30 })}
                        flex={1}
                        minWidth={80}
                      >
                        30 days
                      </Button>
                      <Button
                        size="$3"
                        variant={form.duration_days === 90 ? 'default' : 'outlined'}
                        bg={form.duration_days === 90 ? '$orange10' : undefined}
                        onPress={() => updateForm({ duration_days: 90 })}
                        flex={1}
                        minWidth={80}
                      >
                        90 days
                      </Button>
                    </XStack>
                  </YStack>
                ) : (
                  <YStack gap="$2">
                    <Text fontWeight="600">Time to Complete (Optional)</Text>
                    <Text color="$gray10" fontSize="$2">
                      How long do you have to complete this challenge?
                    </Text>

                    {/* Quick presets row 1: Ephemeral challenges */}
                    <YStack gap="$1">
                      <Text fontSize="$2" color="$gray11" fontWeight="600">Quick challenges</Text>
                      <XStack gap="$2" flexWrap="wrap">
                        <Button
                          size="$3"
                          variant={form.duration_days === 0.042 ? undefined : 'outlined'}
                          bg={form.duration_days === 0.042 ? '$orange10' : undefined}
                          onPress={() => {
                            updateForm({ duration_days: 0.042 }) // 1 hour
                          }}
                          flex={1}
                          minWidth={70}
                        >
                          1 hour
                        </Button>
                        <Button
                          size="$3"
                          variant={form.duration_days === 0.25 ? undefined : 'outlined'}
                          bg={form.duration_days === 0.25 ? '$orange10' : undefined}
                          onPress={() => updateForm({ duration_days: 0.25 })} // 6 hours
                          flex={1}
                          minWidth={70}
                        >
                          6 hours
                        </Button>
                        <Button
                          size="$3"
                          variant={form.duration_days === 1 ? undefined : 'outlined'}
                          bg={form.duration_days === 1 ? '$orange10' : undefined}
                          onPress={() => updateForm({ duration_days: 1 })}
                          flex={1}
                          minWidth={70}
                        >
                          1 day
                        </Button>
                      </XStack>
                    </YStack>

                    {/* Quick presets row 2: Standard challenges */}
                    <YStack gap="$1">
                      <Text fontSize="$2" color="$gray11" fontWeight="600">Standard challenges</Text>
                      <XStack gap="$2" flexWrap="wrap">
                        <Button
                          size="$3"
                          variant={!form.duration_days || form.duration_days === 7 ? undefined : 'outlined'}
                          bg={!form.duration_days || form.duration_days === 7 ? '$orange10' : undefined}
                          onPress={() => updateForm({ duration_days: 7 })}
                          flex={1}
                          minWidth={70}
                        >
                          1 week
                        </Button>
                        <Button
                          size="$3"
                          variant={form.duration_days === 14 ? undefined : 'outlined'}
                          bg={form.duration_days === 14 ? '$orange10' : undefined}
                          onPress={() => updateForm({ duration_days: 14 })}
                          flex={1}
                          minWidth={70}
                        >
                          2 weeks
                        </Button>
                        <Button
                          size="$3"
                          variant={form.duration_days === 30 ? undefined : 'outlined'}
                          bg={form.duration_days === 30 ? '$orange10' : undefined}
                          onPress={() => updateForm({ duration_days: 30 })}
                          flex={1}
                          minWidth={70}
                        >
                          1 month
                        </Button>
                      </XStack>
                    </YStack>
                  </YStack>
                )}

                {/* Type-specific config */}
                {(form.type === 'amrap' || form.type === 'timed') && (
                  <YStack gap="$2">
                    <Text fontWeight="600">
                      {form.type === 'amrap' ? 'Time Limit' : 'Target Reps'}
                    </Text>
                    <XStack gap="$2">
                      <Input
                        placeholder={form.type === 'amrap' ? '10' : '100'}
                        keyboardType="number-pad"
                        value={
                          form.type === 'amrap'
                            ? form.duration_minutes?.toString() || ''
                            : form.target_value?.toString() || ''
                        }
                        onChangeText={(text) => {
                          const num = parseInt(text) || 0
                          updateForm(
                            form.type === 'amrap'
                              ? { duration_minutes: num }
                              : { target_value: num }
                          )
                        }}
                        flex={1}
                        size="$5"
                      />
                      <Button disabled variant="outlined" size="$5" minWidth={100}>
                        {form.type === 'amrap' ? 'minutes' : 'reps'}
                      </Button>
                    </XStack>
                  </YStack>
                )}
              </YStack>
            )}

            {/* Step 4: Invite Friends */}
            {step === 4 && (
              <YStack gap="$3">
                <H2 fontSize="$6">Invite Friends</H2>
                <Text color="$gray10">
                  Tag friends to join your challenge
                </Text>

                <Card bg="$backgroundHover" p="$4" br="$4" alignItems="center">
                  <UserPlus size={48} color="$gray10" />
                  <Text color="$gray10" textAlign="center" mt="$3">
                    Friend invitations coming soon!{'\n'}For now, create and share the challenge
                    manually.
                  </Text>
                </Card>

                {/* Preview */}
                <YStack gap="$3" mt="$4">
                  <Text
                    color="$gray11"
                    fontSize="$2"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    Preview
                  </Text>
                  <Card
                    bg={
                      form.type === 'amrap' ? '$purple2' :
                      form.type === 'max_effort' ? '$orange2' :
                      form.type === 'for_time' ? '$green2' :
                      '$orange2'
                    }
                    p="$5"
                    br="$6"
                    borderWidth={0}
                    shadowColor="$shadowColor"
                    shadowOffset={{ width: 0, height: 2 }}
                    shadowOpacity={0.15}
                    shadowRadius={12}
                    elevation={3}
                    position="relative"
                  >
                    <YStack gap="$2">
                      <XStack
                        position="absolute"
                        top={5}
                        right={5}
                        bg={
                          form.type === 'amrap' ? '$purple10' :
                          form.type === 'max_effort' ? '$orange10' :
                          form.type === 'for_time' ? '$green10' :
                          '$orange10'
                        }
                        px="$2"
                        py="$1"
                        br="$2"
                      >
                        <Text
                          color="white"
                          fontSize="$3"
                          textTransform="uppercase"
                          fontWeight="700"
                          letterSpacing={1}
                        >
                          {form.type?.replace('_', ' ')}
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontWeight="700" fontSize="$6">
                          {form.title}
                        </Text>
                      </XStack>
                      <Text fontSize="$4">{form.exercise}</Text>
                      {form.description && (
                        <Text color="$gray10" fontSize="$3">
                          {form.description}
                        </Text>
                      )}
                      <XStack gap="$2" mt="$2" alignItems="center">
                        <Text fontSize="$3" color="$orange10" fontWeight="600" textTransform="capitalize">
                          {form.frequency.replace('_', ' ')}
                        </Text>
                        <Text fontSize="$3" color="$gray10">•</Text>
                        <Text fontSize="$3" color="$gray10">
                          {form.duration_days || (form.frequency === 'one_time' ? 7 : 0)} days
                        </Text>
                      </XStack>
                    </YStack>
                  </Card>
                </YStack>
              </YStack>
            )}
          </YStack>
        </ScrollView>

        {/* Navigation Buttons */}
        <YStack px="$4" pt="$4" pb="$8" gap="$3" bg="$background" borderTopWidth={1} borderColor="$borderColor">
          {step < 4 ? (
            <XStack gap="$3">
              {step > 1 && (
                <Button
                  flex={1}
                  size="$5"
                  variant="outlined"
                  onPress={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                flex={2}
                size="$5"
                bg="$orange10"
                disabled={!canProceed()}
                onPress={() => setStep(step + 1)}
              >
                Continue
              </Button>
            </XStack>
          ) : (
            <XStack gap="$3">
              <Button
                flex={1}
                size="$5"
                variant="outlined"
                onPress={() => setStep(step - 1)}
              >
                Back
              </Button>
              <Button
                flex={2}
                size="$5"
                bg="$orange10"
                icon={<CheckCircle size={20} />}
                disabled={loading}
                onPress={handleCreateChallenge}
              >
                {loading ? 'Creating...' : 'Create Challenge'}
              </Button>
            </XStack>
          )}
        </YStack>
      </YStack>
    </KeyboardSafeArea>
  )
}

export default observer(CreateChallengeScreen)
