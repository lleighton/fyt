import { ReactNode } from 'react'
import { YStack, XStack, Text, Card, styled, GetProps } from 'tamagui'
import { CheckCircle } from '@tamagui/lucide-icons'

import { IconBox } from './IconBox'

type ColorScheme = 'coral' | 'orange' | 'green' | 'amber' | 'purple'

const colorConfig: Record<ColorScheme, {
  selectedBg: string
  unselectedBg: string
  selectedHover: string
  unselectedHover: string
  border: string
  check: string
}> = {
  coral: {
    selectedBg: '$coral2',
    unselectedBg: '$gray2',
    selectedHover: '$coral3',
    unselectedHover: '$gray3',
    border: '$coral10',
    check: '$coral10',
  },
  orange: {
    selectedBg: '$orange2',
    unselectedBg: '$gray2',
    selectedHover: '$orange3',
    unselectedHover: '$gray3',
    border: '$orange10',
    check: '$orange10',
  },
  green: {
    selectedBg: '$green2',
    unselectedBg: '$gray2',
    selectedHover: '$green3',
    unselectedHover: '$gray3',
    border: '$green10',
    check: '$green10',
  },
  amber: {
    selectedBg: '$amber2',
    unselectedBg: '$gray2',
    selectedHover: '$amber3',
    unselectedHover: '$gray3',
    border: '$amber10',
    check: '$amber10',
  },
  purple: {
    selectedBg: '$purple2',
    unselectedBg: '$gray2',
    selectedHover: '$purple3',
    unselectedHover: '$gray3',
    border: '$purple10',
    check: '$purple10',
  },
}

export type SelectableCardProps = GetProps<typeof Card> & {
  /** Whether the card is selected */
  selected: boolean
  /** Selection handler */
  onSelect: () => void
  /** Icon (emoji string or ReactNode) */
  icon?: string | ReactNode
  /** Main title text */
  title: string
  /** Optional description */
  description?: string
  /** Optional subtitle (smaller text) */
  subtitle?: string
  /** Color scheme */
  colorScheme?: ColorScheme
  /** Size of the icon box */
  iconSize?: 'sm' | 'md' | 'lg'
  /** Whether to show check indicator */
  showCheck?: boolean
  /** Custom right content when selected */
  selectedIndicator?: ReactNode
}

/**
 * SelectableCard - Card with selection state for choices
 *
 * Used for exercise selection, challenge types, filter options, etc.
 *
 * @example
 * ```tsx
 * <SelectableCard
 *   selected={selectedExercise === exercise.id}
 *   onSelect={() => setSelectedExercise(exercise.id)}
 *   icon="💪"
 *   title="Push-ups"
 *   description="Upper body strength"
 *   colorScheme="orange"
 * />
 * ```
 */
export function SelectableCard({
  selected,
  onSelect,
  icon,
  title,
  description,
  subtitle,
  colorScheme = 'orange',
  iconSize = 'md',
  showCheck = true,
  selectedIndicator,
  ...props
}: SelectableCardProps) {
  const colors = colorConfig[colorScheme]

  return (
    <Card
      bg={selected ? colors.selectedBg : colors.unselectedBg}
      p="$4"
      br="$4"
      borderWidth={selected ? 2 : 0}
      borderColor={selected ? colors.border : 'transparent'}
      pressStyle={{
        scale: 0.98,
        bg: selected ? colors.selectedHover : colors.unselectedHover,
      }}
      animation="quick"
      onPress={onSelect}
      {...props}
    >
      <XStack gap="$3" alignItems="center">
        {icon && (
          <IconBox
            icon={icon}
            colorScheme={selected ? colorScheme : 'gray'}
            size={iconSize}
          />
        )}
        <YStack flex={1} gap="$1">
          <Text fontWeight="700" fontSize="$4">
            {title}
          </Text>
          {description && (
            <Text color="$gray10" fontSize="$3">
              {description}
            </Text>
          )}
          {subtitle && (
            <Text color="$gray9" fontSize="$2">
              {subtitle}
            </Text>
          )}
        </YStack>
        {selected && showCheck && (
          selectedIndicator ?? <CheckCircle size={28} color={colors.check} />
        )}
      </XStack>
    </Card>
  )
}

/**
 * SelectableChip - Smaller selection option for filter tabs
 *
 * @example
 * ```tsx
 * <XStack gap="$2">
 *   <SelectableChip
 *     selected={filter === 'all'}
 *     onSelect={() => setFilter('all')}
 *     label="All"
 *     count={10}
 *   />
 *   <SelectableChip
 *     selected={filter === 'pending'}
 *     onSelect={() => setFilter('pending')}
 *     label="Pending"
 *     count={3}
 *   />
 * </XStack>
 * ```
 */
export type SelectableChipProps = GetProps<typeof Card> & {
  selected: boolean
  onSelect: () => void
  label: string
  count?: number
  colorScheme?: ColorScheme
}

export function SelectableChip({
  selected,
  onSelect,
  label,
  count,
  colorScheme = 'orange',
  ...props
}: SelectableChipProps) {
  const colors = colorConfig[colorScheme]

  return (
    <Card
      bg={selected ? colors.selectedBg : '$gray2'}
      px="$3"
      py="$2"
      br="$3"
      borderWidth={selected ? 2 : 1}
      borderColor={selected ? colors.border : '$gray5'}
      pressStyle={{ scale: 0.97 }}
      animation="quick"
      onPress={onSelect}
      {...props}
    >
      <XStack gap="$2" alignItems="center">
        <Text
          fontWeight={selected ? '700' : '500'}
          fontSize="$3"
          color={selected ? colors.border : '$gray11'}
        >
          {label}
        </Text>
        {count !== undefined && (
          <Text
            fontWeight="700"
            fontSize="$2"
            color={selected ? colors.border : '$gray9'}
          >
            {count}
          </Text>
        )}
      </XStack>
    </Card>
  )
}
