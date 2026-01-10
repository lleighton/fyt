import { useState, useEffect } from 'react'
import { Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, Button, ScrollView, View } from 'tamagui'
import { X, ChevronLeft, ChevronRight, Send } from '@tamagui/lucide-icons'
import { SafeArea, HeaderBackButton } from '@/components/ui'

import { supabase } from '@/lib/supabase'
import { auth$ } from '@/lib/legend-state/store'
import { TagEvents } from '@/lib/analytics'
import { useSettings } from '@/lib/settings-context'
import { ExerciseSelector, ResultInput, RecipientSelector } from '@/components/tag'
import type { Database } from '@/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface TagForm {
  // Step 1: Exercise
  exercise: Exercise | null

  // Step 2: Result
  value: number | null
  proofUri: string | null
  proofType: 'photo' | 'video' | null

  // Step 3: Recipients
  selectedFriends: string[]
  selectedGroups: string[]
  isPublic: boolean
}

const INITIAL_FORM: TagForm = {
  exercise: null,
  value: null,
  proofUri: null,
  proofType: null,
  selectedFriends: [],
  selectedGroups: [],
  isPublic: true,
}

const STEP_TITLES = ['Choose Exercise', 'Log Your Result', 'Tag Recipients']

/**
 * Create Tag Screen - 3-step wizard
 *
 * Step 1: Select exercise from bodyweight list
 * Step 2: Enter your result (reps or time) + optional proof
 * Step 3: Select friends/groups to tag
 */
function CreateTagScreen() {
  const router = useRouter()
  const { groupId } = useLocalSearchParams<{ groupId?: string }>()
  const session = auth$.session.get()
  const { settings, haptic } = useSettings()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<TagForm>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)

  // Pre-select group if coming from group detail page
  useEffect(() => {
    if (groupId && !form.selectedGroups.includes(groupId)) {
      setForm((prev) => ({
        ...prev,
        selectedGroups: [...prev.selectedGroups, groupId],
      }))
    }
  }, [groupId])

  // Update form helper
  const updateForm = (updates: Partial<TagForm>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  // Validation per step
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return form.exercise !== null
      case 2:
        return form.value !== null && form.value > 0
      case 3:
        return form.selectedFriends.length > 0 || form.selectedGroups.length > 0
      default:
        return false
    }
  }

  // Navigation
  const handleNext = () => {
    if (step < 3 && canProceed()) {
      haptic('light')
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      haptic('light')
      setStep(step - 1)
    }
  }

  // Create the tag
  const handleCreateTag = async () => {
    if (!session?.user?.id || !form.exercise || !form.value) {
      Alert.alert('Error', 'Missing required information')
      return
    }

    if (form.selectedFriends.length === 0 && form.selectedGroups.length === 0) {
      Alert.alert('Error', 'Please select at least one recipient')
      return
    }

    setLoading(true)

    try {
      // Calculate expiry based on user's preferred tag duration
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + settings.preferences.defaultTagDuration)

      // 1. Create the tag record
      // Use the first selected group as the tag's group_id (for goal tracking)
      const tagGroupId = form.selectedGroups.length > 0 ? form.selectedGroups[0] : null

      const { data: tagData, error: tagError } = await (supabase
        .from('tags') as any)
        .insert({
          sender_id: session.user.id,
          exercise_id: form.exercise.id,
          value: form.value,
          is_public: form.isPublic,
          expires_at: expiresAt.toISOString(),
          group_id: tagGroupId, // Link to group for goal tracking
          // proof_url would be uploaded separately if we implement storage
        })
        .select()
        .single()

      if (tagError) throw tagError
      const tag = tagData as { id: string }

      // 2. Create tag_recipients for each friend
      const friendRecipients = form.selectedFriends.map((friendId) => ({
        tag_id: tag.id,
        recipient_id: friendId,
        status: 'pending' as const,
      }))

      // 3. Create tag_recipients for each group member
      // For groups, we need to get all members and create recipients for each
      const groupRecipients: any[] = []

      if (form.selectedGroups.length > 0) {
        // Fetch group members
        const { data: groupMembers } = await (supabase
          .from('group_members') as any)
          .select('user_id, group_id')
          .in('group_id', form.selectedGroups)
          .neq('user_id', session.user.id) // Exclude self

        if (groupMembers) {
          // Dedupe by user_id (user might be in multiple selected groups)
          const seenUsers = new Set(form.selectedFriends)
          ;(groupMembers as any[]).forEach((member) => {
            if (!seenUsers.has(member.user_id)) {
              seenUsers.add(member.user_id)
              groupRecipients.push({
                tag_id: tag.id,
                recipient_id: member.user_id,
                status: 'pending' as const,
              })
            }
          })
        }
      }

      // Insert all recipients (including sender as completed)
      const senderRecipient = {
        tag_id: tag.id,
        recipient_id: session.user.id,
        status: 'completed' as const,
        completed_value: form.value, // Sender's score is their completed value
        completed_at: new Date().toISOString(), // Set completion timestamp for goal tracking
      }

      const allRecipients = [senderRecipient, ...friendRecipients, ...groupRecipients]

      const { error: recipientsError } = await (supabase
        .from('tag_recipients') as any)
        .insert(allRecipients)

      if (recipientsError) throw recipientsError

      // 4. Record sender's completion (activity record)
      const { error: completionError } = await (supabase.rpc as any)(
        'record_tag_send_completion',
        {
          p_tag_id: tag.id,
          p_sender_id: session.user.id,
          p_value: form.value,
        }
      )

      if (completionError) {
        console.warn('Failed to record sender completion:', completionError)
        // Don't fail - tag is created, this is for activity tracking
      }

      // 4b. Update sender's personal record
      if (form.exercise?.id) {
        const { error: prError } = await (supabase.rpc as any)(
          'update_personal_record',
          {
            p_user_id: session.user.id,
            p_exercise_id: form.exercise.id,
            p_value: form.value,
          }
        )
        if (prError) {
          console.warn('Failed to update personal record:', prError)
        }
      }

      // 5. Update the sender's tag streak
      if (form.isPublic) {
        // Update public streak
        const { error: streakError } = await (supabase
          .rpc as any)('update_tag_streak', {
            p_user_id: session.user.id,
            p_streak_type: 'public',
          })

        if (streakError) {
          console.warn('Failed to update streak:', streakError)
        }
      }

      // 6. Send push notifications to recipients
      try {
        await supabase.functions.invoke('send-tag-notification', {
          body: { tag_id: tag.id },
        })
      } catch (notifError) {
        console.warn('Failed to send push notifications:', notifError)
        // Don't fail the whole operation
      }

      // Track tag creation
      TagEvents.created({
        exerciseId: form.exercise.id,
        value: form.value,
        recipientCount: allRecipients.length - 1, // Exclude sender
        isPublic: form.isPublic,
      })
      TagEvents.sent({
        tagId: tag.id,
        recipientCount: allRecipients.length - 1,
      })

      // Success - trigger haptic feedback
      haptic('success')

      // Success!
      Alert.alert(
        'Tag Sent!',
        `You tagged ${allRecipients.length} ${allRecipients.length === 1 ? 'person' : 'people'} with ${form.value} ${form.exercise.name}. They have ${settings.preferences.defaultTagDuration} hours to respond!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      )
    } catch (error: any) {
      console.error('Error creating tag:', error)
      haptic('error')
      Alert.alert('Error', error.message || 'Failed to create tag. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeArea edges={['top', 'bottom']}>
      <YStack flex={1} bg="$background" width="100%">
        {/* Header - Athletic Broadcast Style */}
        <XStack px="$4" py="$4" justifyContent="space-between" alignItems="center">
          <YStack gap="$0.5">
            <Text
              color="$gray10"
              fontSize="$2"
              fontFamily="$body"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing={1.2}
            >
              New Challenge
            </Text>
            <Text
              fontFamily="$display"
              fontSize={32}
              color="$color"
              letterSpacing={1}
            >
              TAG SOMEONE
            </Text>
          </YStack>
          <HeaderBackButton variant="close" />
        </XStack>

        {/* Progress Indicator - Scoreboard Style */}
        <XStack px="$4" py="$2" gap="$2" alignItems="center">
          {[1, 2, 3].map((i) => (
            <View key={i} flex={1} position="relative">
              <View
                height={3}
                br="$1"
                bg={i <= step ? '$coral6' : '$gray4'}
              />
              {i === step && (
                <View
                  position="absolute"
                  top={-4}
                  left="50%"
                  transform={[{ translateX: -5 }]}
                  width={10}
                  height={10}
                  br={10}
                  bg="$coral6"
                  borderWidth={2}
                  borderColor="$background"
                />
              )}
            </View>
          ))}
        </XStack>

        {/* Step Title */}
        <XStack px="$4" py="$3" gap="$2" alignItems="center">
          <View bg="$coral5" px="$2" py="$1" br="$2">
            <Text
              fontFamily="$mono"
              fontWeight="700"
              fontSize="$2"
              color="$coral12"
            >
              {step}/3
            </Text>
          </View>
          <Text
            color="$gray11"
            fontSize="$3"
            fontFamily="$body"
            fontWeight="500"
          >
            {STEP_TITLES[step - 1]}
          </Text>
        </XStack>

        {/* Step Content */}
        <YStack flex={1} px="$4" py="$2">
          {step === 1 && (
            <ExerciseSelector
              selectedExercise={form.exercise}
              onSelectExercise={(exercise) => updateForm({ exercise })}
            />
          )}

          {step === 2 && form.exercise && (
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
              <ResultInput
                exercise={form.exercise}
                value={form.value}
                onValueChange={(value) => updateForm({ value })}
                proofUri={form.proofUri}
                proofType={form.proofType}
                onProofChange={(uri, type) =>
                  updateForm({ proofUri: uri, proofType: type })
                }
              />
            </ScrollView>
          )}

          {step === 3 && (
            <RecipientSelector
              selectedFriends={form.selectedFriends}
              selectedGroups={form.selectedGroups}
              isPublic={form.isPublic}
              onToggleFriend={(userId) => {
                const current = form.selectedFriends
                if (current.includes(userId)) {
                  updateForm({
                    selectedFriends: current.filter((id) => id !== userId),
                  })
                } else {
                  updateForm({ selectedFriends: [...current, userId] })
                }
              }}
              onToggleGroup={(groupId) => {
                const current = form.selectedGroups
                if (current.includes(groupId)) {
                  updateForm({
                    selectedGroups: current.filter((id) => id !== groupId),
                  })
                } else {
                  updateForm({ selectedGroups: [...current, groupId] })
                }
              }}
              onTogglePublic={(isPublic) => updateForm({ isPublic })}
            />
          )}
        </YStack>

        {/* Navigation Footer */}
        <YStack px="$4" py="$4" gap="$3" borderTopWidth={1} borderTopColor="$gray4" bg="$background">
          {/* Preview summary on step 3 */}
          {step === 3 && form.exercise && form.value && (
            <View bg="$gray2" p="$3" br="$3" borderWidth={1} borderColor="$gray4">
              <XStack alignItems="center" gap="$2">
                <Text fontSize={24}>{form.exercise.icon}</Text>
                <YStack flex={1}>
                  <Text fontFamily="$body" fontWeight="600" color="$color">
                    {form.exercise.name}
                  </Text>
                  <Text fontFamily="$mono" fontWeight="700" color="$coral10">
                    {form.value} {form.exercise.type === 'time' ? 'seconds' : 'reps'}
                  </Text>
                </YStack>
              </XStack>
            </View>
          )}

          <XStack gap="$3" alignItems="center">
            {step > 1 && (
              <Button
                flex={1}
                size="$5"
                bg="$gray3"
                br="$3"
                borderWidth={1}
                borderColor="$gray5"
                icon={<ChevronLeft size={20} color="$gray11" />}
                onPress={handleBack}
                disabled={loading}
              >
                <Text fontFamily="$body" fontWeight="600">Back</Text>
              </Button>
            )}

            <Button
              flex={step > 1 ? 2 : 1}
              size="$5"
              bg="$coral6"
              br="$3"
              iconAfter={step < 3 ? <ChevronRight size={20} color="white" /> : undefined}
              icon={
                step === 3 ? (
                  loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Send size={20} color="white" />
                  )
                ) : undefined
              }
              onPress={step < 3 ? handleNext : handleCreateTag}
              disabled={!canProceed() || (step === 3 && loading)}
              opacity={canProceed() && !(step === 3 && loading) ? 1 : 0.5}
              animation="bouncy"
              pressStyle={{ scale: 0.97 }}
            >
              <Text color="white" fontFamily="$body" fontWeight="700">
                {step < 3 ? 'Next' : loading ? 'Sending...' : 'Send Tag'}
              </Text>
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </SafeArea>
  )
}

export default observer(CreateTagScreen)
