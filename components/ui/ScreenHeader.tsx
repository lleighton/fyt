import { ReactNode } from 'react'
import { XStack, YStack, Text } from 'tamagui'
import { HeaderBackButton } from './HeaderBackButton'

interface ScreenHeaderProps {
  /** Navigation button style - 'back' shows ArrowLeft, 'close' shows X */
  variant?: 'back' | 'close'
  /** Custom back/close handler (defaults to router.back()) */
  onBack?: () => void
  /** Small uppercase label above title */
  subtitle?: string
  /** Main title text */
  title: string
  /** Icon to display next to title */
  titleIcon?: ReactNode
  /** Color for the title icon */
  titleIconColor?: string
  /** Content to display on the right side */
  rightContent?: ReactNode
  /** Horizontal padding (default: "$4") */
  px?: string | number
  /** Vertical padding (default: "$3") */
  py?: string | number
}

export function ScreenHeader({
  variant = 'back',
  onBack,
  subtitle,
  title,
  titleIcon,
  rightContent,
  px = '$4',
  py = '$3',
}: ScreenHeaderProps) {
  return (
    <XStack px={px} py={py} alignItems="center" gap="$3">
      <HeaderBackButton variant={variant} onPress={onBack} />

      <YStack flex={1}>
        {subtitle && (
          <Text
            color="$gray10"
            fontSize="$2"
            fontFamily="$body"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing={1.2}
          >
            {subtitle}
          </Text>
        )}
        <XStack alignItems="center" gap="$2">
          {titleIcon}
          <Text
            fontFamily="$display"
            fontSize={28}
            color="$gray12"
            letterSpacing={1}
          >
            {title}
          </Text>
        </XStack>
      </YStack>

      {rightContent}
    </XStack>
  )
}
