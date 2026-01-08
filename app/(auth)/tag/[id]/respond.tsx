import { useState, useEffect, useRef } from 'react'
import { Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, H1, Button, Card, Input, ScrollView } from 'tamagui'
import { X, Send, Clock, Check, ChevronDown, ArrowRight, Camera } from '@tamagui/lucide-icons'
import * as ImagePicker from 'expo-image-picker'
import { KeyboardSafeArea } from '@/components/ui'
import { CelebrationOverlay, CelebrationType } from '@/components/celebration'

import { supabase } from '@/lib/supabase'
import { auth$ } from '@/lib/legend-state/store'
import { useImageUpload } from '@/lib/hooks'
import { useSettings } from '@/lib/settings-context'
import { TagEvents } from '@/lib/analytics'

interface ValidExercise {
  exercise_id: string
  exercise_name: string
  exercise_icon: string | null
  exercise_type: string
  is_variant: boolean
  scaling_factor: number
  effective_target: number
}

/**
 * Tag Response Screen
 *
 * Shows the tag details and allows user to respond with their result
 * Supports selecting variant exercises (e.g., Knee Pushups instead of Pushups)
 */
function TagRespondScreen() {
  const router = useRouter()
  const { id: tagId } = useLocalSearchParams<{ id: string }>()
  const session = auth$.session.get()
  const { haptic } = useSettings()

  const [tag, setTag] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [value, setValue] = useState<number | null>(null)

  // Exercise variant selection
  const [validExercises, setValidExercises] = useState<ValidExercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<ValidExercise | null>(null)
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)

  // Personal record tracking
  const [personalRecord, setPersonalRecord] = useState<{
    has_record: boolean
    best_value: number | null
    last_value: number | null
    total_completions: number
  } | null>(null)

  // Proof capture
  const [proofUri, setProofUri] = useState<string | null>(null)
  const [proofType, setProofType] = useState<'photo' | 'video' | null>(null)
  const [capturing, setCapturing] = useState(false)
  const { uploading: uploadingProof, uploadFromUri } = useImageUpload()

  // Celebration animation
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationType, setCelebrationType] = useState<CelebrationType>('completion')
  const pendingAlertRef = useRef<{
    title: string
    message: string
    beatsTarget: boolean
  } | null>(null)

  // Load tag details and valid exercises
  useEffect(() => {
    const loadTag = async () => {
      if (!tagId) return

      // Load tag details
      const { data, error } = await (supabase
        .from('tags') as any)
        .select(`
          *,
          sender:profiles!tags_sender_id_fkey (
            id,
            display_name,
            avatar_url
          ),
          exercise:exercises (
            id,
            name,
            icon,
            type,
            unit
          )
        `)
        .eq('id', tagId)
        .single()

      if (error) {
        console.error('Error loading tag:', error)
        Alert.alert('Error', 'Failed to load tag details')
        router.back()
        return
      }

      setTag(data)

      // Load valid completion exercises (including variants)
      const { data: exercises, error: exercisesError } = await (supabase.rpc as any)(
        'get_valid_completion_exercises',
        { p_tag_id: tagId }
      )

      if (!exercisesError && exercises) {
        setValidExercises(exercises)
        // Default to the original exercise
        const original = exercises.find((e: ValidExercise) => !e.is_variant)
        if (original) {
          setSelectedExercise(original)
        }
      }

      // Load personal record for this exercise
      if (data?.exercise?.id && session?.user?.id) {
        const { data: prData } = await (supabase.rpc as any)(
          'get_personal_record',
          { p_user_id: session.user.id, p_exercise_id: data.exercise.id }
        )
        if (prData) {
          setPersonalRecord(prData)
        }
      }

      setLoading(false)
    }

    loadTag()
  }, [tagId])

  // Handle value input change
  const handleValueChange = (text: string) => {
    const parsed = parseInt(text, 10)
    if (text === '') {
      setValue(null)
    } else if (!isNaN(parsed) && parsed >= 0) {
      setValue(parsed)
    }
  }

  // Handle proof capture
  const handleCaptureProof = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to add proof of your workout.'
        )
        return
      }

      setCapturing(true)

      Alert.alert('Add Proof', 'How would you like to add proof?', [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              quality: 0.8,
              aspect: [1, 1],
            })

            if (!result.canceled && result.assets[0]) {
              setProofUri(result.assets[0].uri)
              setProofType('photo')
            }
            setCapturing(false)
          },
        },
        {
          text: 'Record Video',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: 'videos',
              allowsEditing: true,
              quality: 0.7,
              videoMaxDuration: 15,
            })

            if (!result.canceled && result.assets[0]) {
              setProofUri(result.assets[0].uri)
              setProofType('video')
            }
            setCapturing(false)
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              quality: 0.8,
              aspect: [1, 1],
            })

            if (!result.canceled && result.assets[0]) {
              setProofUri(result.assets[0].uri)
              setProofType('photo')
            }
            setCapturing(false)
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setCapturing(false),
        },
      ])
    } catch (error) {
      console.error('Error capturing proof:', error)
      Alert.alert('Error', 'Failed to capture proof. Please try again.')
      setCapturing(false)
    }
  }

  // Remove proof
  const handleRemoveProof = () => {
    setProofUri(null)
    setProofType(null)
  }

  // Calculate effective value based on selected exercise
  const getEffectiveValue = () => {
    if (value === null || !selectedExercise) return null
    return Math.floor(value * selectedExercise.scaling_factor)
  }

  const effectiveValue = getEffectiveValue()
  const meetsTarget = effectiveValue !== null && effectiveValue >= tag?.value
  const beatsTarget = effectiveValue !== null && effectiveValue > tag?.value

  // Submit response - any effort counts!
  const handleSubmit = async () => {
    if (!session?.user?.id || !tag || value === null || !selectedExercise) {
      Alert.alert('Error', 'Please enter your result')
      return
    }

    // Require at least 1 rep/second
    if (value < 1) {
      Alert.alert('Enter Your Result', 'Log at least 1 to record your effort!')
      return
    }

    setSubmitting(true)

    try {
      // First, get the tag_recipient ID for this user
      const { data: recipient, error: recipientFetchError } = await (supabase
        .from('tag_recipients') as any)
        .select('id')
        .eq('tag_id', tagId)
        .eq('recipient_id', session.user.id)
        .single()

      if (recipientFetchError || !recipient) {
        throw new Error('Could not find your tag invitation')
      }

      // Upload proof if provided
      let proofUrl: string | null = null
      if (proofUri && proofType) {
        const uploadResult = await uploadFromUri(proofUri, {
          pathPrefix: 'tag-proofs',
          identifier: `${recipient.id}-response`,
        })
        if (uploadResult) {
          proofUrl = uploadResult.publicUrl
        }
      }

      // Update the tag_recipient with completion data
      const { error: updateError } = await (supabase
        .from('tag_recipients') as any)
        .update({
          status: 'completed',
          completed_value: value,
          completed_exercise_id: selectedExercise.exercise_id,
          completed_at: new Date().toISOString(),
          proof_url: proofUrl,
          proof_type: proofType,
        })
        .eq('id', recipient.id)

      if (updateError) throw updateError

      // Update streak
      const { error: streakError } = await (supabase.rpc as any)(
        'update_tag_streak',
        {
          p_user_id: session.user.id,
          p_streak_type: 'public',
        }
      )

      if (streakError) {
        console.warn('Failed to update streak:', streakError)
      }

      // Track tag response
      TagEvents.responded({
        tagId: tagId!,
        completedValue: value,
        beatTarget: beatsTarget,
      })

      // Update personal record
      let prResult: { is_new_pr: boolean; previous_best: number | null; improvement: number | null } | null = null
      if (tag.exercise?.id) {
        const { data: prData } = await (supabase.rpc as any)(
          'update_personal_record',
          {
            p_user_id: session.user.id,
            p_exercise_id: tag.exercise.id,
            p_value: effectiveValue || value,
          }
        )
        prResult = prData
      }

      // Haptic feedback on success - extra strong for PR
      haptic(prResult?.is_new_pr ? 'success' : beatsTarget ? 'success' : 'medium')

      // Build success message with PR info
      const usedVariant = selectedExercise.is_variant
      const resultMessage = usedVariant
        ? `You did ${value} ${selectedExercise.exercise_name} (= ${effectiveValue} ${tag.exercise?.name})`
        : `You did ${value} ${tag.exercise?.name}`

      // Build achievement list
      const achievements: string[] = []
      if (beatsTarget) {
        achievements.push(`Exceeded target by ${(effectiveValue || value) - tag.value}!`)
      } else if (meetsTarget) {
        achievements.push('Target matched!')
      }
      if (prResult?.is_new_pr) {
        if (prResult.previous_best) {
          achievements.push(`New PR! +${prResult.improvement} from your previous best of ${prResult.previous_best}`)
        } else {
          achievements.push(`First time logging ${tag.exercise?.name}!`)
        }
      }

      const achievementText = achievements.length > 0
        ? `\n\n${achievements.join('\n')}`
        : ''

      // Determine celebration type: PR > exceeded > meetsTarget > completion
      const celebType: CelebrationType = prResult?.is_new_pr
        ? 'pr'
        : beatsTarget
        ? 'exceeded'
        : 'completion'

      // Build title based on achievements (celebrate any effort!)
      let successTitle = 'Logged!'
      if (prResult?.is_new_pr) {
        successTitle = 'New Personal Record!'
      } else if (beatsTarget) {
        successTitle = 'Crushed It!'
      } else if (meetsTarget) {
        successTitle = 'Target Matched!'
      }

      // Store alert info for after animation
      pendingAlertRef.current = {
        title: successTitle,
        message: `${resultMessage}. ${meetsTarget ? 'Nice work!' : 'Every effort counts!'}${achievementText}`,
        beatsTarget,
      }

      // Trigger celebration animation
      setCelebrationType(celebType)
      setShowCelebration(true)
    } catch (error: any) {
      console.error('Error responding to tag:', error)
      haptic('error')
      Alert.alert('Error', error.message || 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle celebration animation complete
  const handleCelebrationComplete = () => {
    setShowCelebration(false)

    // Show the success alert
    if (pendingAlertRef.current) {
      const { title, message } = pendingAlertRef.current
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Tag Back',
            onPress: () => router.replace('/(auth)/tag/create'),
          },
          {
            text: 'Done',
            style: 'cancel' as const,
            onPress: () => router.back(),
          },
        ]
      )
      pendingAlertRef.current = null
    }
  }

  if (loading) {
    return (
      <KeyboardSafeArea edges={['top']}>
        <YStack flex={1} bg="$background" justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" />
          <Text mt="$4" color="$gray10">Loading tag...</Text>
        </YStack>
      </KeyboardSafeArea>
    )
  }

  if (!tag) {
    return (
      <KeyboardSafeArea edges={['top']}>
        <YStack flex={1} bg="$background" justifyContent="center" alignItems="center" p="$4">
          <Text color="$gray10" textAlign="center">Tag not found</Text>
          <Button mt="$4" onPress={() => router.back()}>Go Back</Button>
        </YStack>
      </KeyboardSafeArea>
    )
  }

  const expiresAt = new Date(tag.expires_at)
  const now = new Date()
  const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
  const isTimeBased = tag.exercise?.type === 'time'
  const hasVariants = validExercises.filter(e => e.is_variant).length > 0

  return (
    <KeyboardSafeArea edges={['top', 'bottom']}>
      <YStack flex={1} bg="$background">
        {/* Celebration Animation Overlay */}
        <CelebrationOverlay
          type={celebrationType}
          visible={showCelebration}
          onComplete={handleCelebrationComplete}
        />

        {/* Header */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <H1 fontSize="$7">Respond to Tag</H1>
          <Button
            size="$3"
            circular
            unstyled
            icon={<X size={24} />}
            onPress={() => router.back()}
          />
        </XStack>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack px="$4" py="$4" gap="$4">
            {/* Tag Details Card */}
            <Card bg="$orange2" p="$5" br="$6" borderWidth={2} borderColor="$orange7">
              <YStack gap="$4">
                {/* Sender Info */}
                <XStack gap="$3" alignItems="center">
                  <YStack
                    width={48}
                    height={48}
                    br="$10"
                    bg="$orange10"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Text color="white" fontWeight="700" fontSize="$5">
                      {(tag.sender?.display_name || 'U')[0].toUpperCase()}
                    </Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text fontWeight="700" fontSize="$5" color="white">
                      {tag.sender?.display_name || 'Someone'}
                    </Text>
                    {/* WCAG: white on $orange2 provides 7.14:1 contrast */}
                    <Text color="white" opacity={0.85} fontSize="$3">tagged you</Text>
                  </YStack>
                  {/* WCAG: Use $orange6 bg with white text for 4.5:1+ contrast */}
                  <XStack gap="$1" alignItems="center" bg="$orange6" px="$3" py="$1.5" br="$10">
                    <Clock size={14} color="white" />
                    <Text color="white" fontWeight="600" fontSize="$2">
                      {hoursLeft}h left
                    </Text>
                  </XStack>
                </XStack>

                {/* Challenge - WHITE CARD needs explicit dark colors for WCAG compliance */}
                <Card bg="white" p="$4" br="$4">
                  <XStack gap="$4" alignItems="center">
                    <YStack
                      width={64}
                      height={64}
                      br="$4"
                      bg="#FFEDD5"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text fontSize={32}>{tag.exercise?.icon || '💪'}</Text>
                    </YStack>
                    <YStack flex={1}>
                      {/* WCAG AA: #9A3412 (orange800) = 5.92:1 contrast on white */}
                      <Text color="#9A3412" fontSize="$2" fontWeight="700" textTransform="uppercase">
                        Can you match this?
                      </Text>
                      {/* WCAG AA: #C2410C (orange700) = 4.52:1 contrast on white */}
                      <Text fontWeight="700" fontSize="$8" color="#C2410C">
                        {tag.value}
                      </Text>
                      {/* WCAG AA: #57534E (gray600) = 7.0:1 contrast on white */}
                      <Text color="#57534E" fontSize="$4">
                        {isTimeBased ? 'seconds' : 'reps'} of {tag.exercise?.name}
                      </Text>
                      {/* Personal record indicator */}
                      {personalRecord?.has_record && (
                        <XStack gap="$2" mt="$1" alignItems="center">
                          <Text color="#7C3AED" fontSize="$3" fontWeight="600">
                            Your best: {personalRecord.best_value}
                          </Text>
                          {personalRecord.last_value !== personalRecord.best_value && (
                            <Text color="#57534E" fontSize="$2">
                              (last: {personalRecord.last_value})
                            </Text>
                          )}
                        </XStack>
                      )}
                      {/* Suggested goal when PR is lower than target */}
                      {personalRecord?.has_record && personalRecord.best_value && personalRecord.best_value < tag.value && (
                        <Text color="#059669" fontSize="$2" mt="$1" fontStyle="italic">
                          Tip: Try for {Math.min(tag.value, Math.ceil(personalRecord.best_value * 1.1))} to set a new PR!
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                </Card>
              </YStack>
            </Card>

            {/* Exercise Selection (if variants available) */}
            {hasVariants && (
              <YStack gap="$2">
                <Text fontWeight="700" fontSize="$5">What did you do?</Text>
                <Text color="$gray10" fontSize="$3">
                  Select the exercise you performed
                </Text>

                {/* Selected Exercise Button */}
                <Card
                  bg="$gray2"
                  p="$3"
                  br="$4"
                  pressStyle={{ bg: '$gray3' }}
                  onPress={() => setShowExerciseSelector(!showExerciseSelector)}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack gap="$3" alignItems="center">
                      <Text fontSize={24}>{selectedExercise?.exercise_icon || '💪'}</Text>
                      <YStack>
                        <Text fontWeight="600" fontSize="$4">
                          {selectedExercise?.exercise_name || 'Select Exercise'}
                        </Text>
                        {selectedExercise?.is_variant && (
                          <XStack gap="$1" alignItems="center">
                            <Text fontSize="$2" color="$orange10">
                              {Math.round(selectedExercise.scaling_factor * 100)}% scaling
                            </Text>
                            <ArrowRight size={10} color="$orange10" />
                            <Text fontSize="$2" color="$orange10">
                              Need {selectedExercise.effective_target} to match
                            </Text>
                          </XStack>
                        )}
                      </YStack>
                    </XStack>
                    <ChevronDown size={20} color="$gray10" />
                  </XStack>
                </Card>

                {/* Exercise Options */}
                {showExerciseSelector && (
                  <YStack gap="$1" bg="$gray1" br="$4" p="$2">
                    {validExercises.map((exercise) => (
                      <Card
                        key={exercise.exercise_id}
                        bg={selectedExercise?.exercise_id === exercise.exercise_id ? '$orange2' : '$background'}
                        p="$3"
                        br="$3"
                        borderWidth={selectedExercise?.exercise_id === exercise.exercise_id ? 2 : 0}
                        borderColor="$orange10"
                        pressStyle={{ bg: '$gray2' }}
                        onPress={() => {
                          haptic('light')
                          setSelectedExercise(exercise)
                          setShowExerciseSelector(false)
                        }}
                      >
                        <XStack justifyContent="space-between" alignItems="center">
                          <XStack gap="$3" alignItems="center">
                            <Text fontSize={20}>{exercise.exercise_icon || '💪'}</Text>
                            <YStack>
                              <XStack gap="$2" alignItems="center">
                                <Text fontWeight="600" fontSize="$3">
                                  {exercise.exercise_name}
                                </Text>
                                {exercise.is_variant && (
                                  <XStack bg="$orange6" px="$1.5" py="$0.5" br="$2">
                                    <Text fontSize={11} color="white" fontWeight="600">
                                      {Math.round(exercise.scaling_factor * 100)}%
                                    </Text>
                                  </XStack>
                                )}
                              </XStack>
                              {exercise.is_variant && (
                                <Text fontSize="$2" color="$gray10">
                                  Need {exercise.effective_target} to match {tag.value}
                                </Text>
                              )}
                            </YStack>
                          </XStack>
                          {selectedExercise?.exercise_id === exercise.exercise_id && (
                            <Check size={18} color="$orange10" />
                          )}
                        </XStack>
                      </Card>
                    ))}
                  </YStack>
                )}
              </YStack>
            )}

            {/* Your Response */}
            <YStack gap="$3">
              <Text fontWeight="700" fontSize="$5">Your Result</Text>
              <Text color="$gray10" fontSize="$3">
                How many {isTimeBased ? 'seconds' : 'reps'} of {selectedExercise?.exercise_name || tag.exercise?.name} did you do?
              </Text>

              <XStack gap="$3" alignItems="center">
                <Input
                  flex={1}
                  size="$6"
                  keyboardType="number-pad"
                  value={value?.toString() || ''}
                  onChangeText={handleValueChange}
                  placeholder={selectedExercise?.effective_target?.toString() || tag.value?.toString() || '0'}
                  textAlign="center"
                  fontSize={32}
                  fontWeight="700"
                />
                <YStack
                  bg="$gray3"
                  px="$4"
                  py="$3"
                  br="$4"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="$gray11" fontSize="$4" fontWeight="600">
                    {isTimeBased ? 'sec' : 'reps'}
                  </Text>
                </YStack>
              </XStack>

              {/* Quick Value Pills - WCAG 2.5.5: 44px minimum touch target */}
              <XStack flexWrap="wrap" gap="$2">
                {[
                  Math.max(1, (selectedExercise?.effective_target || tag.value) - 10),
                  selectedExercise?.effective_target || tag.value,
                  (selectedExercise?.effective_target || tag.value) + 5,
                  (selectedExercise?.effective_target || tag.value) + 10,
                  (selectedExercise?.effective_target || tag.value) + 20,
                ].map((quickValue) => {
                  const qvEffective = selectedExercise
                    ? Math.floor(quickValue * selectedExercise.scaling_factor)
                    : quickValue
                  const qvMeets = qvEffective >= tag.value
                  const qvBeats = qvEffective > tag.value

                  return (
                    <YStack
                      key={quickValue}
                      minWidth={44}
                      minHeight={44}
                      px="$4"
                      py="$3"
                      br="$10"
                      bg={value === quickValue ? '$green10' : qvBeats ? '$green9' : qvMeets ? '$orange9' : '$gray4'}
                      pressStyle={{ scale: 0.95, opacity: 0.8 }}
                      animation="quick"
                      onPress={() => {
                        haptic('light')
                        setValue(quickValue)
                      }}
                      cursor="pointer"
                      justifyContent="center"
                      alignItems="center"
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${quickValue} ${isTimeBased ? 'seconds' : 'reps'}${qvBeats ? ', beats target' : qvMeets ? ', matches target' : ', below target'}`}
                    >
                      {/* WCAG AA: white on $green9/$orange9 provides 4.5:1+ contrast */}
                      <Text
                        color="white"
                        fontSize="$4"
                        fontWeight="600"
                      >
                        {quickValue}{qvBeats ? ' ✓' : qvMeets ? ' =' : ''}
                      </Text>
                    </YStack>
                  )
                })}
              </XStack>

              {/* Proof Section */}
              <YStack gap="$2" mt="$2">
                <Text fontWeight="600" fontSize="$4">
                  Add Proof (Optional)
                </Text>
                <Text color="$gray10" fontSize="$3">
                  Add a photo or video to verify your workout
                </Text>

                {/* WCAG AA: $green12 provides 5.07:1 contrast on $green2 */}
                {proofUri ? (
                  <Card bg="$green2" p="$3" br="$4" borderWidth={1} borderColor="$green7">
                    <XStack justifyContent="space-between" alignItems="center">
                      <XStack gap="$2" alignItems="center">
                        <Camera size={20} color="$green12" />
                        <Text color="$green12" fontWeight="600">
                          {proofType === 'video' ? 'Video added' : 'Photo added'}
                        </Text>
                      </XStack>
                      <Button
                        size="$2"
                        circular
                        bg="$red10"
                        icon={<X size={14} color="white" />}
                        onPress={handleRemoveProof}
                      />
                    </XStack>
                  </Card>
                ) : (
                  <Button
                    size="$5"
                    bg="$gray3"
                    icon={
                      capturing ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <Camera size={24} color="$gray11" />
                      )
                    }
                    onPress={handleCaptureProof}
                    disabled={capturing}
                  >
                    <Text color="$gray11" fontWeight="600">
                      {capturing ? 'Opening Camera...' : 'Add Photo or Video'}
                    </Text>
                  </Button>
                )}
              </YStack>

              {/* Effective Value & Beat Indicator */}
              {value !== null && selectedExercise && (
                <YStack gap="$2">
                  {/* Show effective value if using variant */}
                  {selectedExercise.is_variant && effectiveValue !== null && (
                    <Card bg="$orange2" p="$3" br="$4" borderWidth={1} borderColor="$orange7">
                      <XStack gap="$2" alignItems="center" justifyContent="center">
                        {/* WCAG: $orange12 provides 5.40:1 contrast on $orange2 */}
                        <Text color="$orange12" fontSize="$3">
                          {value} {selectedExercise.exercise_name}
                        </Text>
                        <ArrowRight size={14} color="$orange11" />
                        <Text color="$orange12" fontWeight="700" fontSize="$4">
                          = {effectiveValue} {tag.exercise?.name}
                        </Text>
                      </XStack>
                    </Card>
                  )}

                  {/* Progress indicator - always encouraging */}
                  <Card
                    bg={beatsTarget ? '$green2' : meetsTarget ? '$orange2' : '$blue2'}
                    p="$3"
                    br="$4"
                    borderWidth={1}
                    borderColor={beatsTarget ? '$green7' : meetsTarget ? '$orange7' : '$blue7'}
                  >
                    <XStack gap="$2" alignItems="center" justifyContent="center">
                      <Check size={18} color={beatsTarget ? '$green10' : meetsTarget ? '$orange10' : '$blue10'} />
                      <Text
                        color={beatsTarget ? '$green11' : meetsTarget ? '$orange11' : '$blue11'}
                        fontWeight="600"
                      >
                        {beatsTarget
                          ? `Exceeded by ${(effectiveValue || 0) - tag.value}! Amazing!`
                          : meetsTarget
                          ? 'Target matched! Nice work!'
                          : `${tag.value - (effectiveValue || 0)} more to match target`}
                      </Text>
                    </XStack>
                  </Card>
                </YStack>
              )}
            </YStack>
          </YStack>
        </ScrollView>

        {/* Submit Button */}
        <YStack px="$4" py="$4" borderTopWidth={1} borderTopColor="$gray4" gap="$2">
          <Button
            size="$5"
            bg={value && value > 0 ? '$orange10' : '$gray6'}
            icon={
              submitting || uploadingProof ? (
                <ActivityIndicator color="white" />
              ) : (
                <Send size={20} color="white" />
              )
            }
            onPress={handleSubmit}
            disabled={!value || value < 1 || submitting || uploadingProof}
            opacity={value && value > 0 && !submitting && !uploadingProof ? 1 : 0.5}
            accessible={true}
            accessibilityRole="button"
            accessibilityState={{ disabled: !value || value < 1 || submitting || uploadingProof }}
            accessibilityHint="Submit your workout result"
          >
            <Text color="white" fontWeight="700">
              {uploadingProof
                ? 'Uploading proof...'
                : submitting
                ? 'Submitting...'
                : 'Log My Workout'}
            </Text>
          </Button>
          {/* Encouraging helper text */}
          {value !== null && value > 0 && !meetsTarget && (
            <Text color="$blue10" fontSize="$2" textAlign="center">
              Every rep counts! You can still log this workout.
            </Text>
          )}
        </YStack>
      </YStack>
    </KeyboardSafeArea>
  )
}

export default observer(TagRespondScreen)
