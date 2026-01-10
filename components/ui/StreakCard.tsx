import { ReactNode } from 'react'
import { YStack, XStack, Text, View, Card, GetProps } from 'tamagui'
import { LinearGradient } from '@tamagui/linear-gradient'

import { getCardVariantConfig, CardColorScheme, CardVariant } from './cardVariants'

// StreakCard supports a subset of color schemes (no orange)
export type StreakCardColorScheme = Exclude<CardColorScheme, 'orange'>
export type StreakCardVariant = CardVariant

/**
 * StreakCard-specific gradient configurations
 * These differ from the standard card variants (3-color diagonal sweep)
 */
const streakGradientOverrides: Record<StreakCardColorScheme, {
  gradientColors: string[]
  gradientStart: [number, number]
  gradientEnd: [number, number]
  gradientLocations: number[]
}> = {
  coral: {
    gradientColors: ['$coral5', '$coral3', '$gray2'],
    gradientStart: [1, 0],
    gradientEnd: [0, 1],
    gradientLocations: [0, 0.5, 1],
  },
  green: {
    gradientColors: ['$green6', '$green4', '$gray2'],
    gradientStart: [1, 0],
    gradientEnd: [0, 1],
    gradientLocations: [0, 0.5, 1],
  },
  amber: {
    gradientColors: ['$amber5', '$amber3', '$gray2'],
    gradientStart: [1, 0],
    gradientEnd: [0, 1],
    gradientLocations: [0, 0.5, 1],
  },
  purple: {
    gradientColors: ['$purple5', '$purple3', '$gray2'],
    gradientStart: [1, 0],
    gradientEnd: [0, 1],
    gradientLocations: [0, 0.5, 1],
  },
}

export type StreakCardProps = GetProps<typeof Card> & {
  /** Label text (e.g., "Activity", "Tag Streak") */
  label: string
  /** The streak/stat value */
  value: number | string
  /** Unit text (e.g., "day streak", "reps") */
  unit: string
  /** Icon component */
  icon: ReactNode
  /** Color scheme */
  colorScheme: StreakCardColorScheme
  /** Visual style variant */
  variant?: StreakCardVariant
}

/**
 * StreakCard - Compact stat card with customizable visual style
 *
 * Variants:
 * - gradient: Original gradient sweep (default)
 * - subtle: Clean with colored border accent
 * - glass: Frosted glass tinted effect
 * - accent: Top gradient stripe accent
 * - minimal: Clean monochrome with colored value
 * - glow: Dark with glowing border
 *
 * @example
 * ```tsx
 * <XStack gap="$3">
 *   <StreakCard
 *     label="Activity"
 *     value={currentStreak}
 *     unit="day streak"
 *     icon={<Flame color="$coral11" size={16} />}
 *     colorScheme="coral"
 *     variant="glass"
 *   />
 * </XStack>
 * ```
 */
export function StreakCard({
  label,
  value,
  unit,
  icon,
  colorScheme,
  variant = 'gradient',
  ...props
}: StreakCardProps) {
  const baseConfig = getCardVariantConfig(variant, colorScheme)

  // For gradient variant, use streak-specific gradient configuration
  const gradientConfig = variant === 'gradient'
    ? streakGradientOverrides[colorScheme]
    : baseConfig

  const hasGradient = gradientConfig.gradientColors && gradientConfig.gradientColors.length > 0

  return (
    <Card
      flex={1}
      br="$5"
      borderWidth={baseConfig.borderWidth ?? 0}
      borderColor={baseConfig.borderColor}
      bg={baseConfig.bg}
      overflow="hidden"
      position="relative"
      {...props}
    >
      {/* Background gradient */}
      {hasGradient && variant === 'gradient' && (
        <LinearGradient
          colors={gradientConfig.gradientColors!}
          start={gradientConfig.gradientStart ?? [1, 0]}
          end={gradientConfig.gradientEnd ?? [0, 1]}
          locations={gradientConfig.gradientLocations}
          fullscreen
        />
      )}

      {/* Top accent stripe for 'accent' variant */}
      {hasGradient && variant === 'accent' && (
        <LinearGradient
          colors={gradientConfig.gradientColors!}
          start={gradientConfig.gradientStart ?? [0, 0]}
          end={gradientConfig.gradientEnd ?? [1, 0]}
          position="absolute"
          top={0}
          left={0}
          right={0}
          height={4}
        />
      )}

      <YStack p="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text
            color={baseConfig.secondaryColor}
            fontSize="$2"
            fontFamily="$body"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing={1}
          >
            {label}
          </Text>
          <View
            bg={baseConfig.iconBg}
            p="$1.5"
            br="$2"
            borderWidth={baseConfig.iconBorder ? 1 : 0}
            borderColor={baseConfig.iconBorder}
          >
            {icon}
          </View>
        </XStack>
        <XStack alignItems="baseline" gap="$2">
          <Text
            fontFamily="$mono"
            fontSize="$12"
            fontWeight="700"
            color={baseConfig.primaryColor}
            lineHeight="$12"
          >
            {value}
          </Text>
          <Text
            fontSize="$2"
            fontFamily="$body"
            fontWeight="500"
            color={baseConfig.accentColor}
          >
            {unit}
          </Text>
        </XStack>
      </YStack>
    </Card>
  )
}
