import { ReactNode } from 'react'
import { YStack, XStack, Text, View, Card, GetProps } from 'tamagui'
import { LinearGradient } from '@tamagui/linear-gradient'
import { ChevronRight } from '@tamagui/lucide-icons'

import { EmptyState } from './EmptyState'
import { getCardVariantConfig, CardColorScheme, CardVariant } from './cardVariants'

export type StatsSummaryCardColorScheme = CardColorScheme
export type StatsSummaryCardVariant = CardVariant

/**
 * StatsSummaryCard-specific overrides for the gradient variant
 * Uses darker iconBg ($color8) for better contrast with white icons
 */
const summaryGradientIconBg: Record<CardColorScheme, string> = {
  coral: '$coral8',
  orange: '$orange8',
  green: '$green8',
  amber: '$amber8',
  purple: '$purple8',
}

export type StatsSummaryCardProps = GetProps<typeof Card> & {
  /** Color scheme for the card */
  colorScheme: StatsSummaryCardColorScheme
  /** Visual style variant */
  variant?: StatsSummaryCardVariant
  /** Icon component for the header */
  headerIcon: ReactNode
  /** Title text for the header */
  title: string
  /** Optional right element in header (defaults to chevron) */
  headerRight?: ReactNode
  /** Whether there is data to display */
  hasData: boolean
  /** Empty state config */
  emptyState: {
    icon: string
    title: string
    subtitle: string
  }
  /** Whether to show the "View All" footer */
  showFooter?: boolean
  /** Content to display when hasData is true */
  children: ReactNode
  /** Accessibility label */
  accessibilityLabel?: string
}

/**
 * StatsSummaryCard - Consistent stats card with header, content, and empty state
 *
 * Variants:
 * - gradient: Original gradient background (default)
 * - subtle: Clean with colored border accent
 * - glass: Frosted glass tinted effect
 * - accent: Top gradient stripe accent
 * - minimal: Clean monochrome with colored title
 * - glow: Dark with glowing border
 *
 * @example
 * ```tsx
 * <StatsSummaryCard
 *   colorScheme="coral"
 *   variant="glass"
 *   headerIcon={<Trophy color="white" size={20} />}
 *   title="PERSONAL RECORDS"
 *   hasData={prs.length > 0}
 *   emptyState={{
 *     icon: "🏆",
 *     title: "No PRs yet",
 *     subtitle: "Complete tags to set records!"
 *   }}
 *   onPress={() => router.push('/stats/prs')}
 * >
 *   <PRGrid prs={prs} />
 * </StatsSummaryCard>
 * ```
 */
export function StatsSummaryCard({
  colorScheme,
  variant = 'gradient',
  headerIcon,
  title,
  headerRight,
  hasData,
  emptyState,
  showFooter = true,
  children,
  accessibilityLabel,
  ...props
}: StatsSummaryCardProps) {
  const config = getCardVariantConfig(variant, colorScheme)

  // For gradient variant, use darker iconBg for better contrast
  const iconBg = variant === 'gradient' ? summaryGradientIconBg[colorScheme] : config.iconBg

  const hasGradient = config.gradientColors && config.gradientColors.length > 0

  return (
    <Card
      br="$5"
      borderWidth={config.borderWidth ?? 0}
      borderColor={config.borderColor}
      bg={config.bg}
      overflow="hidden"
      position="relative"
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      animation="quick"
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      {...props}
    >
      {/* Background gradient for 'gradient' variant */}
      {hasGradient && variant === 'gradient' && (
        <LinearGradient
          colors={config.gradientColors!}
          start={config.gradientStart ?? [0, 0]}
          end={config.gradientEnd ?? [1, 1]}
          locations={config.gradientLocations}
          fullscreen
        />
      )}

      {/* Top accent stripe for 'accent' variant */}
      {hasGradient && variant === 'accent' && (
        <LinearGradient
          colors={config.gradientColors!}
          start={config.gradientStart ?? [0, 0]}
          end={config.gradientEnd ?? [1, 0]}
          position="absolute"
          top={0}
          left={0}
          right={0}
          height={4}
        />
      )}

      <YStack p="$4" gap="$3">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <View
              bg={iconBg}
              p="$2"
              br="$3"
              borderWidth={config.iconBorder ? 1 : 0}
              borderColor={config.iconBorder}
            >
              {headerIcon}
            </View>
            <Text
              fontFamily="$display"
              fontSize={22}
              fontWeight="700"
              color={config.primaryColor}
              letterSpacing={1}
            >
              {title}
            </Text>
          </XStack>
          {headerRight ?? <ChevronRight size={22} color={config.accentColor} />}
        </XStack>

        {/* Content or Empty State */}
        {hasData ? (
          children
        ) : (
          <EmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            subtitle={emptyState.subtitle}
            colorScheme={colorScheme === 'orange' ? 'coral' : colorScheme}
          />
        )}

        {/* Footer */}
        {hasData && showFooter && (
          <XStack justifyContent="flex-end" alignItems="center" gap="$1">
            <Text color={config.primaryColor} fontSize="$3" fontWeight="700">
              View All
            </Text>
            <ChevronRight size={18} color={config.primaryColor} />
          </XStack>
        )}
      </YStack>
    </Card>
  )
}
