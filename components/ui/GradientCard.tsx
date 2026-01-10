import { ReactNode } from 'react'
import { Card, styled, GetProps } from 'tamagui'
import { LinearGradient } from '@tamagui/linear-gradient'

/**
 * Base styled card for gradient backgrounds
 */
const GradientCardFrame = styled(Card, {
  br: '$5',
  overflow: 'hidden',
  position: 'relative',

  variants: {
    interactive: {
      true: {
        pressStyle: { scale: 0.98, opacity: 0.9 },
        animation: 'quick',
        cursor: 'pointer',
      },
    },
    size: {
      sm: { br: '$4' },
      md: { br: '$5' },
      lg: { br: '$6' },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
})

export type GradientCardProps = GetProps<typeof GradientCardFrame> & {
  /** Gradient colors array (e.g., ['$coral4', '$coral6']) */
  colors: string[]
  /** Gradient start point as [x, y] */
  start?: [number, number]
  /** Gradient end point as [x, y] */
  end?: [number, number]
  /** Gradient color stops */
  locations?: number[]
  children: ReactNode
}

/**
 * GradientCard - Pressable card with gradient background
 *
 * Used for stats cards, streak cards, and other gradient-backed content.
 *
 * @example
 * ```tsx
 * <GradientCard
 *   colors={['$coral4', '$coral6']}
 *   interactive
 *   onPress={() => router.push('/stats')}
 * >
 *   <YStack p="$4">Content here</YStack>
 * </GradientCard>
 * ```
 */
export function GradientCard({
  colors,
  start,
  end,
  locations,
  children,
  ...props
}: GradientCardProps) {
  return (
    <GradientCardFrame {...props}>
      <LinearGradient
        colors={colors}
        start={start ?? [0, 0]}
        end={end ?? [1, 1]}
        locations={locations}
        fullscreen
      />
      {children}
    </GradientCardFrame>
  )
}
