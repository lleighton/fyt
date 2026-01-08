import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'expo-router'
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
import { LinearGradient } from '@tamagui/linear-gradient'
import { Zap, Medal, Target, Percent, User, Trophy, Crown, ChevronRight, Users } from '@tamagui/lucide-icons'
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
 * - Tags Completed (most tags finished)
 * - Tags Sent (most active challengers)
 * - Response Rate (% of received tags completed)
 */
function LeaderboardScreen() {
  const router = useRouter()
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
            fontSize="$2"
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
                    label="completed"
                  />
                ))}
              </YStack>

              {/* Invite more friends prompt */}
              <Card
                br="$4"
                borderWidth={0}
                overflow="hidden"
                position="relative"
                shadowColor="$coral8"
                shadowOffset={{ width: 0, height: 8 }}
                shadowOpacity={0.3}
                shadowRadius={16}
                elevation={8}
                pressStyle={{ scale: 0.97, opacity: 0.95 }}
                animation="bouncy"
                onPress={() => router.push('/(auth)/tag/create')}
              >
                {/* Main gradient background */}
                <LinearGradient
                  colors={['$coral5', '$coral6', '$coral7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                />
                {/* Corner highlight gradient */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  locations={[0, 0.3, 0.7]}
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                />
                <XStack gap="$4" alignItems="center" p="$5">
                  <View
                    width={60}
                    height={60}
                    br="$3"
                    bg="rgba(255,255,255,0.15)"
                    borderWidth={2}
                    borderColor="rgba(255,255,255,0.2)"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Users size={28} color="white" />
                  </View>
                  <YStack flex={1} gap="$1">
                    <Text
                      color="white"
                      fontFamily="$display"
                      fontSize={26}
                      letterSpacing={1}
                    >
                      GROW YOUR NETWORK
                    </Text>
                    <Text
                      color="rgba(255,255,255,0.85)"
                      fontSize="$3"
                      fontFamily="$body"
                    >
                      Tag more friends to stay accountable together
                    </Text>
                  </YStack>
                  <ChevronRight size={24} color="rgba(255,255,255,0.6)" />
                </XStack>
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
                  <Text>Completed</Text>
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
                  <Text>Response</Text>
                </XStack>
              </TamaguiTabs.Tab>
            </TamaguiTabs.List>

            {/* Tags Completed Leaderboard */}
            <TamaguiTabs.Content value="beaten" flex={1}>
              <ScrollView flex={1}>
                <YStack p="$4" gap="$2">
                  {byBeaten.map((user, index) => (
                    <LeaderboardRow
                      key={user.user_id}
                      rank={index + 1}
                      user={user}
                      value={user.tags_beaten}
                      label="completed"
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

            {/* Response Rate Leaderboard */}
            <TamaguiTabs.Content value="winrate" flex={1}>
              <ScrollView flex={1}>
                <YStack p="$4" gap="$2">
                  {byWinRate.length === 0 ? (
                    <Card bg="$backgroundHover" p="$6" br="$4" alignItems="center">
                      <Percent size={48} color="$gray8" />
                      <Text color="$gray10" mt="$3" textAlign="center">
                        Complete some tags to see response rates!
                      </Text>
                    </Card>
                  ) : (
                    byWinRate.map((user, index) => (
                      <LeaderboardRow
                        key={user.user_id}
                        rank={index + 1}
                        user={user}
                        value={user.win_rate}
                        label="% response"
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
            lineHeight={36}
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
