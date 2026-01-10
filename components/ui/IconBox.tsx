import { ReactNode } from 'react'
import { View, Text, styled, GetProps } from 'tamagui'

const IconBoxFrame = styled(View, {
  justifyContent: 'center',
  alignItems: 'center',
  br: '$3',

  variants: {
    size: {
      xs: { width: 32, height: 32, br: '$2' },
      sm: { width: 40, height: 40, br: '$3' },
      md: { width: 48, height: 48, br: '$4' },
      lg: { width: 60, height: 60, br: '$4' },
    },
    colorScheme: {
      coral: { bg: '$coral4' },
      orange: { bg: '$orange4' },
      green: { bg: '$green4' },
      amber: { bg: '$amber4' },
      purple: { bg: '$purple4' },
      gray: { bg: '$gray4' },
      white: { bg: 'rgba(255,255,255,0.15)' },
    },
    /** For header icons with darker background */
    variant: {
      default: {},
      header: {},
    },
  } as const,

  defaultVariants: {
    size: 'md',
    colorScheme: 'orange',
    variant: 'default',
  },
})

export type IconBoxProps = GetProps<typeof IconBoxFrame> & {
  /** Icon component or emoji string */
  icon: ReactNode | string
  /** Font size for emoji icons */
  emojiSize?: number
}

/**
 * IconBox - Consistent icon container used across cards
 *
 * Supports both Lucide icons and emoji strings.
 *
 * @example
 * ```tsx
 * // With emoji
 * <IconBox icon="💪" colorScheme="coral" />
 *
 * // With Lucide icon
 * <IconBox icon={<Trophy color="white" size={20} />} colorScheme="coral" />
 * ```
 */
export function IconBox({ icon, emojiSize, size = 'md', ...props }: IconBoxProps) {
  const defaultEmojiSize = size === 'xs' ? 16 : size === 'sm' ? 20 : size === 'lg' ? 28 : 24

  return (
    <IconBoxFrame size={size} {...props}>
      {typeof icon === 'string' ? (
        <Text fontSize={emojiSize ?? defaultEmojiSize}>{icon}</Text>
      ) : (
        icon
      )}
    </IconBoxFrame>
  )
}

/**
 * HeaderIconBox - Icon box for card headers (darker background)
 */
const HeaderIconBoxFrame = styled(View, {
  p: '$2',
  br: '$3',
  justifyContent: 'center',
  alignItems: 'center',

  variants: {
    colorScheme: {
      coral: { bg: '$coral8' },
      orange: { bg: '$orange8' },
      green: { bg: '$green8' },
      amber: { bg: '$amber8' },
      purple: { bg: '$purple8' },
      gray: { bg: '$gray8' },
    },
  } as const,

  defaultVariants: {
    colorScheme: 'orange',
  },
})

export type HeaderIconBoxProps = GetProps<typeof HeaderIconBoxFrame> & {
  icon: ReactNode
}

/**
 * HeaderIconBox - Darker icon box for card headers
 *
 * @example
 * ```tsx
 * <HeaderIconBox colorScheme="coral" icon={<Trophy color="white" size={20} />} />
 * ```
 */
export function HeaderIconBox({ icon, ...props }: HeaderIconBoxProps) {
  return <HeaderIconBoxFrame {...props}>{icon}</HeaderIconBoxFrame>
}
