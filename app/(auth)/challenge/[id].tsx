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
  Avatar,
  Input,
  Separator,
} from 'tamagui'
import {
  ArrowLeft,
  Trophy,
  Users,
  Clock,
  Target,
  Plus,
  Camera,
  Check,
  CheckCircle,
  ListOrdered,
} from '@tamagui/lucide-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert } from 'react-native'

import { store$, auth$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'
import type { Database, ChallengeStep, CompletionStepData, SetData } from '@/types/database.types'

/**
 * Challenge detail screen
 *
 * Shows challenge info, participants, leaderboard, and completion logging
 */
function ChallengeDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const session = auth$.session.get()
  const challenges = store$.challenges.get()
  const participants = store$.participants.get()
  const completions = store$.completions.get()

  const [showLogCompletion, setShowLogCompletion] = useState(false)
  const [completionValue, setCompletionValue] = useState('')
  const [completionWeight, setCompletionWeight] = useState('')
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')
  const [stepCompletionData, setStepCompletionData] = useState<Record<number, string>>({})
  const [stepSetsData, setStepSetsData] = useState<Record<number, SetData[]>>({})
  const [loading, setLoading] = useState(false)

  // Fallback: Load data directly if sync fails
  const [directChallenge, setDirectChallenge] = useState<any>(null)
  const [directParticipants, setDirectParticipants] = useState<any[]>([])
  const [directCompletions, setDirectCompletions] = useState<any[]>([])

  useEffect(() => {
    const loadDirectData = async () => {
      if (!id) return

      // Load challenge directly
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single()

      const { data: participantsData, error: participantsError } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          profile:profiles!challenge_participants_user_id_fkey(id, display_name, avatar_url)
        `)
        .eq('challenge_id', id)

      const { data: completionsData } = await supabase
        .from('completions')
        .select('*')
        .eq('challenge_id', id)
        .eq('deleted', false)

      setDirectChallenge(challengeData)
      setDirectParticipants(participantsData || [])
      setDirectCompletions(completionsData || [])
    }

    // Load directly if sync data not available
    if (!challenges || !(challenges as any)[id]) {
      loadDirectData()
    }
  }, [id, challenges])

  const challenge = challenges && id ? (challenges as any)[id] : directChallenge
  const challengeParticipants = participants
    ? Object.values(participants).filter((p: any) => p?.challenge_id === id)
    : directParticipants

  const challengeCompletions = completions
    ? Object.values(completions).filter((c: any) => c?.challenge_id === id)
    : directCompletions

  // Check if current user has completed this one-time challenge
  const userParticipation = challengeParticipants.find(
    (p: any) => p?.user_id === session?.user?.id
  )
  const isUserCompleted = challenge?.frequency === 'one_time' && userParticipation?.completed_by_user

  // Check if challenge has expired
  const isChallengeExpired = challenge?.ends_at && new Date(challenge.ends_at) < new Date()

  // Get leaderboard (highest value wins)
  const leaderboard = challengeParticipants
    .map((p: any) => {
      const userCompletions = challengeCompletions.filter((c: any) => c?.user_id === p.user_id)

      let bestValue = 0
      let bestCompletion: any = null

      if (userCompletions.length > 0) {
        if (challenge?.challenge_type === 'max_effort') {
          // For max effort: Calculate estimated 1RM using Brzycki formula
          // 1RM = weight × (36 / (37 - reps))
          // Or just use weight if reps = 1
          userCompletions.forEach((c: any) => {
            if (c?.weight) {
              const reps = c.value || 1
              const estimated1RM = reps === 1
                ? c.weight
                : c.weight * (36 / (37 - reps))

              if (estimated1RM > bestValue) {
                bestValue = estimated1RM
                bestCompletion = c
              }
            }
          })
        } else if (challenge?.challenge_type === 'workout') {
          // For multi-step: use total time (lower is better, but we still use max for sorting)
          // Sorting will be reversed in the UI for time-based challenges
          const completionsWithTimes = userCompletions.filter((c: any) => c?.value > 0)
          if (completionsWithTimes.length > 0) {
            const bestCompletion = completionsWithTimes.reduce((best: any, current: any) =>
              current.value < best.value ? current : best
            )
            bestValue = bestCompletion.value
          }
        } else {
          // For other types: use the value field (reps, time, distance)
          bestValue = Math.max(...userCompletions.map((c: any) => c?.value || 0))
        }
      }

      return {
        participant: p,
        best_value: bestValue,
        best_completion: bestCompletion,
        completion_count: userCompletions.length,
      }
    })
    .sort((a, b) => {
      // For workouts (time-based), lower is better
      if (challenge?.challenge_type === 'workout') {
        return a.best_value - b.best_value
      }
      // For other types, higher is better
      return b.best_value - a.best_value
    })

  const handleLogCompletion = async () => {
    if (!session?.user || !challenge) {
      Alert.alert('Error', 'Unable to log completion')
      return
    }

    // Check if challenge has expired
    if (challenge.ends_at && new Date(challenge.ends_at) < new Date()) {
      Alert.alert('Challenge Ended', 'This challenge has finished. You can view the final results on the leaderboard.')
      return
    }

    let value = 0
    let weight: number | null = null
    let stepData: CompletionStepData[] | null = null

    // Handle workout challenges
    if (challenge.challenge_type === 'workout' && challenge.steps) {
      // Validate all steps have required data
      for (let i = 0; i < challenge.steps.length; i++) {
        const step = challenge.steps[i]

        if (step.type === 'strength') {
          // Validate strength step has complete sets data
          const stepSets = stepSetsData[i] || []
          const requiredSets = step.target_sets || 3

          if (stepSets.length < requiredSets) {
            Alert.alert('Error', `Please complete all ${requiredSets} sets for "${step.exercise}"`)
            return
          }

          // Validate each set has reps
          const incompleteSets = stepSets.some(set => !set.reps || set.reps <= 0)
          if (incompleteSets) {
            Alert.alert('Error', `Please enter reps for all sets in "${step.exercise}"`)
            return
          }
        } else {
          // Validate non-strength steps have time data
          if (!stepCompletionData[i]) {
            Alert.alert('Error', `Please enter time for "${step.exercise}"`)
            return
          }
        }
      }

      // Build step data
      stepData = challenge.steps.map((step: ChallengeStep, index: number) => {
        if (step.type === 'strength') {
          // For strength: include sets data
          const sets = stepSetsData[index] || []
          return {
            step_index: index,
            exercise: step.exercise,
            value: sets.length, // Value = number of sets completed
            unit: 'sets',
            sets: sets,
          }
        } else {
          // For other types: use time value
          const stepValue = parseFloat(stepCompletionData[index] || '0')
          return {
            step_index: index,
            exercise: step.exercise,
            value: stepValue,
            unit: 'seconds',
          }
        }
      })

      // Calculate total value
      // For mixed workouts, we'll use total time from timed exercises
      // Strength exercises contribute 0 to total time (they're measured by sets)
      if (stepData) {
        value = stepData
          .filter(step => step.unit === 'seconds')
          .reduce((sum, step) => sum + step.value, 0)

        // If no timed exercises, use total sets completed
        if (value === 0) {
          value = stepData
            .filter(step => step.unit === 'sets')
            .reduce((sum, step) => sum + step.value, 0)
        }
      }
    } else {
      // Handle single-exercise challenges
      value = parseFloat(completionValue)
      if (isNaN(value) || value <= 0) {
        Alert.alert('Error', 'Please enter a valid number for reps')
        return
      }

      // For max effort, weight is required
      if (challenge.challenge_type === 'max_effort') {
        weight = parseFloat(completionWeight)
        if (isNaN(weight) || weight <= 0) {
          Alert.alert('Error', 'Please enter a valid weight')
          return
        }
      }
    }

    // Validate frequency-based completion limits
    if (challenge.frequency === 'daily') {
      const today = new Date().toISOString().split('T')[0]
      const userCompletions = challengeCompletions.filter((c: any) => c?.user_id === session.user.id)
      const todayCompletions = userCompletions.filter((c: any) => {
        const completionDate = c?.completed_at?.split('T')[0]
        return completionDate === today
      })

      if (todayCompletions.length > 0) {
        Alert.alert(
          'Already Logged',
          'You\'ve already logged a completion for today. Come back tomorrow!'
        )
        return
      }
    } else if (challenge.frequency === 'weekly') {
      // Get current week start (Sunday)
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const userCompletions = challengeCompletions.filter((c: any) => c?.user_id === session.user.id)
      const thisWeekCompletions = userCompletions.filter((c: any) => {
        const completionDate = new Date(c?.completed_at)
        return completionDate >= weekStart
      })

      if (thisWeekCompletions.length > 0) {
        Alert.alert(
          'Already Logged',
          'You\'ve already logged a completion for this week. Come back next week!'
        )
        return
      }
    } else if (challenge.frequency === 'monthly') {
      // Get current month
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      const userCompletions = challengeCompletions.filter((c: any) => c?.user_id === session.user.id)
      const thisMonthCompletions = userCompletions.filter((c: any) => {
        const completionDate = new Date(c?.completed_at)
        return (
          completionDate.getMonth() === currentMonth &&
          completionDate.getFullYear() === currentYear
        )
      })

      if (thisMonthCompletions.length > 0) {
        Alert.alert(
          'Already Logged',
          'You\'ve already logged a completion for this month. Come back next month!'
        )
        return
      }
    }

    setLoading(true)
    try {
      const completionData: Database['public']['Tables']['completions']['Insert'] = {
        user_id: session.user.id,
        challenge_id: challenge.id,
        value: value,
        unit: getUnit(challenge.challenge_type),
        weight: weight,
        weight_unit: challenge.challenge_type === 'max_effort' ? weightUnit : undefined,
        step_data: stepData,
        completed_at: new Date().toISOString(),
        verified: false,
      }

      // @ts-expect-error - Supabase generated types have issues with insert
      const { error } = await supabase.from('completions').insert(completionData)

      if (error) throw error

      Alert.alert('Success', 'Completion logged!')
      setShowLogCompletion(false)
      setCompletionValue('')
      setCompletionWeight('')
      setStepCompletionData({})
      setStepSetsData({})
    } catch (err) {
      Alert.alert('Error', 'Failed to log completion')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getUnit = (type: string) => {
    switch (type) {
      case 'amrap':
      case 'max_effort':
      case 'timed':
        return 'reps'
      case 'distance':
        return 'meters'
      case 'workout':
        return 'seconds'
      default:
        return 'reps'
    }
  }

  if (!challenge) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center" p="$4">
          <Text>Challenge not found</Text>
          <Button mt="$4" onPress={() => router.back()}>
            Go Back
          </Button>
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <Button
            size="$3"
            circular
            unstyled
            icon={<ArrowLeft />}
            onPress={() => router.back()}
          />
          <Text fontWeight="600">{challenge.challenge_type.toUpperCase()}</Text>
          <YStack width={40} />
        </XStack>

        <ScrollView flex={1}>
          <YStack p="$4" gap="$4">
            {/* Challenge Info */}
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="flex-start">
                <YStack flex={1} gap="$2">
                  <H1 fontSize="$8">{challenge.title}</H1>
                  <Text fontSize="$5" color="$blue10">
                    {challenge.exercise}
                  </Text>
                </YStack>
                {isChallengeExpired ? (
                  <Card bg="$gray3" p="$2" px="$3" br="$4" borderWidth={2} borderColor="$gray8">
                    <XStack alignItems="center" gap="$1">
                      <Clock size={16} color="$gray11" />
                      <Text fontSize="$2" fontWeight="700" color="$gray11">
                        ENDED
                      </Text>
                    </XStack>
                  </Card>
                ) : isUserCompleted ? (
                  <Card bg="$green2" p="$2" px="$3" br="$4" borderWidth={2} borderColor="$green10">
                    <XStack alignItems="center" gap="$1">
                      <CheckCircle size={16} color="$green10" />
                      <Text fontSize="$2" fontWeight="700" color="$green10">
                        COMPLETED
                      </Text>
                    </XStack>
                  </Card>
                ) : null}
              </XStack>
              {challenge.description && (
                <Text color="$gray10" fontSize="$3">
                  {challenge.description}
                </Text>
              )}

              {/* Steps List for Multi-Step Challenges */}
              {challenge.challenge_type === 'workout' && challenge.steps && (
                <YStack gap="$2" mt="$2">
                  <Text fontSize="$3" fontWeight="600">
                    Workout Steps:
                  </Text>
                  {challenge.steps.map((step: ChallengeStep, index: number) => (
                    <Card key={index} bg="$blue2" p="$2" px="$3" br="$3">
                      <XStack gap="$2" alignItems="center">
                        <YStack
                          width={24}
                          height={24}
                          alignItems="center"
                          justifyContent="center"
                          br="$10"
                          bg="$blue10"
                        >
                          <Text fontSize="$2" fontWeight="700" color="white">
                            {index + 1}
                          </Text>
                        </YStack>
                        <YStack flex={1}>
                          <Text fontSize="$3" fontWeight="600">
                            {step.exercise}
                          </Text>
                          {step.type === 'strength' ? (
                            <Text fontSize="$2" color="$gray10">
                              {step.target_sets} sets × {step.target_reps} reps
                              {step.target_weight && ` @ ${step.target_weight} ${step.weight_unit}`}
                            </Text>
                          ) : (
                            <Text fontSize="$2" color="$gray10" textTransform="capitalize">
                              {step.type.replace('_', ' ')}
                            </Text>
                          )}
                        </YStack>
                      </XStack>
                    </Card>
                  ))}
                </YStack>
              )}

              <XStack gap="$2" alignItems="center" mt="$1">
                <Text fontSize="$3" fontWeight="600" color="$gray10" textTransform="capitalize">
                  {challenge.frequency?.replace('_', ' ') || 'One-time'}
                </Text>
                {challenge.ends_at && (
                  <>
                    <Text fontSize="$3" color="$gray10">•</Text>
                    <Text fontSize="$3" color="$gray10">
                      {(() => {
                        const daysLeft = Math.ceil(
                          (new Date(challenge.ends_at).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                        if (daysLeft < 0) return challenge.frequency === 'one_time' ? 'No deadline' : 'Ended'
                        if (daysLeft === 0) return 'Ends today'
                        return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
                      })()}
                    </Text>
                  </>
                )}
              </XStack>
            </YStack>

            {/* Stats */}
            <XStack gap="$3">
              <Card flex={1} bg="$backgroundHover" p="$3" br="$4" alignItems="center">
                <Users size={24} color="$blue10" />
                <Text fontWeight="700" fontSize="$6" mt="$2">
                  {challengeParticipants.length}
                </Text>
                <Text color="$gray10" fontSize="$2">
                  Participants
                </Text>
              </Card>

              <Card flex={1} bg="$backgroundHover" p="$3" br="$4" alignItems="center">
                <Trophy size={24} color="$orange10" />
                <Text fontWeight="700" fontSize="$6" mt="$2">
                  {challengeCompletions.length}
                </Text>
                <Text color="$gray10" fontSize="$2">
                  Completions
                </Text>
              </Card>
            </XStack>

            {/* Log Completion Button */}
            {isChallengeExpired ? (
              <Card bg="$gray2" p="$4" br="$4" borderWidth={1} borderColor="$gray6">
                <YStack alignItems="center" gap="$2">
                  <Clock size={32} color="$gray10" />
                  <Text fontWeight="600" fontSize="$4" color="$gray11">
                    Challenge Ended
                  </Text>
                  <Text color="$gray10" fontSize="$3" textAlign="center">
                    This challenge has finished. Check out the final leaderboard below!
                  </Text>
                </YStack>
              </Card>
            ) : isUserCompleted ? (
              <Card bg="$gray2" p="$4" br="$4" borderWidth={1} borderColor="$gray6">
                <YStack alignItems="center" gap="$2">
                  <CheckCircle size={32} color="$green10" />
                  <Text fontWeight="600" fontSize="$4">
                    Challenge Completed!
                  </Text>
                  <Text color="$gray10" fontSize="$3" textAlign="center">
                    You've completed this one-time challenge. Your result is shown in the leaderboard below.
                  </Text>
                </YStack>
              </Card>
            ) : !showLogCompletion ? (
              <Button
                size="$5"
                bg="$green10"
                icon={<Plus size={20} />}
                onPress={() => setShowLogCompletion(true)}
              >
                Log Completion
              </Button>
            ) : (
              <Card bg="$green2" p="$4" br="$4" borderWidth={2} borderColor="$green10">
                <YStack gap="$3">
                  <Text fontWeight="600" fontSize="$5">
                    Log Your Result
                  </Text>

                  {/* Multi-Step: Show input for each step */}
                  {challenge.challenge_type === 'workout' && challenge.steps ? (
                    <YStack gap="$3">
                      <Text fontSize="$3" color="$gray11">
                        Log your results for each step:
                      </Text>
                      {challenge.steps.map((step: ChallengeStep, index: number) => (
                        <YStack key={index} gap="$2">
                          <Text fontSize="$3" fontWeight="600">
                            Step {index + 1}: {step.exercise}
                          </Text>
                          <Text fontSize="$2" color="$gray10" textTransform="capitalize">
                            {step.type.replace('_', ' ')}
                            {step.type === 'strength' && step.target_sets && ` • ${step.target_sets} sets × ${step.target_reps} reps`}
                          </Text>

                          {/* Strength type: Log sets with reps and weight */}
                          {step.type === 'strength' ? (
                            <YStack gap="$2">
                              {Array.from({ length: step.target_sets || 3 }).map((_, setIndex) => {
                                const stepSets = stepSetsData[index] || []
                                const currentSet: Partial<SetData> = stepSets[setIndex] || {}

                                return (
                                  <Card key={setIndex} bg="$gray2" p="$2" br="$3">
                                    <YStack gap="$2">
                                      <Text fontSize="$2" fontWeight="600" color="$gray11">
                                        Set {setIndex + 1}
                                      </Text>
                                      <XStack gap="$2">
                                        <YStack flex={1} gap="$1">
                                          <Text fontSize="$1" color="$gray11">Reps</Text>
                                          <Input
                                            placeholder={step.target_reps?.toString() || '10'}
                                            keyboardType="number-pad"
                                            value={currentSet.reps?.toString() || ''}
                                            onChangeText={(text) => {
                                              const newSets = [...stepSets]
                                              newSets[setIndex] = {
                                                reps: parseInt(text) || 0,
                                                weight: currentSet.weight,
                                                weight_unit: currentSet.weight_unit || step.weight_unit || 'lbs',
                                              }
                                              setStepSetsData({
                                                ...stepSetsData,
                                                [index]: newSets,
                                              })
                                            }}
                                            size="$3"
                                          />
                                        </YStack>
                                        <YStack flex={1} gap="$1">
                                          <Text fontSize="$1" color="$gray11">Weight</Text>
                                          <Input
                                            placeholder={step.target_weight?.toString() || '0'}
                                            keyboardType="decimal-pad"
                                            value={currentSet.weight?.toString() || ''}
                                            onChangeText={(text) => {
                                              const newSets = [...stepSets]
                                              newSets[setIndex] = {
                                                reps: currentSet.reps || 0,
                                                weight: parseFloat(text) || undefined,
                                                weight_unit: step.weight_unit || 'lbs',
                                              }
                                              setStepSetsData({
                                                ...stepSetsData,
                                                [index]: newSets,
                                              })
                                            }}
                                            size="$3"
                                          />
                                        </YStack>
                                        <YStack justifyContent="flex-end">
                                          <Button disabled variant="outlined" size="$3" minWidth={50}>
                                            {step.weight_unit || 'lbs'}
                                          </Button>
                                        </YStack>
                                      </XStack>
                                    </YStack>
                                  </Card>
                                )
                              })}
                            </YStack>
                          ) : (
                            /* Other step types: Show time input */
                            <XStack gap="$2">
                              <Input
                                flex={1}
                                placeholder="Enter seconds"
                                keyboardType="decimal-pad"
                                value={stepCompletionData[index] || ''}
                                onChangeText={(text) =>
                                  setStepCompletionData({
                                    ...stepCompletionData,
                                    [index]: text,
                                  })
                                }
                                size="$4"
                              />
                              <Button disabled variant="outlined" size="$4" minWidth={100}>
                                seconds
                              </Button>
                            </XStack>
                          )}
                        </YStack>
                      ))}
                    </YStack>
                  ) : /* Max Effort: Show Weight + Reps */
                  challenge.challenge_type === 'max_effort' ? (
                    <>
                      <YStack gap="$2">
                        <Text fontSize="$3" color="$gray11">Weight</Text>
                        <XStack gap="$2">
                          <Input
                            flex={1}
                            placeholder="Enter weight"
                            keyboardType="decimal-pad"
                            value={completionWeight}
                            onChangeText={setCompletionWeight}
                            size="$5"
                            autoFocus
                          />
                          <XStack gap="$1">
                            <Button
                              size="$5"
                              minWidth={60}
                              variant={weightUnit === 'lbs' ? undefined : 'outlined'}
                              bg={weightUnit === 'lbs' ? '$blue10' : undefined}
                              onPress={() => setWeightUnit('lbs')}
                            >
                              lbs
                            </Button>
                            <Button
                              size="$5"
                              minWidth={60}
                              variant={weightUnit === 'kg' ? undefined : 'outlined'}
                              bg={weightUnit === 'kg' ? '$blue10' : undefined}
                              onPress={() => setWeightUnit('kg')}
                            >
                              kg
                            </Button>
                          </XStack>
                        </XStack>
                      </YStack>

                      <YStack gap="$2">
                        <Text fontSize="$3" color="$gray11">Reps</Text>
                        <XStack gap="$2">
                          <Input
                            flex={1}
                            placeholder="Enter reps"
                            keyboardType="number-pad"
                            value={completionValue}
                            onChangeText={setCompletionValue}
                            size="$5"
                          />
                          <Button disabled variant="outlined" size="$5" minWidth={100}>
                            reps
                          </Button>
                        </XStack>
                      </YStack>
                    </>
                  ) : (
                    /* Other challenge types: Show single value */
                    <XStack gap="$2">
                      <Input
                        flex={1}
                        placeholder="Enter value"
                        keyboardType="number-pad"
                        value={completionValue}
                        onChangeText={setCompletionValue}
                        size="$5"
                        autoFocus
                      />
                      <Button disabled variant="outlined" size="$5" minWidth={100}>
                        {getUnit(challenge.challenge_type)}
                      </Button>
                    </XStack>
                  )}

                  <XStack gap="$2">
                    <Button
                      flex={1}
                      variant="outlined"
                      onPress={() => {
                        setShowLogCompletion(false)
                        setCompletionValue('')
                        setCompletionWeight('')
                        setStepCompletionData({})
                        setStepSetsData({})
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      flex={2}
                      bg="$green10"
                      icon={<Check size={20} />}
                      disabled={
                        loading ||
                        (challenge.challenge_type === 'workout'
                          ? challenge.steps?.some((step: ChallengeStep, i: number) => {
                              // For strength steps, check if all sets are complete
                              if (step.type === 'strength') {
                                const sets = stepSetsData[i] || []
                                const requiredSets = step.target_sets || 3
                                return sets.length < requiredSets || sets.some(set => !set.reps || set.reps <= 0)
                              }
                              // For other steps, check if time is entered
                              return !stepCompletionData[i]
                            })
                          : !completionValue ||
                            (challenge.challenge_type === 'max_effort' && !completionWeight))
                      }
                      onPress={handleLogCompletion}
                    >
                      {loading ? 'Saving...' : 'Submit'}
                    </Button>
                  </XStack>
                  <Button
                    size="$3"
                    variant="outlined"
                    icon={<Camera size={16} />}
                    disabled
                  >
                    Add Proof (Coming Soon)
                  </Button>
                </YStack>
              </Card>
            )}

            {/* Leaderboard */}
            <YStack gap="$3">
              <H2 fontSize="$5">Leaderboard</H2>

              {leaderboard.length === 0 ? (
                <Card bg="$backgroundHover" p="$4" br="$4" alignItems="center">
                  <Target size={32} color="$gray10" />
                  <Text color="$gray10" textAlign="center" mt="$2">
                    No completions yet. Be the first!
                  </Text>
                </Card>
              ) : (
                <YStack gap="$2">
                  {leaderboard.map((entry: any, index: number) => (
                    <LeaderboardRow
                      key={entry.participant.id}
                      rank={index + 1}
                      participant={entry.participant}
                      value={entry.best_value}
                      completion={entry.best_completion}
                      completions={entry.completion_count}
                      challengeType={challenge.challenge_type}
                      unit={getUnit(challenge.challenge_type)}
                      isCurrentUser={entry.participant.user_id === session?.user?.id}
                    />
                  ))}
                </YStack>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  )
}

/**
 * Leaderboard row component
 */
function LeaderboardRow({
  rank,
  participant,
  value,
  completion,
  completions,
  challengeType,
  unit,
  isCurrentUser,
}: {
  rank: number
  participant: any
  value: number
  completion: any
  completions: number
  challengeType: string
  unit: string
  isCurrentUser: boolean
}) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return '$yellow10'
    if (rank === 2) return '$gray9'
    if (rank === 3) return '$orange9'
    return '$gray10'
  }

  return (
    <Card
      bg={isCurrentUser ? '$blue2' : '$backgroundHover'}
      p="$3"
      br="$4"
      borderWidth={isCurrentUser ? 2 : 0}
      borderColor={isCurrentUser ? '$blue10' : 'transparent'}
    >
      <XStack alignItems="center" gap="$3">
        {/* Rank */}
        <YStack
          width={32}
          height={32}
          alignItems="center"
          justifyContent="center"
          br="$10"
          bg={rank <= 3 ? getRankColor(rank) : '$gray5'}
        >
          <Text fontWeight="700" color={rank <= 3 ? 'white' : '$color'}>
            {rank}
          </Text>
        </YStack>

        {/* Name */}
        <YStack flex={1}>
          <Text fontWeight="600">
            {participant.profile?.display_name || `User #${participant.user_id.slice(0, 8)}`}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text fontSize="$2" color="$gray10">
            {completions} {completions === 1 ? 'completion' : 'completions'}
          </Text>
        </YStack>

        {/* Value */}
        <YStack alignItems="flex-end">
          {challengeType === 'max_effort' && completion ? (
            <>
              <Text fontWeight="700" fontSize="$6" color={rank <= 3 ? getRankColor(rank) : '$color'}>
                {completion.weight} {completion.weight_unit}
              </Text>
              <Text fontSize="$2" color="$gray10">
                {completion.value} {completion.value === 1 ? 'rep' : 'reps'}
              </Text>
              <Text fontSize="$1" color="$gray9">
                Est. 1RM: {Math.round(value)} {completion.weight_unit}
              </Text>
            </>
          ) : (
            <>
              <Text fontWeight="700" fontSize="$6" color={rank <= 3 ? getRankColor(rank) : '$color'}>
                {Math.round(value)}
              </Text>
              <Text fontSize="$2" color="$gray10">
                {unit}
              </Text>
            </>
          )}
        </YStack>
      </XStack>
    </Card>
  )
}

export default observer(ChallengeDetailScreen)
