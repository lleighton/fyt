import { useState, useEffect } from 'react'
import { ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  H1,
  Button,
  Card,
  ScrollView,
  Avatar,
} from 'tamagui'
import {
  ArrowLeft,
  Clock,
  Zap,
  Check,
  X as XIcon,
  Users,
} from '@tamagui/lucide-icons'
import { SafeArea } from '@/components/ui'

import { supabase } from '@/lib/supabase'
import { auth$ } from '@/lib/legend-state/store'

/**
 * Tag Detail Screen
 *
 * Shows tag details including:
 * - Exercise and target value
 * - Sender info
 * - Expiry status
 * - List of recipients with their completion status
 * - Action button to respond if user is a pending recipient
 */
function TagDetailScreen() {
  const router = useRouter()
  const { id: tagId } = useLocalSearchParams<{ id: string }>()
  const session = auth$.session.get()

  const [tag, setTag] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
            first_name,
            avatar_url
          ),
          exercise:exercises (
            id,
            name,
            icon,
            type,
            unit
          ),
          recipients:tag_recipients!tag_recipients_tag_id_fkey (
            id,
            recipient_id,
            status,
            completed_value,
            completed_at,
            profile:profiles (
              id,
              display_name,
              first_name,
              avatar_url
            )
          )
        `)
        .eq('id', tagId)
        .single()

      if (error) {
        console.error('Error loading tag:', error)
        setLoading(false)
        return
      }

      setTag(data)
      setLoading(false)
    }

    loadTag()
  }, [tagId])

  if (loading) {
    return (
      <SafeArea edges={['top']}>
        <YStack flex={1} bg="$background" justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" />
          <Text mt="$4" color="$gray10">Loading tag...</Text>
        </YStack>
      </SafeArea>
    )
  }

  if (!tag) {
    return (
      <SafeArea edges={['top']}>
        <YStack flex={1} bg="$background" justifyContent="center" alignItems="center" p="$4">
          <Text color="$gray10" textAlign="center">Tag not found</Text>
          <Button mt="$4" onPress={() => router.back()}>Go Back</Button>
        </YStack>
      </SafeArea>
    )
  }

  const expiresAt = new Date(tag.expires_at)
  const now = new Date()
  const isExpired = expiresAt < now
  const hoursLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
  const isTimeBased = tag.exercise?.type === 'time'
  const senderName = tag.sender?.display_name || tag.sender?.first_name || 'Someone'

  // Check if current user is a pending recipient
  const userRecipient = tag.recipients?.find(
    (r: any) => r.recipient_id === session?.user?.id
  )
  const canRespond = userRecipient?.status === 'pending' && !isExpired

  // Stats
  const completedCount = tag.recipients?.filter((r: any) => r.status === 'completed').length || 0
  const totalRecipients = tag.recipients?.length || 0

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <Button
            size="$3"
            circular
            unstyled
            icon={<ArrowLeft size={24} />}
            onPress={() => router.back()}
          />
          <H1 fontSize="$6">Tag Details</H1>
          <YStack width={40} />
        </XStack>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack px="$4" py="$4" gap="$4">
            {/* Main Tag Card */}
            <Card
              bg={isExpired ? '$gray2' : '$green2'}
              p="$5"
              br="$6"
              borderWidth={2}
              borderColor={isExpired ? '$gray6' : '$green7'}
            >
              <YStack gap="$4">
                {/* Sender Info */}
                <XStack gap="$3" alignItems="center">
                  <Avatar circular size="$5" bg="$green10">
                    {tag.sender?.avatar_url ? (
                      <Avatar.Image src={tag.sender.avatar_url} />
                    ) : (
                      <Avatar.Fallback justifyContent="center" alignItems="center">
                        <Text color="white" fontWeight="700" fontSize="$4">
                          {senderName[0].toUpperCase()}
                        </Text>
                      </Avatar.Fallback>
                    )}
                  </Avatar>
                  <YStack flex={1}>
                    <Text fontWeight="700" fontSize="$5">
                      {senderName}
                    </Text>
                    <Text color={isExpired ? '$gray10' : '$green11'} fontSize="$3">
                      sent this tag
                    </Text>
                  </YStack>
                  <XStack
                    gap="$1"
                    alignItems="center"
                    bg={isExpired ? '$gray4' : '$green4'}
                    px="$3"
                    py="$1.5"
                    br="$10"
                  >
                    <Clock size={14} color={isExpired ? '$gray10' : '$green10'} />
                    <Text
                      color={isExpired ? '$gray10' : '$green10'}
                      fontWeight="600"
                      fontSize="$3"
                    >
                      {isExpired ? 'Ended' : `${hoursLeft}h left`}
                    </Text>
                  </XStack>
                </XStack>

                {/* Exercise Details */}
                <Card bg="white" p="$4" br="$4">
                  <XStack gap="$4" alignItems="center">
                    <YStack
                      width={64}
                      height={64}
                      br="$4"
                      bg={isExpired ? '$gray4' : '$green4'}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text fontSize={32}>{tag.exercise?.icon || '💪'}</Text>
                    </YStack>
                    <YStack flex={1}>
                      <Text
                        color="$gray11"
                        fontSize="$3"
                        fontWeight="600"
                        textTransform="uppercase"
                      >
                        Target
                      </Text>
                      <Text fontWeight="700" fontSize="$8" color={isExpired ? '$gray10' : '$green10'}>
                        {tag.value}
                      </Text>
                      <Text color="$gray11" fontSize="$4">
                        {isTimeBased ? 'seconds' : tag.exercise?.unit || 'reps'} of {tag.exercise?.name}
                      </Text>
                    </YStack>
                  </XStack>
                </Card>

                {/* Completion Stats */}
                <XStack justifyContent="center" gap="$2">
                  <Text color={isExpired ? '$gray10' : '$green11'} fontSize="$3">
                    {completedCount} of {totalRecipients} completed
                  </Text>
                </XStack>
              </YStack>
            </Card>

            {/* Recipients List */}
            <YStack gap="$3">
              <Text fontWeight="700" fontSize="$5">Recipients</Text>

              {tag.recipients?.map((recipient: any) => {
                const recipientName =
                  recipient.profile?.display_name ||
                  recipient.profile?.first_name ||
                  'User'
                const isCompleted = recipient.status === 'completed'
                const didBeat = isCompleted && recipient.completed_value > tag.value
                const isSender = recipient.recipient_id === tag.sender_id

                return (
                  <Card
                    key={recipient.id}
                    bg="$backgroundHover"
                    p="$3"
                    br="$4"
                  >
                    <XStack gap="$3" alignItems="center">
                      <Avatar circular size="$4" bg="$orange10">
                        {recipient.profile?.avatar_url ? (
                          <Avatar.Image src={recipient.profile.avatar_url} />
                        ) : (
                          <Avatar.Fallback justifyContent="center" alignItems="center">
                            <Users size={18} color="white" />
                          </Avatar.Fallback>
                        )}
                      </Avatar>

                      <YStack flex={1}>
                        <XStack gap="$2" alignItems="center">
                          <Text fontWeight="600" fontSize="$4">
                            {recipientName}
                          </Text>
                          {isSender && (
                            <Text fontSize="$3" color="$gray10">
                              (sender)
                            </Text>
                          )}
                          {recipient.recipient_id === session?.user?.id && !isSender && (
                            <Text fontSize="$3" color="$orange10" fontWeight="600">
                              (you)
                            </Text>
                          )}
                        </XStack>
                        {isCompleted && recipient.completed_value && (
                          <Text color="$gray10" fontSize="$3">
                            Did {recipient.completed_value} {isTimeBased ? 'seconds' : tag.exercise?.unit || 'reps'}
                          </Text>
                        )}
                      </YStack>

                      {/* Status Indicator */}
                      <YStack
                        width={32}
                        height={32}
                        br="$10"
                        bg={
                          isCompleted
                            ? didBeat
                              ? '$green10'
                              : '$orange10'
                            : recipient.status === 'expired'
                            ? '$red4'
                            : '$gray4'
                        }
                        justifyContent="center"
                        alignItems="center"
                      >
                        {isCompleted ? (
                          <Check size={18} color="white" />
                        ) : recipient.status === 'expired' ? (
                          <XIcon size={18} color="$red10" />
                        ) : (
                          <Clock size={16} color="$gray10" />
                        )}
                      </YStack>
                    </XStack>
                  </Card>
                )
              })}
            </YStack>
          </YStack>
        </ScrollView>

        {/* Action Button */}
        {canRespond && (
          <YStack px="$4" py="$4" borderTopWidth={1} borderTopColor="$gray4">
            <Button
              size="$5"
              bg="$orange10"
              icon={<Zap size={20} color="white" />}
              onPress={() => router.push(`/(auth)/tag/${tagId}/respond` as any)}
            >
              <Text color="white" fontWeight="700">
                Respond to Tag
              </Text>
            </Button>
          </YStack>
        )}
      </YStack>
    </SafeArea>
  )
}

export default observer(TagDetailScreen)
