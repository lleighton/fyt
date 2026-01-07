import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, ViewStyle } from 'react-native'
import { YStack, XStack, Card } from 'tamagui'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  style?: ViewStyle
}

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [shimmerAnim])

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: '#E1E9EE',
          opacity,
        },
        style,
      ]}
    />
  )
}

/**
 * Circle skeleton for avatars
 */
export function SkeletonCircle({ size = 48 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />
}

/**
 * Text line skeleton
 */
export function SkeletonText({
  width = '100%',
  height = 14,
}: {
  width?: number | string
  height?: number
}) {
  return <Skeleton width={width} height={height} borderRadius={4} />
}

/**
 * Card skeleton - generic card placeholder
 */
export function CardSkeleton({ height = 120 }: { height?: number }) {
  return (
    <Card bg="$gray2" p="$4" br="$5" height={height}>
      <XStack gap="$3" alignItems="center">
        <SkeletonCircle size={48} />
        <YStack flex={1} gap="$2">
          <SkeletonText width="60%" height={18} />
          <SkeletonText width="40%" height={14} />
        </YStack>
      </XStack>
    </Card>
  )
}

/**
 * Group card skeleton - matches GroupCard layout
 */
export function GroupCardSkeleton() {
  return (
    <Card
      bg="$gray2"
      p="$5"
      br="$6"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={8}
      elevation={2}
    >
      <XStack gap="$4" alignItems="center">
        <SkeletonCircle size={56} />
        <YStack flex={1} gap="$2">
          <SkeletonText width="70%" height={20} />
          <SkeletonText width="90%" height={14} />
          <XStack gap="$4" mt="$1">
            <SkeletonText width={80} height={14} />
            <SkeletonText width={60} height={14} />
          </XStack>
        </YStack>
        <Skeleton width={20} height={20} borderRadius={4} />
      </XStack>
    </Card>
  )
}

/**
 * Leaderboard item skeleton
 */
export function LeaderboardItemSkeleton() {
  return (
    <Card bg="$gray2" p="$3" br="$4">
      <XStack gap="$3" alignItems="center">
        <Skeleton width={32} height={32} borderRadius={16} />
        <SkeletonCircle size={40} />
        <YStack flex={1} gap="$1">
          <SkeletonText width="50%" height={16} />
          <SkeletonText width="30%" height={12} />
        </YStack>
        <YStack alignItems="flex-end" gap="$1">
          <SkeletonText width={40} height={20} />
          <SkeletonText width={30} height={10} />
        </YStack>
      </XStack>
    </Card>
  )
}

/**
 * Member list item skeleton
 */
export function MemberItemSkeleton() {
  return (
    <XStack p="$3" gap="$3" alignItems="center">
      <SkeletonCircle size={48} />
      <YStack flex={1} gap="$2">
        <SkeletonText width="60%" height={16} />
        <SkeletonText width="40%" height={12} />
      </YStack>
    </XStack>
  )
}

/**
 * Tag card skeleton
 */
export function TagCardSkeleton() {
  return (
    <Card bg="$gray2" p="$4" br="$4">
      <XStack gap="$3" alignItems="center">
        <SkeletonCircle size={44} />
        <YStack flex={1} gap="$2">
          <SkeletonText width="70%" height={16} />
          <SkeletonText width="50%" height={14} />
          <SkeletonText width="40%" height={12} />
        </YStack>
        <YStack alignItems="flex-end" gap="$1">
          <SkeletonText width={50} height={24} />
          <SkeletonText width={30} height={10} />
        </YStack>
      </XStack>
    </Card>
  )
}

/**
 * Invite card skeleton
 */
export function InviteCardSkeleton() {
  return (
    <Card bg="$orange2" p="$4" br="$5" borderWidth={2} borderColor="$orange7">
      <YStack gap="$3">
        <XStack gap="$3" alignItems="center">
          <SkeletonCircle size={48} />
          <YStack flex={1} gap="$2">
            <SkeletonText width="60%" height={18} />
            <SkeletonText width="40%" height={14} />
          </YStack>
        </XStack>
        <XStack gap="$2">
          <Skeleton width="50%" height={44} borderRadius={8} />
          <Skeleton width="50%" height={44} borderRadius={8} />
        </XStack>
      </YStack>
    </Card>
  )
}

/**
 * Stats row skeleton
 */
export function StatsRowSkeleton() {
  return (
    <XStack gap="$4" justifyContent="space-around" py="$3">
      {[1, 2, 3].map((i) => (
        <YStack key={i} alignItems="center" gap="$1">
          <SkeletonText width={40} height={24} />
          <SkeletonText width={60} height={12} />
        </YStack>
      ))}
    </XStack>
  )
}

/**
 * Full screen skeleton for initial page loads
 */
export function PageSkeleton({ itemCount = 3 }: { itemCount?: number }) {
  return (
    <YStack flex={1} p="$4" gap="$4">
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <SkeletonText width={150} height={28} />
        <SkeletonCircle size={40} />
      </XStack>

      {/* Content */}
      {Array.from({ length: itemCount }).map((_, i) => (
        <GroupCardSkeleton key={i} />
      ))}
    </YStack>
  )
}

/**
 * Groups list skeleton
 */
export function GroupsListSkeleton() {
  return (
    <YStack gap="$3">
      {[1, 2, 3].map((i) => (
        <GroupCardSkeleton key={i} />
      ))}
    </YStack>
  )
}

/**
 * Leaderboard skeleton
 */
export function LeaderboardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <YStack gap="$2">
      {Array.from({ length: count }).map((_, i) => (
        <LeaderboardItemSkeleton key={i} />
      ))}
    </YStack>
  )
}

/**
 * Members list skeleton
 */
export function MembersListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Card bg="$gray2" br="$4">
      {Array.from({ length: count }).map((_, i) => (
        <MemberItemSkeleton key={i} />
      ))}
    </Card>
  )
}

/**
 * Tag list skeleton
 */
export function TagListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <YStack gap="$3">
      {Array.from({ length: count }).map((_, i) => (
        <TagCardSkeleton key={i} />
      ))}
    </YStack>
  )
}

/**
 * Profile header skeleton
 */
export function ProfileHeaderSkeleton() {
  return (
    <YStack alignItems="center" gap="$3" py="$4">
      <SkeletonCircle size={100} />
      <SkeletonText width={150} height={24} />
      <SkeletonText width={100} height={14} />
      <StatsRowSkeleton />
    </YStack>
  )
}

/**
 * Section skeleton with title
 */
export function SectionSkeleton({
  titleWidth = 120,
  children,
}: {
  titleWidth?: number
  children: React.ReactNode
}) {
  return (
    <YStack gap="$3">
      <SkeletonText width={titleWidth} height={18} />
      {children}
    </YStack>
  )
}
