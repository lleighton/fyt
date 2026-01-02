import { createAnimations } from '@tamagui/animations-react-native'
import { createInterFont } from '@tamagui/font-inter'
import { createMedia } from '@tamagui/react-native-media-driver'
import { shorthands } from '@tamagui/shorthands'
import { createTamagui, createTokens, createTheme } from 'tamagui'

// ============================================================================
// FYT.IT TAMAGUI CONFIGURATION
// ============================================================================
// Brand: Energetic but approachable, competitive but not aggressive,
// warm and inviting to users of any age or ability.
//
// Orange primary because it:
// - Encourages social interaction and community
// - Combines energy (red) with friendliness (yellow)
// - Represents motivation, positive attitude, enthusiasm
// - Drives action without aggression
// ============================================================================

// ----------------------------------------------------------------------------
// ANIMATIONS
// ----------------------------------------------------------------------------

const animations = createAnimations({
  fast: {
    type: 'timing',
    duration: 150,
  },
  medium: {
    type: 'timing',
    duration: 250,
  },
  slow: {
    type: 'timing',
    duration: 400,
  },
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
  lazy: {
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
  celebration: {
    type: 'spring',
    damping: 8,
    mass: 0.5,
    stiffness: 200,
  },
})

// ----------------------------------------------------------------------------
// FONTS
// ----------------------------------------------------------------------------

const headingFont = createInterFont({
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 24,
    9: 32,
    10: 40,
    11: 48,
    12: 56,
    13: 64,
    14: 72,
    15: 86,
    16: 100,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
  face: {
    400: { normal: 'Inter' },
    500: { normal: 'InterMedium' },
    600: { normal: 'InterSemiBold' },
    700: { normal: 'InterBold' },
  },
})

const bodyFont = createInterFont(
  {
    weight: {
      4: '400',
      5: '500',
      6: '600',
      7: '700',
    },
    face: {
      400: { normal: 'Inter' },
      500: { normal: 'InterMedium' },
      600: { normal: 'InterSemiBold' },
      700: { normal: 'InterBold' },
    },
  },
  { sizeLineHeight: (size) => Math.round(size * 1.5) }
)

// ----------------------------------------------------------------------------
// COLOR PALETTE
// ----------------------------------------------------------------------------

const palette = {
  // Primary Orange - Energy, motivation, social warmth
  orange50: '#FFF7ED',
  orange100: '#FFEDD5',
  orange200: '#FED7AA',
  orange300: '#FDBA74',
  orange400: '#FB923C',
  orange500: '#F97316', // Primary brand color
  orange600: '#EA580C',
  orange700: '#C2410C',
  orange800: '#9A3412',
  orange900: '#7C2D12',

  // Accent Gold - Streaks, achievements
  gold400: '#FACC15',
  gold500: '#EAB308',
  gold600: '#CA8A04',

  // Energy Red - CTAs, competitive moments
  red500: '#EF4444',
  red600: '#DC2626',

  // Success Green - Completed challenges
  green500: '#22C55E',
  green600: '#16A34A',

  // Neutral Warm Grays
  gray50: '#FAFAF9',
  gray100: '#F5F5F4',
  gray200: '#E7E5E4',
  gray300: '#D6D3D1',
  gray400: '#A8A29E',
  gray500: '#78716C',
  gray600: '#57534E',
  gray700: '#44403C',
  gray800: '#292524',
  gray900: '#1C1917',
  gray950: '#0C0A09',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
}

// ----------------------------------------------------------------------------
// TOKENS
// ----------------------------------------------------------------------------

const size = {
  0: 0,
  0.25: 2,
  0.5: 4,
  0.75: 8,
  1: 12,
  1.5: 16,
  2: 20,
  2.5: 24,
  3: 28,
  3.5: 32,
  4: 36,
  4.5: 40,
  5: 44,
  6: 52,
  7: 64,
  8: 76,
  9: 88,
  10: 100,
  11: 120,
  12: 140,
  true: 44,
}

const space = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  4.5: 18,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  true: 16,
  '-0.5': -2,
  '-1': -4,
  '-1.5': -6,
  '-2': -8,
  '-3': -12,
  '-4': -16,
}

const radius = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 20,
  10: 24,
  true: 8,
}

const zIndex = {
  0: 0,
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
}

const tokens = createTokens({
  size,
  space,
  radius,
  zIndex,
  color: {
    ...palette,
    // Semantic color aliases
    red10: palette.red500,
    red2: '#FEF2F2',
    red4: '#FECACA',
    green10: palette.green500,
    green2: '#F0FDF4',
    gray2: palette.gray100,
    gray4: palette.gray200,
    gray5: palette.gray300,
    gray8: palette.gray600,
    gray10: palette.gray500,
    gray11: palette.gray600,
    gray12: palette.gray900,
    // Purple for goals/secondary accent
    purple50: '#FAF5FF',
    purple100: '#F3E8FF',
    purple500: '#A855F7',
    purple600: '#9333EA',
    purple700: '#7E22CE',
  },
})

// ----------------------------------------------------------------------------
// LIGHT THEME
// ----------------------------------------------------------------------------

const lightTheme = createTheme({
  // Backgrounds
  background: palette.gray50,
  backgroundHover: palette.gray100,
  backgroundPress: palette.gray200,
  backgroundFocus: palette.orange50,
  backgroundStrong: palette.white,
  backgroundTransparent: palette.transparent,

  // Primary (orange)
  primary: palette.orange500,
  primaryHover: palette.orange600,
  primaryPress: palette.orange700,

  // Text
  color: palette.gray900,
  colorHover: palette.gray950,
  colorPress: palette.gray950,
  colorFocus: palette.gray900,
  colorTransparent: palette.transparent,

  // Placeholder
  placeholderColor: palette.gray400,

  // Borders
  borderColor: palette.gray200,
  borderColorHover: palette.gray300,
  borderColorPress: palette.gray400,
  borderColorFocus: palette.orange400,

  // Shadows
  shadowColor: 'rgba(28, 25, 23, 0.08)',
  shadowColorHover: 'rgba(28, 25, 23, 0.12)',
  shadowColorPress: 'rgba(28, 25, 23, 0.16)',
  shadowColorFocus: 'rgba(249, 115, 22, 0.24)',

  // Purple - Goals and secondary accent
  purple1: '#FAF5FF',
  purple2: '#F3E8FF',
  purple3: '#E9D5FF',
  purple4: '#D8B4FE',
  purple5: '#C084FC',
  purple6: '#A855F7',
  purple7: '#A855F7',
  purple8: '#9333EA',
  purple9: '#7E22CE',
  purple10: '#A855F7',
  purple11: '#9333EA',
  purple12: '#581C87',

  gray1: palette.gray50,
  gray2: palette.gray100,
  gray3: palette.gray200,
  gray4: palette.gray200,
  gray5: palette.gray300,
  gray6: palette.gray400,
  gray7: palette.gray500,
  gray8: palette.gray600,
  gray9: palette.gray700,
  gray10: palette.gray500,
  gray11: palette.gray600,
  gray12: palette.gray900,

  red1: '#FEF2F2',
  red2: '#FEE2E2',
  red3: '#FECACA',
  red4: '#FCA5A5',
  red5: '#F87171',
  red6: palette.red500,
  red7: palette.red500,
  red8: palette.red600,
  red9: '#B91C1C',
  red10: palette.red500,
  red11: palette.red600,
  red12: '#7F1D1D',

  green1: '#F0FDF4',
  green2: '#DCFCE7',
  green3: '#BBF7D0',
  green4: '#86EFAC',
  green5: '#4ADE80',
  green6: palette.green500,
  green7: palette.green500,
  green8: palette.green600,
  green9: '#15803D',
  green10: palette.green500,
  green11: palette.green600,
  green12: '#14532D',

  orange1: palette.orange50,
  orange2: palette.orange100,
  orange3: palette.orange200,
  orange4: palette.orange300,
  orange5: palette.orange400,
  orange6: palette.orange500,
  orange7: palette.orange500,
  orange8: palette.orange600,
  orange9: palette.orange700,
  orange10: palette.orange500,
  orange11: palette.orange600,
  orange12: palette.orange900,

  yellow1: '#FEFCE8',
  yellow2: '#FEF9C3',
  yellow3: '#FEF08A',
  yellow4: palette.gold400,
  yellow5: palette.gold400,
  yellow6: palette.gold500,
  yellow7: palette.gold500,
  yellow8: palette.gold600,
  yellow9: '#A16207',
  yellow10: palette.gold500,
  yellow11: palette.gold600,
  yellow12: '#713F12',
})

// ----------------------------------------------------------------------------
// DARK THEME
// ----------------------------------------------------------------------------

const darkTheme = createTheme({
  // Backgrounds
  background: palette.gray950,
  backgroundHover: palette.gray900,
  backgroundPress: palette.gray800,
  backgroundFocus: palette.orange900,
  backgroundStrong: palette.gray900,
  backgroundTransparent: palette.transparent,

  // Primary (orange - brighter for dark mode)
  primary: palette.orange500,
  primaryHover: palette.orange400,
  primaryPress: palette.orange600,

  // Text
  color: palette.gray50,
  colorHover: palette.white,
  colorPress: palette.white,
  colorFocus: palette.gray50,
  colorTransparent: palette.transparent,

  // Placeholder
  placeholderColor: palette.gray500,

  // Borders
  borderColor: palette.gray800,
  borderColorHover: palette.gray700,
  borderColorPress: palette.gray600,
  borderColorFocus: palette.orange500,

  // Shadows
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  shadowColorHover: 'rgba(0, 0, 0, 0.4)',
  shadowColorPress: 'rgba(0, 0, 0, 0.5)',
  shadowColorFocus: 'rgba(249, 115, 22, 0.3)',

  // Purple - Goals and secondary accent (VIBRANT for dark mode)
  purple1: '#2E1065',
  purple2: '#3B0764',
  purple3: '#581C87',
  purple4: '#6B21A8',
  purple5: '#7E22CE',
  purple6: '#A855F7',
  purple7: '#A855F7',
  purple8: '#C084FC',
  purple9: '#A855F7',
  purple10: '#A855F7',
  purple11: '#C084FC',
  purple12: '#E9D5FF',

  gray1: palette.gray950,
  gray2: palette.gray900,
  gray3: palette.gray800,
  gray4: palette.gray700,
  gray5: palette.gray600,
  gray6: palette.gray500,
  gray7: palette.gray400,
  gray8: palette.gray300,
  gray9: palette.gray200,
  gray10: palette.gray400,
  gray11: palette.gray300,
  gray12: palette.gray50,

  red1: '#2A0808',
  red2: '#450A0A',
  red3: '#7F1D1D',
  red4: '#991B1B',
  red5: '#B91C1C',
  red6: palette.red500,
  red7: palette.red500,
  red8: '#F87171',
  red9: palette.red500,
  red10: palette.red500,
  red11: '#F87171',
  red12: '#FEE2E2',

  green1: '#052E16',
  green2: '#14532D',
  green3: '#166534',
  green4: '#15803D',
  green5: palette.green600,
  green6: palette.green500,
  green7: palette.green500,
  green8: palette.green500,
  green9: palette.green500,
  green10: palette.green500,
  green11: '#4ADE80',
  green12: '#86EFAC',

  orange1: palette.orange900,
  orange2: palette.orange800,
  orange3: palette.orange700,
  orange4: palette.orange600,
  orange5: palette.orange500,
  orange6: palette.orange500,
  orange7: palette.orange500,
  orange8: palette.orange400,
  orange9: palette.orange300,
  orange10: palette.orange500,
  orange11: palette.orange400,
  orange12: palette.orange200,

  yellow1: '#422006',
  yellow2: '#713F12',
  yellow3: '#854D0E',
  yellow4: '#A16207',
  yellow5: palette.gold600,
  yellow6: palette.gold500,
  yellow7: palette.gold500,
  yellow8: palette.gold400,
  yellow9: palette.gold500,
  yellow10: palette.gold500,
  yellow11: palette.gold400,
  yellow12: '#FEF9C3',
})

// ----------------------------------------------------------------------------
// MEDIA QUERIES
// ----------------------------------------------------------------------------

const media = createMedia({
  xs: { maxWidth: 660 },
  sm: { maxWidth: 800 },
  md: { maxWidth: 1020 },
  lg: { maxWidth: 1280 },
  xl: { maxWidth: 1420 },
  xxl: { maxWidth: 1600 },
  gtXs: { minWidth: 661 },
  gtSm: { minWidth: 801 },
  gtMd: { minWidth: 1021 },
  gtLg: { minWidth: 1281 },
  short: { maxHeight: 820 },
  tall: { minHeight: 820 },
  hoverNone: { hover: 'none' },
  pointerCoarse: { pointer: 'coarse' },
})

// ----------------------------------------------------------------------------
// CONFIGURATION EXPORT
// ----------------------------------------------------------------------------

export const config = createTamagui({
  animations,
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  media,
})

export default config

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
