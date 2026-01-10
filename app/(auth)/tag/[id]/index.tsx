import { useState, useEffect } from 'react'
import { ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  ScrollView,
  Avatar,
  View,
} from 'tamagui'
import {
  Clock,
  Zap,
  Check,
  X as XIcon,
  Users,
} from '@tamagui/lucide-icons'
import { SafeArea, HeaderBackButton } from '@/components/ui'

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
        {/* Header - Athletic Broadcast Style */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <HeaderBackButton />
          <Text fontFamily="$display" fontSize={24} letterSpacing={0.5}>
            TAG DETAILS
          </Text>
          <YStack width={40} />
        </XStack>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack px="$4" py="$4" gap="$4">
            {/* Main Tag Card - Athletic Style */}
            <Card
              bg={isExpired ? '$gray2' : '$green2'}
              p="$5"
              br="$4"
              borderWidth={1}
              borderColor={isExpired ? '$gray5' : '$green6'}
              position="relative"
              overflow="hidden"
            >
              {/* Decorative element */}
              <View
                position="absolute"
                top={-40}
                right={-40}
                width={120}
                height={120}
                bg={isExpired ? '$gray4' : '$green4'}
                opacity={0.3}
                br={120}
              />
              <YStack gap="$4">
                {/* Sender Info */}
                <XStack gap="$3" alignItems="center">
                  <Avatar circular size="$5" bg={isExpired ? '$gray8' : '$green9'}>
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
                    <Text fontFamily="$body" fontWeight="700" fontSize="$5">
                      {senderName}
                    </Text>
                    <Text color={isExpired ? '$gray10' : '$green11'} fontSize="$2" fontFamily="$body">
                      sent this tag
                    </Text>
                  </YStack>
                  {/* Time Badge */}
                  <View
                    bg={isExpired ? '$gray6' : '$green9'}
                    px="$3"
                    py="$1.5"
                    br="$2"
                  >
                    <XStack gap="$1" alignItems="center">
                      <Clock size={14} color="white" />
                      <Text fontFamily="$mono" fontWeight="700" color="white" fontSize="$2">
                        {isExpired ? 'FINISHED' : `${hoursLeft}H`}
                      </Text>
                    </XStack>
                  </View>
                </XStack>

                {/* Exercise Details - Scoreboard Style */}
                <Card bg="white" p="$4" br="$3">
                  <XStack gap="$4" alignItems="center">
                    <View
                      width={64}
                      height={64}
                      br="$3"
                      bg={isExpired ? '$gray3' : '$green3'}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text fontSize={32}>{tag.exercise?.icon || '💪'}</Text>
                    </View>
                    <YStack flex={1}>
                      <Text
                        color="$gray10"
                        fontSize="$1"
                        fontFamily="$body"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing={1}
                      >
                        Target
                      </Text>
                      <Text fontFamily="$mono" fontWeight="700" fontSize={48} color={isExpired ? '$gray10' : '$green10'} lineHeight={58}>
                        {tag.value}
                      </Text>
                      <Text color="$gray11" fontSize="$3" fontFamily="$body">
                        {isTimeBased ? 'seconds' : tag.exercise?.unit || 'reps'} of {tag.exercise?.name}
                      </Text>
                    </YStack>
                  </XStack>
                </Card>

                {/* Completion Stats - Athletic Badge */}
                <XStack justifyContent="center">
                  <View bg={isExpired ? '$gray4' : '$green4'} px="$4" py="$2" br="$2">
                    <Text fontFamily="$mono" fontWeight="700" color={isExpired ? '$gray11' : '$green11'} fontSize="$3">
                      {completedCount}/{totalRecipients} COMPLETED
                    </Text>
                  </View>
                </XStack>
              </YStack>
            </Card>

            {/* Recipients List */}
            <YStack gap="$3">
              <Text fontFamily="$display" fontSize={20} letterSpacing={0.5}>
                RECIPIENTS
              </Text>

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
                    bg="$gray2"
                    p="$3"
                    br="$3"
                    borderWidth={1}
                    borderColor="$gray4"
                    position="relative"
                    overflow="hidden"
                  >
                    {/* Status bar on left */}
                    <View
                      position="absolute"
                      left={0}
                      top={0}
                      bottom={0}
                      width={3}
                      bg={
                        isCompleted
                          ? didBeat ? '$green10' : '$coral9'
                          : recipient.status === 'expired'
                          ? '$red8'
                          : '$gray5'
                      }
                    />
                    <XStack gap="$3" alignItems="center">
                      <Avatar circular size="$4" bg="$coral6">
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
                          <Text fontFamily="$body" fontWeight="600" fontSize="$4">
                            {recipientName}
                          </Text>
                          {isSender && (
                            <View bg="$gray4" px="$1.5" py="$0.5" br="$1">
                              <Text fontSize="$1" fontWeight="600" color="$gray10">
                                SENDER
                              </Text>
                            </View>
                          )}
                          {recipient.recipient_id === session?.user?.id && !isSender && (
                            <View bg="$coral5" px="$1.5" py="$0.5" br="$1">
                              <Text color="$coral12" fontSize="$1" fontWeight="700">
                                YOU
                              </Text>
                            </View>
                          )}
                        </XStack>
                        {isCompleted && recipient.completed_value && (
                          <Text fontFamily="$mono" fontWeight="600" color={didBeat ? '$green10' : '$coral10'} fontSize="$3">
                            {recipient.completed_value} {isTimeBased ? 'sec' : tag.exercise?.unit || 'reps'}
                          </Text>
                        )}
                      </YStack>

                      {/* Status Indicator */}
                      <View
                        width={32}
                        height={32}
                        br="$2"
                        bg={
                          isCompleted
                            ? didBeat ? '$green4' : '$coral3'
                            : recipient.status === 'expired'
                            ? '$red3'
                            : '$gray4'
                        }
                        justifyContent="center"
                        alignItems="center"
                      >
                        {isCompleted ? (
                          <Check size={16} color={didBeat ? '$green11' : '$coral11'} />
                        ) : recipient.status === 'expired' ? (
                          <XIcon size={16} color="$red10" />
                        ) : (
                          <Clock size={16} color="$gray10" />
                        )}
                      </View>
                    </XStack>
                  </Card>
                )
              })}
            </YStack>
          </YStack>
        </ScrollView>

        {/* Action Button */}
        {canRespond && (
          <YStack px="$4" py="$4" borderTopWidth={1} borderTopColor="$gray4" bg="$background">
            <Button
              size="$5"
              bg="$coral6"
              br="$3"
              icon={<Zap size={20} color="white" />}
              onPress={() => router.push(`/(auth)/tag/${tagId}/respond` as any)}
              animation="bouncy"
              pressStyle={{ scale: 0.97 }}
            >
              <Text color="white" fontFamily="$body" fontWeight="700">
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
