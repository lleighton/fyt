import { YStack, Text, styled, GetProps } from 'tamagui'

const EmptyStateFrame = styled(YStack, {
  py: '$4',
  alignItems: 'center',
  gap: '$2',

  variants: {
    size: {
      sm: { py: '$3', gap: '$1.5' },
      md: { py: '$4', gap: '$2' },
      lg: { py: '$6', gap: '$3' },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
})

export type EmptyStateProps = GetProps<typeof EmptyStateFrame> & {
  /** Emoji or icon to display */
  icon: string
  /** Main title text */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Color scheme for text */
  colorScheme?: 'coral' | 'orange' | 'green' | 'amber' | 'purple' | 'gray'
}

const colorMap = {
  coral: { title: '$coral12', subtitle: '$coral11' },
  orange: { title: '$orange12', subtitle: '$orange11' },
  green: { title: '$green12', subtitle: '$green11' },
  amber: { title: '$amber12', subtitle: '$amber11' },
  purple: { title: '$purple12', subtitle: '$purple11' },
  gray: { title: '$gray12', subtitle: '$gray11' },
}

/**
 * EmptyState - Consistent empty state display
 *
 * Used when there's no data to show in a card or section.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="🏆"
 *   title="No PRs yet"
 *   subtitle="Complete tags to set records!"
 *   colorScheme="coral"
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  subtitle,
  colorScheme = 'gray',
  size = 'md',
  ...props
}: EmptyStateProps) {
  const colors = colorMap[colorScheme]
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 48 : 36
  const titleSize = size === 'sm' ? '$4' : size === 'lg' ? '$6' : '$5'
  const subtitleSize = size === 'sm' ? '$2' : size === 'lg' ? '$4' : '$3'

  return (
    <EmptyStateFrame size={size} {...props}>
      <Text fontSize={iconSize}>{icon}</Text>
      <Text
        color={colors.title}
        fontSize={titleSize}
        fontWeight="600"
        textAlign="center"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          color={colors.subtitle}
          fontSize={subtitleSize}
          textAlign="center"
        >
          {subtitle}
        </Text>
      )}
    </EmptyStateFrame>
  )
}
