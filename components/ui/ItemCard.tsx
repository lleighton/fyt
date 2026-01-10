import { ReactNode } from 'react'
import { YStack, XStack, Text, Card, styled, GetProps } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'

import { IconBox } from './IconBox'

type ColorScheme = 'coral' | 'orange' | 'green' | 'amber' | 'purple' | 'gray'

const colorConfig: Record<ColorScheme, {
  bg: string
  bgHover: string
  border: string
  title: string
  subtitle: string
  meta: string
}> = {
  coral: {
    bg: '$coral2',
    bgHover: '$coral3',
    border: '$coral7',
    title: '$gray12',
    subtitle: '$coral12',
    meta: '$coral12',
  },
  orange: {
    bg: '$orange2',
    bgHover: '$orange3',
    border: '$orange7',
    title: '$gray12',
    subtitle: '$orange12',
    meta: '$orange12',
  },
  green: {
    bg: '$green2',
    bgHover: '$green3',
    border: '$green7',
    title: '$gray12',
    subtitle: '$green12',
    meta: '$green12',
  },
  amber: {
    bg: '$amber2',
    bgHover: '$amber3',
    border: '$amber7',
    title: '$gray12',
    subtitle: '$amber12',
    meta: '$amber12',
  },
  purple: {
    bg: '$purple2',
    bgHover: '$purple3',
    border: '$purple7',
    title: '$gray12',
    subtitle: '$purple12',
    meta: '$purple12',
  },
  gray: {
    bg: '$gray2',
    bgHover: '$gray3',
    border: '$gray6',
    title: '$gray12',
    subtitle: '$gray11',
    meta: '$gray10',
  },
}

export type ItemCardProps = GetProps<typeof Card> & {
  /** Icon (emoji string or ReactNode) */
  icon: string | ReactNode
  /** Main title text */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** Optional metadata line (e.g., time remaining) */
  meta?: ReactNode
  /** Color scheme */
  colorScheme?: ColorScheme
  /** Whether to show border */
  bordered?: boolean
  /** Right side content (defaults to ChevronRight) */
  rightContent?: ReactNode
  /** Hide the right content entirely */
  hideRight?: boolean
  /** Press handler */
  onPress?: () => void
}

/**
 * ItemCard - Versatile card for list items, tags, challenges, etc.
 *
 * @example
 * ```tsx
 * // Tag item
 * <ItemCard
 *   icon="💪"
 *   title="John tagged you"
 *   subtitle="20 reps of Push-ups"
 *   meta={<><Clock size={12} /> 2h left</>}
 *   colorScheme="orange"
 *   bordered
 *   onPress={handlePress}
 * />
 *
 * // Group item
 * <ItemCard
 *   icon={<Users color="$gray11" size={24} />}
 *   title="Workout Crew"
 *   subtitle="5 members"
 *   colorScheme="gray"
 *   onPress={handlePress}
 * />
 * ```
 */
export function ItemCard({
  icon,
  title,
  subtitle,
  meta,
  colorScheme = 'gray',
  bordered = false,
  rightContent,
  hideRight = false,
  onPress,
  ...props
}: ItemCardProps) {
  const colors = colorConfig[colorScheme]

  return (
    <Card
      bg={colors.bg}
      p="$4"
      br="$5"
      borderWidth={bordered ? 2 : 0}
      borderColor={bordered ? colors.border : 'transparent'}
      pressStyle={{ scale: 0.98, bg: colors.bgHover }}
      animation="quick"
      onPress={onPress}
      {...props}
    >
      <XStack gap="$3" alignItems="center">
        <IconBox
          icon={icon}
          colorScheme={colorScheme}
          size="md"
        />
        <YStack flex={1} gap="$1">
          <Text fontWeight="700" fontSize="$4" color={colors.title}>
            {title}
          </Text>
          {subtitle && (
            <Text color={colors.subtitle} fontSize="$3">
              {subtitle}
            </Text>
          )}
          {meta && (
            <XStack gap="$1" alignItems="center">
              <Text color={colors.meta} fontSize="$2" fontWeight="600">
                {meta}
              </Text>
            </XStack>
          )}
        </YStack>
        {!hideRight && (
          rightContent ?? <ChevronRight size={20} color={colors.meta} />
        )}
      </XStack>
    </Card>
  )
}

/**
 * ItemCardMeta - Helper component for consistent meta line formatting
 */
export function ItemCardMeta({
  icon,
  children,
  color,
}: {
  icon?: ReactNode
  children: ReactNode
  color?: string
}) {
  return (
    <XStack gap="$1" alignItems="center">
      {icon}
      <Text color={color ?? '$gray10'} fontSize="$2" fontWeight="600">
        {children}
      </Text>
    </XStack>
  )
}
