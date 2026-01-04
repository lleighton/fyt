import { useState, useEffect, useMemo } from 'react'
import { observer } from '@legendapp/state/react'
import { ActivityIndicator } from 'react-native'
import {
  YStack,
  XStack,
  Text,
  H1,
  Card,
  ScrollView,
  Avatar,
  Tabs as TamaguiTabs,
} from 'tamagui'
import { Zap, Medal, Target, Percent, User } from '@tamagui/lucide-icons'
import { SafeArea } from '@/components/ui'

import { store$, auth$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'

interface TagStats {
  user_id: string
  display_name: string | null
  first_name: string | null
  avatar_url: string | null
  tags_sent: number
  tags_received: number
  tags_beaten: number
  win_rate: number
  is_current_user: boolean
}

/**
 * Leaderboard screen - Tag-centric
 *
 * Shows rankings based on tag activity:
 * - Tags Sent (most active challengers)
 * - Tags Beaten (best at completing challenges)
 * - Win Rate (% of received tags beaten)
 */
function LeaderboardScreen() {
  const session = auth$.session.get()
  const [leaderboardData, setLeaderboardData] = useState<TagStats[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!session?.user?.id) return

      setLoading(true)
      try {
        const { data, error } = await (supabase.rpc as any)('get_tag_leaderboard', {
          p_user_id: session.user.id,
        })

        if (error) {
          console.error('[Leaderboard] Error:', error)
        } else {
          setLeaderboardData(data || [])
        }
      } catch (err) {
        console.error('[Leaderboard] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [session?.user?.id])

  // Sort by different metrics
  const bySent = useMemo(
    () => [...leaderboardData].sort((a, b) => b.tags_sent - a.tags_sent),
    [leaderboardData]
  )

  const byBeaten = useMemo(
    () => [...leaderboardData].sort((a, b) => b.tags_beaten - a.tags_beaten),
    [leaderboardData]
  )

  const byWinRate = useMemo(
    () => [...leaderboardData]
      .filter(u => u.tags_received > 0) // Only show users who have received tags
      .sort((a, b) => b.win_rate - a.win_rate),
    [leaderboardData]
  )

  if (loading) {
    return (
      <SafeArea edges={['top']}>
        <YStack flex={1} bg="$background" justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" />
          <Text mt="$4" color="$gray10">Loading leaderboard...</Text>
        </YStack>
      </SafeArea>
    )
  }

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <YStack px="$4" py="$4" gap="$2">
          <H1 fontSize="$8">Leaderboard</H1>
          <Text color="$gray10" fontSize="$3">
            Compete with your tag network
          </Text>
        </YStack>

        {leaderboardData.length === 0 ? (
          <YStack flex={1} justifyContent="center" alignItems="center" p="$4">
            <Zap size={64} color="$gray10" />
            <Text color="$color" fontSize="$5" fontWeight="600" mt="$4" textAlign="center">
              No tag activity yet
            </Text>
            <Text color="$gray10" fontSize="$3" mt="$2" textAlign="center">
              Start tagging friends to build your leaderboard!
            </Text>
          </YStack>
        ) : leaderboardData.length <= 3 ? (
          /* Sparse leaderboard - encourage more social engagement */
          <ScrollView flex={1}>
            <YStack p="$4" gap="$4">
              {/* Existing entries */}
              <YStack gap="$2">
                {byBeaten.map((user, index) => (
                  <LeaderboardRow
                    key={user.user_id}
                    rank={index + 1}
                    user={user}
                    value={user.tags_beaten}
                    label="beaten"
                  />
                ))}
              </YStack>

              {/* Invite more friends prompt */}
              <Card bg="$orange2" p="$5" br="$5" borderWidth={1} borderColor="$orange7">
                <YStack alignItems="center" gap="$3">
                  <User size={40} color="$orange10" />
                  <Text color="$color" fontWeight="600" fontSize="$4" textAlign="center">
                    Grow your network!
                  </Text>
                  <Text color="$gray11" fontSize="$3" textAlign="center">
                    Tag more friends to compete and climb the leaderboard together
                  </Text>
                </YStack>
              </Card>
            </YStack>
          </ScrollView>
        ) : (
          <TamaguiTabs
            defaultValue="beaten"
            orientation="horizontal"
            flexDirection="column"
            flex={1}
          >
            <TamaguiTabs.List px="$4" gap="$2">
              <TamaguiTabs.Tab value="beaten" flex={1}>
                <XStack alignItems="center" gap="$2">
                  <Target size={16} />
                  <Text>Beaten</Text>
                </XStack>
              </TamaguiTabs.Tab>
              <TamaguiTabs.Tab value="sent" flex={1}>
                <XStack alignItems="center" gap="$2">
                  <Zap size={16} />
                  <Text>Sent</Text>
                </XStack>
              </TamaguiTabs.Tab>
              <TamaguiTabs.Tab value="winrate" flex={1}>
                <XStack alignItems="center" gap="$2">
                  <Percent size={16} />
                  <Text>Win rate</Text>
                </XStack>
              </TamaguiTabs.Tab>
            </TamaguiTabs.List>

            {/* Tags Beaten Leaderboard */}
            <TamaguiTabs.Content value="beaten" flex={1}>
              <ScrollView flex={1}>
                <YStack p="$4" gap="$2">
                  {byBeaten.map((user, index) => (
                    <LeaderboardRow
                      key={user.user_id}
                      rank={index + 1}
                      user={user}
                      value={user.tags_beaten}
                      label="beaten"
                    />
                  ))}
                </YStack>
              </ScrollView>
            </TamaguiTabs.Content>

            {/* Tags Sent Leaderboard */}
            <TamaguiTabs.Content value="sent" flex={1}>
              <ScrollView flex={1}>
                <YStack p="$4" gap="$2">
                  {bySent.map((user, index) => (
                    <LeaderboardRow
                      key={user.user_id}
                      rank={index + 1}
                      user={user}
                      value={user.tags_sent}
                      label="sent"
                    />
                  ))}
                </YStack>
              </ScrollView>
            </TamaguiTabs.Content>

            {/* Win Rate Leaderboard */}
            <TamaguiTabs.Content value="winrate" flex={1}>
              <ScrollView flex={1}>
                <YStack p="$4" gap="$2">
                  {byWinRate.length === 0 ? (
                    <Card bg="$backgroundHover" p="$6" br="$4" alignItems="center">
                      <Percent size={48} color="$gray8" />
                      <Text color="$gray10" mt="$3" textAlign="center">
                        Complete some tags to see win rates!
                      </Text>
                    </Card>
                  ) : (
                    byWinRate.map((user, index) => (
                      <LeaderboardRow
                        key={user.user_id}
                        rank={index + 1}
                        user={user}
                        value={user.win_rate}
                        label="% win rate"
                        suffix="%"
                      />
                    ))
                  )}
                </YStack>
              </ScrollView>
            </TamaguiTabs.Content>
          </TamaguiTabs>
        )}
      </YStack>
    </SafeArea>
  )
}

/**
 * Leaderboard row component
 */
function LeaderboardRow({
  rank,
  user,
  value,
  label,
  suffix = '',
}: {
  rank: number
  user: TagStats
  value: number
  label: string
  suffix?: string
}) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return '$yellow10'
    if (rank === 2) return '$gray9'
    if (rank === 3) return '$orange9'
    return '$gray10'
  }

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return (
        <YStack width={32} height={32} alignItems="center" justifyContent="center">
          <Medal size={24} color={getRankColor(rank)} />
        </YStack>
      )
    }
    return (
      <YStack
        width={32}
        height={32}
        alignItems="center"
        justifyContent="center"
        br="$10"
        bg="$backgroundHover"
      >
        <Text fontWeight="600" color="$gray10">
          {rank}
        </Text>
      </YStack>
    )
  }

  const displayName = user.display_name || user.first_name || 'User'

  return (
    <Card
      bg={user.is_current_user ? '$orange2' : '$backgroundHover'}
      p="$3"
      br="$4"
      borderWidth={user.is_current_user ? 2 : 0}
      borderColor={user.is_current_user ? '$orange10' : 'transparent'}
    >
      <XStack alignItems="center" gap="$3">
        {/* Rank */}
        {getRankIcon(rank)}

        {/* Avatar */}
        <Avatar circular size="$4" bg="$orange10">
          {user.avatar_url ? (
            <Avatar.Image src={user.avatar_url} />
          ) : (
            <Avatar.Fallback justifyContent="center" alignItems="center">
              <User size={18} color="white" />
            </Avatar.Fallback>
          )}
        </Avatar>

        {/* Name */}
        <YStack flex={1}>
          <Text fontWeight="600" fontSize="$4">
            {displayName}
            {user.is_current_user && (
              <Text color="$orange10" fontSize="$3">
                {' '}
                (You)
              </Text>
            )}
          </Text>
        </YStack>

        {/* Value */}
        <YStack alignItems="flex-end">
          <Text fontWeight="700" fontSize="$6" color={rank <= 3 ? getRankColor(rank) : '$color'}>
            {value}{suffix}
          </Text>
          <Text fontSize="$2" color="$gray10">
            {label}
          </Text>
        </YStack>
      </XStack>
    </Card>
  )
}

export default observer(LeaderboardScreen)
