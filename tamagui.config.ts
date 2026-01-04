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
// Coral-Pink primary because it:
// - Feels warm and energetic without the Strava-orange association
// - Modern, fresh aesthetic popular in social/lifestyle apps
// - Combines energy (red/pink) with warmth (coral/peach)
// - Supports gradient brand identity for premium feel
// - Stands out uniquely in the fitness app landscape
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
  // Primary Coral-Pink - Energy, warmth, modern social feel
  // Distinct from Strava orange, feels fresh and premium
  coral50: '#FFF1F2',
  coral100: '#FFE4E6',
  coral200: '#FECDD3',
  coral300: '#FDA4AF',
  coral400: '#FB7185',
  coral500: '#F43F5E', // Primary brand color - vibrant coral-rose
  coral600: '#E11D48',
  coral700: '#BE123C',
  coral800: '#9F1239',
  coral900: '#881337',

  // Secondary Amber - Streaks, achievements, fire moments
  // Keeps warmth for motivation/celebration without being primary
  amber50: '#FFFBEB',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',

  // Accent Pink - Gradients, highlights
  pink400: '#F472B6',
  pink500: '#EC4899',
  pink600: '#DB2777',

  // Energy Red - Urgent CTAs, competitive moments
  red500: '#EF4444',
  red600: '#DC2626',

  // Success Green - Completed challenges
  green500: '#22C55E',
  green600: '#16A34A',

  // Neutral Cool Grays (shifted slightly cooler to complement coral)
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray300: '#D4D4D8',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray800: '#27272A',
  gray900: '#18181B',
  gray950: '#09090B',

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
    // Coral aliases (primary brand)
    coral10: palette.coral500,
    // Amber aliases (streaks, achievements)
    amber10: palette.amber500,
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
  backgroundFocus: palette.coral50,
  backgroundStrong: palette.white,
  backgroundTransparent: palette.transparent,

  // Primary (coral-pink)
  primary: palette.coral500,
  primaryHover: palette.coral600,
  primaryPress: palette.coral700,

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
  borderColorFocus: palette.coral400,

  // Shadows
  shadowColor: 'rgba(24, 24, 27, 0.08)',
  shadowColorHover: 'rgba(24, 24, 27, 0.12)',
  shadowColorPress: 'rgba(24, 24, 27, 0.16)',
  shadowColorFocus: 'rgba(244, 63, 94, 0.24)',

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

  // Coral-Pink scale (primary brand)
  coral1: palette.coral50,
  coral2: palette.coral100,
  coral3: palette.coral200,
  coral4: palette.coral300,
  coral5: palette.coral400,
  coral6: palette.coral500,
  coral7: palette.coral500,
  coral8: palette.coral600,
  coral9: palette.coral700,
  coral10: palette.coral500,
  coral11: palette.coral600,
  coral12: palette.coral900,

  // Orange mapped to coral for backwards compatibility
  orange1: palette.coral50,
  orange2: palette.coral100,
  orange3: palette.coral200,
  orange4: palette.coral300,
  orange5: palette.coral400,
  orange6: palette.coral500,
  orange7: palette.coral500,
  orange8: palette.coral600,
  orange9: palette.coral700,
  orange10: palette.coral500,
  orange11: palette.coral600,
  orange12: palette.coral900,

  // Amber scale (streaks, achievements, fire)
  amber1: palette.amber50,
  amber2: '#FEF3C7',
  amber3: '#FDE68A',
  amber4: palette.amber400,
  amber5: palette.amber400,
  amber6: palette.amber500,
  amber7: palette.amber500,
  amber8: palette.amber600,
  amber9: '#B45309',
  amber10: palette.amber500,
  amber11: palette.amber600,
  amber12: '#78350F',

  // Yellow mapped to amber for backwards compatibility
  yellow1: palette.amber50,
  yellow2: '#FEF3C7',
  yellow3: '#FDE68A',
  yellow4: palette.amber400,
  yellow5: palette.amber400,
  yellow6: palette.amber500,
  yellow7: palette.amber500,
  yellow8: palette.amber600,
  yellow9: '#B45309',
  yellow10: palette.amber500,
  yellow11: palette.amber600,
  yellow12: '#78350F',
})

// ----------------------------------------------------------------------------
// DARK THEME
// ----------------------------------------------------------------------------

const darkTheme = createTheme({
  // Backgrounds
  background: palette.gray950,
  backgroundHover: palette.gray900,
  backgroundPress: palette.gray800,
  backgroundFocus: palette.coral900,
  backgroundStrong: palette.gray900,
  backgroundTransparent: palette.transparent,

  // Primary (coral-pink - vibrant for dark mode)
  primary: palette.coral500,
  primaryHover: palette.coral400,
  primaryPress: palette.coral600,

  // Text
  color: palette.gray50,
  colorHover: palette.white,
  colorPress: palette.white,
  colorFocus: palette.gray50,
  colorTransparent: palette.transparent,

  // Secondary text - WCAG AA compliant (4.5:1 contrast on dark backgrounds)
  colorSecondary: palette.gray400,

  // Placeholder - improved contrast
  placeholderColor: palette.gray400,

  // Borders
  borderColor: palette.gray800,
  borderColorHover: palette.gray700,
  borderColorPress: palette.gray600,
  borderColorFocus: palette.coral500,

  // Shadows
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  shadowColorHover: 'rgba(0, 0, 0, 0.4)',
  shadowColorPress: 'rgba(0, 0, 0, 0.5)',
  shadowColorFocus: 'rgba(244, 63, 94, 0.3)',

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
  // WCAG AA: gray10/11 need 4.5:1 contrast on dark backgrounds
  gray10: '#A1A1AA',
  gray11: '#D4D4D8',
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

  // Coral-Pink scale (primary brand - vibrant for dark mode)
  coral1: palette.coral900,
  coral2: palette.coral800,
  coral3: palette.coral700,
  coral4: palette.coral600,
  coral5: palette.coral500,
  coral6: palette.coral500,
  coral7: palette.coral500,
  coral8: palette.coral400,
  coral9: palette.coral300,
  coral10: palette.coral500,
  coral11: palette.coral400,
  coral12: palette.coral200,

  // Orange mapped to coral for backwards compatibility
  orange1: palette.coral900,
  orange2: palette.coral800,
  orange3: palette.coral700,
  orange4: palette.coral600,
  orange5: palette.coral500,
  orange6: palette.coral500,
  orange7: palette.coral500,
  orange8: palette.coral400,
  orange9: palette.coral300,
  orange10: palette.coral500,
  orange11: palette.coral400,
  orange12: palette.coral200,

  // Amber scale (streaks, achievements, fire - vibrant for dark mode)
  amber1: '#451A03',
  amber2: '#78350F',
  amber3: '#92400E',
  amber4: '#B45309',
  amber5: palette.amber600,
  amber6: palette.amber500,
  amber7: palette.amber500,
  amber8: palette.amber400,
  amber9: palette.amber500,
  amber10: palette.amber500,
  amber11: palette.amber400,
  amber12: '#FEF3C7',

  // Yellow mapped to amber for backwards compatibility
  yellow1: '#451A03',
  yellow2: '#78350F',
  yellow3: '#92400E',
  yellow4: '#B45309',
  yellow5: palette.amber600,
  yellow6: palette.amber500,
  yellow7: palette.amber500,
  yellow8: palette.amber400,
  yellow9: palette.amber500,
  yellow10: palette.amber500,
  yellow11: palette.amber400,
  yellow12: '#FEF3C7',
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
