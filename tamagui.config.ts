import { createAnimations } from '@tamagui/animations-react-native'
import { createInterFont } from '@tamagui/font-inter'
import { createMedia } from '@tamagui/react-native-media-driver'
import { shorthands } from '@tamagui/shorthands'
import { themes, tokens } from '@tamagui/config/v3'
import { createTamagui, createTokens } from 'tamagui'

// Custom animations for the app
const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  slow: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  tooltip: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  // For celebration animations
  celebration: {
    type: 'spring',
    damping: 8,
    mass: 0.5,
    stiffness: 200,
  },
})

// Fonts
const headingFont = createInterFont({
  size: {
    6: 15,
    7: 18,
    8: 21,
    9: 28,
    10: 36,
    11: 44,
    12: 56,
    13: 72,
  },
  weight: {
    6: '600',
    7: '700',
  },
  face: {
    700: { normal: 'InterBold' },
    600: { normal: 'InterSemiBold' },
  },
})

const bodyFont = createInterFont(
  {
    face: {
      400: { normal: 'Inter' },
      500: { normal: 'InterMedium' },
    },
  },
  {
    sizeLineHeight: (size) => Math.round(size * 1.5),
  }
)

// Custom tokens for fitness app theming
const customTokens = createTokens({
  ...tokens,
  color: {
    ...tokens.color,
    // Fitness-themed colors
    fireRed: '#FF4444',
    fireOrange: '#FF8C00',
    successGreen: '#10B981',
    streakGold: '#FFD700',
    iceBlue: '#00BFFF',
    // Challenge type colors
    amrapPurple: '#8B5CF6',
    maxEffortRed: '#EF4444',
    timedBlue: '#3B82F6',
    distanceGreen: '#22C55E',
  },
})

// Custom themes for different challenge states
const customThemes = {
  ...themes,
  fire: {
    ...themes.light,
    background: '#FFF5F5',
    backgroundHover: '#FFE5E5',
    backgroundPress: '#FFD5D5',
    color: '#FF4444',
    colorHover: '#FF2222',
  },
  ice: {
    ...themes.light,
    background: '#F0F9FF',
    backgroundHover: '#E0F2FE',
    backgroundPress: '#BAE6FD',
    color: '#0EA5E9',
    colorHover: '#0284C7',
  },
  gold: {
    ...themes.light,
    background: '#FFFBEB',
    backgroundHover: '#FEF3C7',
    backgroundPress: '#FDE68A',
    color: '#F59E0B',
    colorHover: '#D97706',
  },
}

export const config = createTamagui({
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes: customThemes,
  tokens: customTokens,
  animations,
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
})

export default config

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
