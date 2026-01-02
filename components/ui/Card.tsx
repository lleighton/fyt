import { styled, Card as TamaguiCard } from 'tamagui'

/**
 * Base Card with subtle shadow
 *
 * Use for list items, form sections, and general content containers
 */
export const CardBase = styled(TamaguiCard, {
  bg: '$gray2',
  p: '$4',
  br: '$5',
  borderWidth: 0,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 1,

  variants: {
    size: {
      sm: {
        p: '$3',
        br: '$4',
      },
      md: {
        p: '$4',
        br: '$5',
      },
      lg: {
        p: '$5',
        br: '$6',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
})

/**
 * Elevated Card with stronger shadow
 *
 * Use for featured items, CTAs, and important content
 */
export const CardElevated = styled(TamaguiCard, {
  bg: '$gray2',
  p: '$5',
  br: '$6',
  borderWidth: 0,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 3,
})

/**
 * Interactive Card with press feedback
 *
 * Use for selectable items, buttons, and navigation cards
 */
export const CardInteractive = styled(TamaguiCard, {
  bg: '$gray2',
  p: '$4',
  br: '$5',
  borderWidth: 0,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 1,
  pressStyle: { scale: 0.97, opacity: 0.9 },
  animation: 'quick',
  cursor: 'pointer',
})

/**
 * Success Card (green theme)
 *
 * Use for completed states, success messages, confirmation
 */
export const CardSuccess = styled(TamaguiCard, {
  bg: '$green2',
  p: '$4',
  br: '$5',
  borderWidth: 1,
  borderColor: '$green7',
  shadowColor: '$green10',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 2,
})

/**
 * Warning Card (orange/yellow theme)
 *
 * Use for warnings, pending states, attention-needed items
 */
export const CardWarning = styled(TamaguiCard, {
  bg: '$orange2',
  p: '$4',
  br: '$5',
  borderWidth: 1,
  borderColor: '$orange6',
  shadowColor: '$orange10',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 1,
})

/**
 * Error/Danger Card (red theme)
 *
 * Use for errors, destructive actions, danger zones
 */
export const CardDanger = styled(TamaguiCard, {
  bg: '$red2',
  p: '$4',
  br: '$5',
  borderWidth: 1,
  borderColor: '$red6',
})

/**
 * Info Card (blue theme)
 *
 * Use for information, tips, and neutral highlights
 */
export const CardInfo = styled(TamaguiCard, {
  bg: '$orange2',
  p: '$4',
  br: '$4',
  borderWidth: 1,
  borderColor: '$orange10',
})

/**
 * Outline Card (no background)
 *
 * Use for subtle containers that need a border
 */
export const CardOutline = styled(TamaguiCard, {
  bg: 'transparent',
  p: '$4',
  br: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
})
