import { useState, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { observer } from '@legendapp/state/react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  ScrollView,
} from 'tamagui'
import { Plus, Send, Inbox, CheckCircle, XCircle, Clock, ChevronRight } from '@tamagui/lucide-icons'
import { SafeArea } from '@/components/ui'

import { auth$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'

/**
 * Tags screen
 *
 * Shows all tags the user has sent and received,
 * organized by filter: Sent, Received, Completed
 */
function TagsScreen() {
  const router = useRouter()
  const session = auth$.session.get()

  const [activeFilter, setActiveFilter] = useState<'sent' | 'received' | 'completed'>('sent')
  const [sentTags, setSentTags] = useState<any[]>([])
  const [receivedTags, setReceivedTags] = useState<any[]>([])
  const [completedTags, setCompletedTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadTags = async () => {
        if (!session?.user) return
        setLoading(true)

        try {
          console.log('[TagsScreen] Loading tags for user:', session.user.id)

          // Load tags sent by user
          const { data: sentData, error: sentError } = await (supabase
            .from('tags') as any)
            .select(`
              id,
              value,
              is_public,
              expires_at,
              created_at,
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
                recipient:profiles!tag_recipients_recipient_id_fkey (
                  id,
                  display_name,
                  avatar_url
                )
              )
            `)
            .eq('sender_id', session.user.id)
            .eq('deleted', false)
            .order('created_at', { ascending: false })

          if (sentError) {
            console.error('[TagsScreen] Error loading sent tags:', sentError)
          } else {
            console.log('[TagsScreen] Loaded sent tags:', sentData?.length || 0)
          }

          setSentTags(sentData || [])

          // Load tags received by user (as recipient)
          const { data: receivedData, error: receivedError } = await (supabase
            .from('tag_recipients') as any)
            .select(`
              id,
              status,
              completed_value,
              created_at,
              tag:tags!tag_recipients_tag_id_fkey (
                id,
                value,
                expires_at,
                created_at,
                sender_id,
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
              )
            `)
            .eq('recipient_id', session.user.id)
            .order('created_at', { ascending: false })

          if (receivedError) {
            console.error('[TagsScreen] Error loading received tags:', receivedError)
          }

          // Split received tags into pending/active and completed
          const pending: any[] = []
          const completed: any[] = []

          ;(receivedData || []).forEach((tr: any) => {
            if (!tr.tag) return
            // Sender's own completed record goes to "Done"
            // Other users' pending tags go to "Pending"
            if (tr.status === 'completed' || tr.status === 'beaten') {
              completed.push(tr)
            } else if (tr.tag.sender_id !== session.user.id) {
              // Only show pending tags from others (not self)
              pending.push(tr)
            }
          })

          setReceivedTags(pending)
          setCompletedTags(completed)
        } catch (error) {
          console.error('[TagsScreen] Error loading tags:', error)
        } finally {
          setLoading(false)
        }
      }

      loadTags()
    }, [session])
  )

  return (
    <SafeArea edges={['top']}>
      <ScrollView flex={1} bg="$background">
        <YStack px="$4" py="$4" gap="$4">
          {/* Header - Athletic Broadcast Style */}
          <YStack gap="$1">
            <Text
              color="$gray10"
              fontSize="$2"
              fontFamily="$body"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing={1.2}
            >
              Your Activity
            </Text>
            <XStack justifyContent="space-between" alignItems="center">
              <Text
                fontFamily="$display"
                fontSize={40}
                color="$color"
                letterSpacing={1}
              >
                TAGS
              </Text>
              <Button
                size="$4"
                bg="$coral6"
                icon={<Plus size={20} color="white" />}
                circular
                onPress={() => router.push('/(auth)/tag/create')}
              />
            </XStack>
          </YStack>

          {/* Filter Cards - WCAG AA compliant with orange brand */}
          <XStack gap="$3">
            <Card
              flex={1}
              bg={activeFilter === 'sent' ? '$orange6' : '$gray3'}
              p="$4"
              br="$5"
              borderWidth={activeFilter === 'sent' ? 2 : 0}
              borderColor="$orange10"
              pressStyle={{ scale: 0.97, opacity: 0.9 }}
              animation="quick"
              onPress={() => setActiveFilter('sent')}
            >
              <YStack gap="$1" alignItems="center">
                <Text fontSize={28} fontWeight="700" color={activeFilter === 'sent' ? 'white' : '$gray12'}>
                  {sentTags.length}
                </Text>
                <Text color={activeFilter === 'sent' ? 'white' : '$gray11'} fontSize="$3" fontWeight="600">
                  Sent
                </Text>
              </YStack>
            </Card>
            <Card
              flex={1}
              bg={activeFilter === 'received' ? '$orange6' : '$gray3'}
              p="$4"
              br="$5"
              borderWidth={activeFilter === 'received' ? 2 : 0}
              borderColor="$orange10"
              pressStyle={{ scale: 0.97, opacity: 0.9 }}
              animation="quick"
              onPress={() => setActiveFilter('received')}
            >
              <YStack gap="$1" alignItems="center">
                <Text fontSize={28} fontWeight="700" color={activeFilter === 'received' ? 'white' : '$gray12'}>
                  {receivedTags.length}
                </Text>
                <Text color={activeFilter === 'received' ? 'white' : '$gray11'} fontSize="$3" fontWeight="600">
                  Pending
                </Text>
              </YStack>
            </Card>
            <Card
              flex={1}
              bg={activeFilter === 'completed' ? '$orange6' : '$gray3'}
              p="$4"
              br="$5"
              borderWidth={activeFilter === 'completed' ? 2 : 0}
              borderColor="$orange10"
              pressStyle={{ scale: 0.97, opacity: 0.9 }}
              animation="quick"
              onPress={() => setActiveFilter('completed')}
            >
              <YStack gap="$1" alignItems="center">
                <Text fontSize={28} fontWeight="700" color={activeFilter === 'completed' ? 'white' : '$gray12'}>
                  {completedTags.length}
                </Text>
                <Text color={activeFilter === 'completed' ? 'white' : '$gray11'} fontSize="$3" fontWeight="600">
                  Done
                </Text>
              </YStack>
            </Card>
          </XStack>

          {/* Tag List */}
          <YStack gap="$3">
            {activeFilter === 'sent' && (
              <>
                {sentTags.length === 0 ? (
                  <EmptyState
                    icon={<Send size={40} color="$gray10" />}
                    title="No tags sent yet"
                    subtitle="Challenge a friend to beat your workout!"
                    actionLabel="Send a Tag"
                    onAction={() => router.push('/(auth)/tag/create')}
                  />
                ) : (
                  sentTags.map((tag: any) => (
                    <SentTagCard
                      key={tag.id}
                      tag={tag}
                      onPress={() => router.push(`/(auth)/tag/${tag.id}` as any)}
                    />
                  ))
                )}
              </>
            )}

            {activeFilter === 'received' && (
              <>
                {receivedTags.length === 0 ? (
                  <EmptyState
                    icon={<Inbox size={40} color="$gray10" />}
                    title="No pending tags"
                    subtitle="You're all caught up! No one has tagged you recently."
                  />
                ) : (
                  receivedTags.map((tagRecipient: any) => (
                    <ReceivedTagCard
                      key={tagRecipient.id}
                      tagRecipient={tagRecipient}
                      onPress={() => router.push(`/(auth)/tag/${tagRecipient.tag?.id}/respond` as any)}
                    />
                  ))
                )}
              </>
            )}

            {activeFilter === 'completed' && (
              <>
                {completedTags.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle size={40} color="$gray10" />}
                    title="No completed tags"
                    subtitle="Complete a tag challenge to see it here!"
                  />
                ) : (
                  completedTags.map((tagRecipient: any) => (
                    <CompletedTagCard
                      key={tagRecipient.id}
                      tagRecipient={tagRecipient}
                      currentUserId={session?.user?.id}
                      onPress={() => router.push(`/(auth)/tag/${tagRecipient.tag?.id}` as any)}
                    />
                  ))
                )}
              </>
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </SafeArea>
  )
}

/**
 * Empty state component
 */
function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <Card
      bg="$gray2"
      p="$5"
      br="$6"
      borderWidth={0}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={8}
      elevation={2}
    >
      <YStack alignItems="center" gap="$3">
        {icon}
        <Text color="$gray12" textAlign="center" fontSize="$4" fontWeight="600">
          {title}
        </Text>
        <Text color="$gray10" textAlign="center" fontSize="$3">
          {subtitle}
        </Text>
        {actionLabel && onAction && (
          <Button
            mt="$2"
            size="$4"
            bg="$orange6"
            icon={<Plus size={20} color="white" />}
            onPress={onAction}
          >
            <Text color="white" fontWeight="600">{actionLabel}</Text>
          </Button>
        )}
      </YStack>
    </Card>
  )
}

/**
 * Sent tag card component
 */
function SentTagCard({
  tag,
  onPress,
}: {
  tag: any
  onPress: () => void
}) {
  const expiresAt = new Date(tag.expires_at)
  const now = new Date()
  const isExpired = expiresAt < now
  const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))

  // Count recipients by status
  const recipients = tag.recipients || []
  const completedCount = recipients.filter((r: any) => r.status === 'completed' || r.status === 'beaten').length
  const pendingCount = recipients.filter((r: any) => r.status === 'pending').length

  return (
    <Card
      bg="$gray2"
      p="$4"
      br="$5"
      borderWidth={0}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={1}
      pressStyle={{ scale: 0.98, bg: '$gray3' }}
      animation="quick"
      onPress={onPress}
    >
      <XStack gap="$3" alignItems="center">
        <YStack
          width={48}
          height={48}
          br="$4"
          bg="$orange3"
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={24}>{tag.exercise?.icon || '💪'}</Text>
        </YStack>
        <YStack flex={1} gap="$1">
          <Text fontWeight="700" fontSize="$4">
            {tag.value} {tag.exercise?.type === 'time' ? 'sec' : 'reps'} of {tag.exercise?.name}
          </Text>
          <XStack gap="$2" alignItems="center">
            <Text color="$gray11" fontSize="$3">
              Sent to {recipients.length} {recipients.length === 1 ? 'person' : 'people'}
            </Text>
            {/* WCAG AA: white on $green9 provides 4.5:1+ contrast */}
            {completedCount > 0 && (
              <XStack bg="$green9" px="$2" py="$1" br="$2">
                <Text color="white" fontSize="$3" fontWeight="600">
                  {completedCount} done
                </Text>
              </XStack>
            )}
          </XStack>
          <XStack gap="$1" alignItems="center">
            <Clock size={12} color={isExpired ? '$red10' : '$gray10'} />
            <Text color={isExpired ? '$red10' : '$gray10'} fontSize="$3">
              {isExpired ? 'Ended' : `${hoursLeft}h left`}
            </Text>
          </XStack>
        </YStack>
        <ChevronRight size={20} color="$gray10" />
      </XStack>
    </Card>
  )
}

/**
 * Received tag card component (pending)
 */
function ReceivedTagCard({
  tagRecipient,
  onPress,
}: {
  tagRecipient: any
  onPress: () => void
}) {
  const tag = tagRecipient.tag
  if (!tag) return null

  const expiresAt = new Date(tag.expires_at)
  const now = new Date()
  const isExpired = expiresAt < now
  const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))

  return (
    <Card
      bg="$orange2"
      p="$4"
      br="$5"
      borderWidth={2}
      borderColor="$orange7"
      pressStyle={{ scale: 0.98, bg: '$orange3' }}
      animation="quick"
      onPress={onPress}
    >
      <XStack gap="$3" alignItems="center">
        <YStack
          width={48}
          height={48}
          br="$4"
          bg="$orange4"
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={24}>{tag.exercise?.icon || '💪'}</Text>
        </YStack>
        <YStack flex={1} gap="$1">
          <Text fontWeight="700" fontSize="$4">
            {tag.sender?.display_name || 'Someone'} tagged you
          </Text>
          {/* WCAG: $orange12 provides 5.40:1 contrast on $orange2 */}
          <Text color="$orange12" fontSize="$3">
            {tag.value} {tag.exercise?.type === 'time' ? 'sec' : 'reps'} of {tag.exercise?.name}
          </Text>
          <XStack gap="$1" alignItems="center">
            <Clock size={12} color={isExpired ? '$red10' : '$orange12'} />
            <Text color={isExpired ? '$red10' : '$orange12'} fontSize="$3" fontWeight="600">
              {isExpired ? 'Ended' : `${hoursLeft}h left to respond`}
            </Text>
          </XStack>
        </YStack>
        <ChevronRight size={20} color="$orange12" />
      </XStack>
    </Card>
  )
}

/**
 * Completed tag card component
 */
function CompletedTagCard({
  tagRecipient,
  onPress,
  currentUserId,
}: {
  tagRecipient: any
  onPress: () => void
  currentUserId?: string
}) {
  const tag = tagRecipient.tag
  if (!tag) return null

  const isOwnTag = tag.sender_id === currentUserId
  const didBeat = tagRecipient.status === 'beaten'
  const completedValue = tagRecipient.completed_value

  return (
    <Card
      bg={isOwnTag ? '$green2' : '$orange2'}
      p="$4"
      br="$5"
      borderWidth={0}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={1}
      pressStyle={{ scale: 0.98, bg: isOwnTag ? '$green3' : '$orange3' }}
      animation="quick"
      onPress={onPress}
    >
      <XStack gap="$3" alignItems="center">
        <YStack
          width={48}
          height={48}
          br="$4"
          bg={isOwnTag ? '$green4' : didBeat ? '$green4' : '$orange4'}
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={24}>{tag.exercise?.icon || '💪'}</Text>
        </YStack>
        <YStack flex={1} gap="$1">
          <XStack gap="$2" alignItems="center">
            <Text fontWeight="700" fontSize="$4">
              {tag.exercise?.name}
            </Text>
            {isOwnTag ? (
              <XStack bg="$green9" px="$2" py="$0.5" br="$2">
                <Text color="white" fontSize="$2" fontWeight="700">SENT</Text>
              </XStack>
            ) : didBeat ? (
              <XStack bg="$green9" px="$2" py="$0.5" br="$2">
                <Text color="white" fontSize="$2" fontWeight="700">BEAT IT!</Text>
              </XStack>
            ) : null}
          </XStack>
          <Text color="$gray11" fontSize="$3">
            {isOwnTag ? 'You sent this tag' : `From ${tag.sender?.display_name || 'Someone'}`}
          </Text>
          <XStack gap="$2" alignItems="center">
            <Text color={isOwnTag ? '$green11' : '$orange11'} fontSize="$3" fontWeight="600">
              {isOwnTag ? 'Your score' : 'Their'}: {tag.value}
            </Text>
            {!isOwnTag && (
              <>
                <Text color="$gray10" fontSize="$3">→</Text>
                <Text color={didBeat ? '$green11' : '$orange11'} fontSize="$3" fontWeight="600">
                  Yours: {completedValue || tag.value}
                </Text>
              </>
            )}
          </XStack>
        </YStack>
        <ChevronRight size={20} color={isOwnTag ? '$green10' : '$orange10'} />
      </XStack>
    </Card>
  )
}

export default observer(TagsScreen)
