/**
 * Shared card variant configuration system
 *
 * Provides consistent styling across StreakCard, StatsSummaryCard, and other card components.
 * Each variant defines base properties that components can map to their specific needs.
 */

export type CardColorScheme = 'coral' | 'orange' | 'green' | 'amber' | 'purple'
export type CardVariant = 'gradient' | 'subtle' | 'glass' | 'accent' | 'minimal' | 'glow'

export interface CardVariantConfig {
  bg?: string
  gradientColors?: string[]
  gradientStart?: [number, number]
  gradientEnd?: [number, number]
  gradientLocations?: number[]
  borderWidth?: number
  borderColor?: string
  iconBg: string
  iconBorder?: string
  // Text colors by semantic role (10=muted, 11=secondary, 12=primary)
  primaryColor: string    // Main text (titles, values)
  secondaryColor: string  // Supporting text (subtitles, units)
  accentColor: string     // Accent elements (chevrons, links)
}

type VariantGenerator = (color: CardColorScheme) => CardVariantConfig

/**
 * Generate variant config for a given color scheme
 */
const variantGenerators: Record<CardVariant, VariantGenerator> = {
  gradient: (color) => ({
    gradientColors: [`$${color}4`, `$${color}6`],
    gradientStart: [0, 0],
    gradientEnd: [1, 1],
    primaryColor: `$${color}12`,
    secondaryColor: `$${color}11`,
    accentColor: `$${color}11`,
    iconBg: `$${color}8`,
  }),

  subtle: (color) => ({
    bg: '$gray2',
    borderWidth: 1,
    borderColor: `$${color}4`,
    primaryColor: `$${color}10`,
    secondaryColor: '$gray11',
    accentColor: `$${color}10`,
    iconBg: `$${color}3`,
  }),

  glass: (color) => ({
    bg: `$${color}2`,
    borderWidth: 1,
    borderColor: `$${color}5`,
    primaryColor: `$${color}12`,
    secondaryColor: `$${color}11`,
    accentColor: `$${color}11`,
    iconBg: color === 'green' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)',
    iconBorder: `$${color}6`,
  }),

  accent: (color) => ({
    bg: '$gray2',
    gradientColors: [`$${color}6`, `$${color}5`],
    gradientStart: [0, 0],
    gradientEnd: [1, 0],
    primaryColor: '$gray12',
    secondaryColor: '$gray11',
    accentColor: `$${color}10`,
    iconBg: `$${color}4`,
  }),

  minimal: (color) => ({
    bg: '$gray2',
    primaryColor: `$${color}10`,
    secondaryColor: '$gray11',
    accentColor: '$gray10',
    iconBg: '$gray3',
  }),

  glow: (color) => ({
    bg: '$gray3',
    borderWidth: 2,
    borderColor: `$${color}5`,
    primaryColor: `$${color}10`,
    secondaryColor: `$${color}11`,
    accentColor: `$${color}10`,
    iconBg: `$${color}5`,
  }),
}

/**
 * Get the variant configuration for a specific variant and color scheme
 */
export function getCardVariantConfig(
  variant: CardVariant,
  colorScheme: CardColorScheme
): CardVariantConfig {
  return variantGenerators[variant](colorScheme)
}

/**
 * Pre-built variant configurations for all combinations
 * Use this for static lookups where you need the full config object
 */
export const cardVariants: Record<CardVariant, Record<CardColorScheme, CardVariantConfig>> =
  Object.fromEntries(
    (['gradient', 'subtle', 'glass', 'accent', 'minimal', 'glow'] as CardVariant[]).map(
      (variant) => [
        variant,
        Object.fromEntries(
          (['coral', 'orange', 'green', 'amber', 'purple'] as CardColorScheme[]).map(
            (color) => [color, getCardVariantConfig(variant, color)]
          )
        ),
      ]
    )
  ) as Record<CardVariant, Record<CardColorScheme, CardVariantConfig>>
