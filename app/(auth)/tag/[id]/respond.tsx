import { useState, useEffect } from 'react'
import { Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, H1, Button, Card, Input, ScrollView } from 'tamagui'
import { X, Send, Clock, Check } from '@tamagui/lucide-icons'
import { KeyboardSafeArea } from '@/components/ui'

import { supabase } from '@/lib/supabase'
import { auth$ } from '@/lib/legend-state/store'
import { TagEvents } from '@/lib/analytics'

/**
 * Tag Response Screen
 *
 * Shows the tag details and allows user to respond with their result
 */
function TagRespondScreen() {
  const router = useRouter()
  const { id: tagId } = useLocalSearchParams<{ id: string }>()
  const session = auth$.session.get()

  const [tag, setTag] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [value, setValue] = useState<number | null>(null)

  // Load tag details
  useEffect(() => {
    const loadTag = async () => {
      if (!tagId) return

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

  // Submit response
  const handleSubmit = async () => {
    if (!session?.user?.id || !tag || value === null) {
      Alert.alert('Error', 'Please enter your result')
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

      // Use the RPC function to create completion and update recipient atomically
      const { error: completionError } = await (supabase.rpc as any)(
        'complete_tag_response',
        {
          p_tag_recipient_id: recipient.id,
          p_value: value,
          p_proof_url: null,
          p_proof_type: null,
        }
      )

      if (completionError) throw completionError

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

      // Determine if user beat the tag
      const didBeat = value > tag.value

      // Track tag response
      TagEvents.responded({
        tagId: tagId!,
        completedValue: value,
        beatTarget: didBeat,
      })

      Alert.alert(
        didBeat ? 'You Beat It!' : 'Nice Try!',
        didBeat
          ? `You did ${value} vs their ${tag.value}. Tag them back with a new challenge!`
          : `You did ${value} vs their ${tag.value}. Keep training and try again next time!`,
        [
          {
            text: didBeat ? 'Tag Back' : 'OK',
            onPress: () => {
              if (didBeat) {
                router.replace('/(auth)/tag/create')
              } else {
                router.back()
              }
            },
          },
          ...(didBeat ? [{
            text: 'Later',
            style: 'cancel' as const,
            onPress: () => router.back(),
          }] : []),
        ]
      )
    } catch (error: any) {
      console.error('Error responding to tag:', error)
      Alert.alert('Error', error.message || 'Failed to submit response')
    } finally {
      setSubmitting(false)
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

  return (
    <KeyboardSafeArea edges={['top', 'bottom']}>
      <YStack flex={1} bg="$background">
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
                    <Text fontWeight="700" fontSize="$5">
                      {tag.sender?.display_name || 'Someone'}
                    </Text>
                    <Text color="$orange11" fontSize="$3">tagged you</Text>
                  </YStack>
                  <XStack gap="$1" alignItems="center" bg="$orange4" px="$3" py="$1.5" br="$10">
                    <Clock size={14} color="$orange10" />
                    <Text color="$orange10" fontWeight="600" fontSize="$2">
                      {hoursLeft}h left
                    </Text>
                  </XStack>
                </XStack>

                {/* Challenge */}
                <Card bg="white" p="$4" br="$4">
                  <XStack gap="$4" alignItems="center">
                    <YStack
                      width={64}
                      height={64}
                      br="$4"
                      bg="$orange4"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text fontSize={32}>{tag.exercise?.icon || '💪'}</Text>
                    </YStack>
                    <YStack flex={1}>
                      <Text color="$gray11" fontSize="$2" fontWeight="600" textTransform="uppercase">
                        Beat this
                      </Text>
                      <Text fontWeight="700" fontSize="$8" color="$orange10">
                        {tag.value}
                      </Text>
                      <Text color="$gray11" fontSize="$4">
                        {isTimeBased ? 'seconds' : 'reps'} of {tag.exercise?.name}
                      </Text>
                    </YStack>
                  </XStack>
                </Card>
              </YStack>
            </Card>

            {/* Your Response */}
            <YStack gap="$3">
              <Text fontWeight="700" fontSize="$5">Your Result</Text>
              <Text color="$gray10" fontSize="$3">
                How many {isTimeBased ? 'seconds' : 'reps'} did you do?
              </Text>

              <XStack gap="$3" alignItems="center">
                <Input
                  flex={1}
                  size="$6"
                  keyboardType="number-pad"
                  value={value?.toString() || ''}
                  onChangeText={handleValueChange}
                  placeholder={tag.value?.toString() || '0'}
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
                    {isTimeBased ? 'seconds' : 'reps'}
                  </Text>
                </YStack>
              </XStack>

              {/* Quick Value Pills */}
              <XStack flexWrap="wrap" gap="$2">
                {[
                  Math.max(1, tag.value - 10),
                  tag.value,
                  tag.value + 5,
                  tag.value + 10,
                  tag.value + 20,
                ].map((quickValue) => (
                  <YStack
                    key={quickValue}
                    px="$3"
                    py="$2"
                    br="$10"
                    bg={value === quickValue ? '$green10' : quickValue > tag.value ? '$green3' : '$gray3'}
                    pressStyle={{ scale: 0.95, opacity: 0.8 }}
                    animation="quick"
                    onPress={() => setValue(quickValue)}
                    cursor="pointer"
                  >
                    <Text
                      color={value === quickValue ? 'white' : quickValue > tag.value ? '$green11' : '$gray11'}
                      fontSize="$3"
                      fontWeight="600"
                    >
                      {quickValue}{quickValue > tag.value ? ' ✓' : ''}
                    </Text>
                  </YStack>
                ))}
              </XStack>

              {/* Beat Indicator */}
              {value !== null && (
                <Card
                  bg={value > tag.value ? '$green2' : '$red2'}
                  p="$3"
                  br="$4"
                  borderWidth={1}
                  borderColor={value > tag.value ? '$green7' : '$red7'}
                >
                  <XStack gap="$2" alignItems="center" justifyContent="center">
                    <Check size={18} color={value > tag.value ? '$green10' : '$red10'} />
                    <Text
                      color={value > tag.value ? '$green11' : '$red11'}
                      fontWeight="600"
                    >
                      {value > tag.value
                        ? `You beat them by ${value - tag.value}!`
                        : value === tag.value
                        ? 'Tied! Need to beat, not match.'
                        : `${tag.value - value} short of beating them`}
                    </Text>
                  </XStack>
                </Card>
              )}
            </YStack>
          </YStack>
        </ScrollView>

        {/* Submit Button */}
        <YStack px="$4" py="$4" borderTopWidth={1} borderTopColor="$gray4">
          <Button
            size="$5"
            bg="$green10"
            icon={
              submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Send size={20} color="white" />
              )
            }
            onPress={handleSubmit}
            disabled={value === null || submitting}
            opacity={value !== null && !submitting ? 1 : 0.5}
          >
            <Text color="white" fontWeight="700">
              {submitting ? 'Submitting...' : 'Submit Result'}
            </Text>
          </Button>
        </YStack>
      </YStack>
    </KeyboardSafeArea>
  )
}

export default observer(TagRespondScreen)
