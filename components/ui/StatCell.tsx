import { ReactNode } from 'react'
import { YStack, XStack, Text, View, GetProps } from 'tamagui'

import { IconBox } from './IconBox'
import { CardColorScheme } from './cardVariants'

type ColorScheme = Exclude<CardColorScheme, 'orange'>

const colorConfig: Record<ColorScheme, {
  bg: string
  border: string
  title: string
  value: string
  changeBg: string
  changeText: string
}> = {
  coral: {
    bg: 'white',
    border: '$coral7',
    title: '#1a1a1a',
    value: '#be123c',
    changeBg: '$green4',
    changeText: '#166534',
  },
  green: {
    bg: 'white',
    border: '$green7',
    title: '#1a1a1a',
    value: '#166534',
    changeBg: '$green4',
    changeText: '#166534',
  },
  amber: {
    bg: 'white',
    border: '$amber7',
    title: '#1a1a1a',
    value: '#b45309',
    changeBg: '$green4',
    changeText: '#166534',
  },
  purple: {
    bg: 'white',
    border: '$purple7',
    title: '#1a1a1a',
    value: '#7c3aed',
    changeBg: '$green4',
    changeText: '#166534',
  },
}

export type StatCellProps = GetProps<typeof View> & {
  /** Icon (emoji string or ReactNode) */
  icon: string | ReactNode
  /** Label/title text */
  title: string
  /** The main numeric value to display */
  value: number | string
  /** Optional unit suffix (e.g., "kg", "reps") */
  unit?: string
  /** Optional change amount (positive shows green badge) */
  change?: number
  /** Color scheme */
  colorScheme?: ColorScheme
  /** Size variant */
  size?: 'sm' | 'md'
}

/**
 * StatCell - Compact cell for displaying metrics in grids
 *
 * Used for PRs, stats summaries, and other numeric data displays.
 * Features a prominent value with optional change badge.
 *
 * @example
 * ```tsx
 * // PR cell
 * <StatCell
 *   icon="💪"
 *   title="Push-ups"
 *   value={50}
 *   change={5}
 *   colorScheme="coral"
 * />
 *
 * // Weight stat
 * <StatCell
 *   icon="🏋️"
 *   title="Bench Press"
 *   value={100}
 *   unit="kg"
 *   colorScheme="purple"
 * />
 * ```
 */
export function StatCell({
  icon,
  title,
  value,
  unit,
  change,
  colorScheme = 'coral',
  size = 'sm',
  ...props
}: StatCellProps) {
  const colors = colorConfig[colorScheme]
  const showChange = change !== undefined && change > 0

  const iconSize = size === 'sm' ? 'sm' : 'md'
  const valueSize = size === 'sm' ? '$6' : '$8'
  const titleSize = size === 'sm' ? '$3' : '$4'
  const padding = size === 'sm' ? '$3' : '$4'

  return (
    <View
      flex={1}
      bg={colors.bg}
      br="$3"
      p={padding}
      borderWidth={2}
      borderColor={colors.border}
      {...props}
    >
      <XStack gap="$2.5" alignItems="center">
        <IconBox
          icon={icon}
          colorScheme={colorScheme}
          size={iconSize}
        />
        <YStack flex={1} gap="$1">
          <Text
            fontSize={titleSize}
            fontWeight="700"
            color={colors.title}
            numberOfLines={1}
          >
            {title}
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text
              fontFamily="$mono"
              fontSize={valueSize}
              fontWeight="800"
              color={colors.value}
            >
              {value}{unit ? ` ${unit}` : ''}
            </Text>
            {showChange && (
              <View bg={colors.changeBg} px="$2" py="$1" br="$2">
                <Text fontSize={12} fontWeight="800" color={colors.changeText}>
                  +{change}
                </Text>
              </View>
            )}
          </XStack>
        </YStack>
      </XStack>
    </View>
  )
}

export type StatCellGridProps = {
  /** Array of items to display */
  items: Array<{
    id: string
    icon: string | ReactNode
    title: string
    value: number | string
    unit?: string
    change?: number
  }>
  /** Color scheme for all cells */
  colorScheme?: ColorScheme
  /** Maximum items to show (default: 4 for 2x2 grid) */
  maxItems?: number
  /** Number of columns (default: 2) */
  columns?: number
}

/**
 * StatCellGrid - 2x2 or NxN grid of StatCells
 *
 * Handles layout and empty cell padding automatically.
 *
 * @example
 * ```tsx
 * <StatCellGrid
 *   items={prs.map(pr => ({
 *     id: pr.id,
 *     icon: pr.exercise.icon,
 *     title: pr.exercise.name,
 *     value: pr.best_value,
 *     change: pr.best_value - pr.last_value,
 *   }))}
 *   colorScheme="coral"
 * />
 * ```
 */
export function StatCellGrid({
  items,
  colorScheme = 'coral',
  maxItems = 4,
  columns = 2,
}: StatCellGridProps) {
  const visibleItems = items.slice(0, maxItems)
  const rows: typeof visibleItems[] = []

  // Split into rows
  for (let i = 0; i < visibleItems.length; i += columns) {
    rows.push(visibleItems.slice(i, i + columns))
  }

  return (
    <YStack gap="$2">
      {rows.map((row, rowIndex) => (
        <XStack key={rowIndex} gap="$2">
          {row.map((item) => (
            <StatCell
              key={item.id}
              icon={item.icon}
              title={item.title}
              value={item.value}
              unit={item.unit}
              change={item.change}
              colorScheme={colorScheme}
            />
          ))}
          {/* Padding for incomplete rows */}
          {row.length < columns && (
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View key={`empty-${i}`} flex={1} />
            ))
          )}
        </XStack>
      ))}
    </YStack>
  )
}
