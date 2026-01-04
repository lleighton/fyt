import { useState, useEffect, useMemo } from 'react'
import { observer } from '@legendapp/state/react'
import { ActivityIndicator } from 'react-native'
import {
  YStack,
  XStack,
  Text,
  Card,
  ScrollView,
  Avatar,
  Tabs as TamaguiTabs,
  View,
} from 'tamagui'
import { Zap, Medal, Target, Percent, User, Trophy, Crown } from '@tamagui/lucide-icons'
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
        {/* Header - Athletic Broadcast Style */}
        <YStack px="$4" py="$5" gap="$1">
          <Text
            color="$gray10"
            fontSize="$1"
            fontFamily="$body"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing={1.2}
          >
            Rankings
          </Text>
          <Text
            fontFamily="$display"
            fontSize={40}
            color="$color"
            letterSpacing={1}
          >
            LEADERBOARD
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
              <Card
                bg="$coral2"
                p="$5"
                br="$4"
                borderWidth={1}
                borderColor="$coral5"
                overflow="hidden"
                position="relative"
              >
                <View
                  position="absolute"
                  top={-20}
                  right={-20}
                  width={80}
                  height={80}
                  bg="$coral4"
                  opacity={0.3}
                  br={80}
                />
                <YStack alignItems="center" gap="$3">
                  <View bg="$coral4" p="$3" br="$3">
                    <Trophy size={28} color="$coral11" />
                  </View>
                  <Text
                    fontFamily="$display"
                    fontSize={22}
                    color="$coral12"
                    textAlign="center"
                    letterSpacing={0.5}
                  >
                    GROW YOUR NETWORK
                  </Text>
                  <Text
                    color="$coral11"
                    fontSize="$3"
                    fontFamily="$body"
                    textAlign="center"
                  >
                    Tag more friends to compete and climb the leaderboard
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
 * Leaderboard row component - Scoreboard style
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
    if (rank === 1) return '$amber10'
    if (rank === 2) return '$gray8'
    if (rank === 3) return '$coral9'
    return '$gray10'
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return '$amber3'
    if (rank === 2) return '$gray4'
    if (rank === 3) return '$coral3'
    return '$gray3'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return (
        <View
          width={36}
          height={36}
          alignItems="center"
          justifyContent="center"
          bg="$amber4"
          br="$2"
        >
          <Crown size={20} color="$amber11" />
        </View>
      )
    }
    if (rank <= 3) {
      return (
        <View
          width={36}
          height={36}
          alignItems="center"
          justifyContent="center"
          bg={getRankBg(rank)}
          br="$2"
        >
          <Medal size={20} color={getRankColor(rank)} />
        </View>
      )
    }
    return (
      <View
        width={36}
        height={36}
        alignItems="center"
        justifyContent="center"
        bg="$gray3"
        br="$2"
      >
        <Text
          fontFamily="$mono"
          fontWeight="700"
          fontSize="$4"
          color="$gray10"
        >
          {rank}
        </Text>
      </View>
    )
  }

  const displayName = user.display_name || user.first_name || 'User'

  return (
    <Card
      bg={user.is_current_user ? '$coral2' : '$gray2'}
      p="$3"
      br="$3"
      borderWidth={user.is_current_user ? 2 : 1}
      borderColor={user.is_current_user ? '$coral7' : '$gray4'}
      position="relative"
      overflow="hidden"
    >
      {/* Highlight bar for top 3 */}
      {rank <= 3 && (
        <View
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          width={3}
          bg={getRankColor(rank)}
        />
      )}
      <XStack alignItems="center" gap="$3">
        {/* Rank */}
        {getRankIcon(rank)}

        {/* Avatar */}
        <Avatar circular size="$4" bg="$coral6">
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
          <XStack alignItems="center" gap="$2">
            <Text fontFamily="$body" fontWeight="600" fontSize="$4">
              {displayName}
            </Text>
            {user.is_current_user && (
              <View bg="$coral5" px="$1.5" py="$0.5" br="$1">
                <Text color="$coral12" fontSize="$1" fontWeight="700">
                  YOU
                </Text>
              </View>
            )}
          </XStack>
        </YStack>

        {/* Value - Scoreboard style */}
        <YStack alignItems="flex-end">
          <Text
            fontFamily="$mono"
            fontWeight="700"
            fontSize={28}
            color={rank <= 3 ? getRankColor(rank) : '$color'}
            lineHeight={28}
          >
            {value}{suffix}
          </Text>
          <Text
            fontSize="$1"
            fontFamily="$body"
            color="$gray10"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {label}
          </Text>
        </YStack>
      </XStack>
    </Card>
  )
}

export default observer(LeaderboardScreen)
