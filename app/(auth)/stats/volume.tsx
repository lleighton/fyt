import { useState, useMemo } from 'react'
import { Dimensions } from 'react-native'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, ScrollView, View, Card, useTheme } from 'tamagui'
import { Activity, TrendingUp, TrendingDown, Calendar } from '@tamagui/lucide-icons'
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg'
import { SafeArea, ScreenHeader } from '@/components/ui'

import { store$ } from '@/lib/legend-state/store'

type Period = 7 | 30 | 90

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
]

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  upper_body: '#F43F5E',
  lower_body: '#22C55E',
  core: '#F59E0B',
  full_body: '#A855F7',
}

const CATEGORY_LABELS: Record<string, string> = {
  upper_body: 'Upper Body',
  lower_body: 'Lower Body',
  core: 'Core',
  full_body: 'Full Body',
}

/**
 * Volume Detail Page
 * Shows volume trends over time with line chart
 */
function VolumeDetailPage() {
  const theme = useTheme()
  const [period, setPeriod] = useState<Period>(7)

  const volumeData = store$.getVolumeByPeriod(period)
  const categoryBreakdown = store$.getCategoryBreakdown(period)

  // Find best day
  const bestDay = useMemo(() => {
    if (!volumeData.byDate.length) return null
    return volumeData.byDate.reduce((best, day) =>
      day.value > (best?.value || 0) ? day : best
    , volumeData.byDate[0])
  }, [volumeData.byDate])

  // Daily average
  const dailyAvg = volumeData.total > 0
    ? Math.round(volumeData.total / period)
    : 0

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        <ScreenHeader
          subtitle="Stats"
          title="VOLUME"
          titleIcon={<Activity size={20} color="$amber10" />}
        />

        <ScrollView flex={1}>
          <YStack px="$4" py="$3" gap="$5">
            {/* Period Selector */}
            <XStack gap="$2">
              {PERIODS.map((p) => (
                <View
                  key={p.value}
                  flex={1}
                  py="$2.5"
                  br="$3"
                  bg={period === p.value ? '$amber10' : '$gray3'}
                  pressStyle={{ opacity: 0.8 }}
                  onPress={() => setPeriod(p.value)}
                  accessible={true}
                  accessibilityLabel={`Show ${p.label} data`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: period === p.value }}
                >
                  <Text
                    textAlign="center"
                    fontSize="$3"
                    fontWeight="700"
                    color={period === p.value ? 'white' : '$gray11'}
                  >
                    {p.label}
                  </Text>
                </View>
              ))}
            </XStack>

            {/* Chart */}
            <Card bg="$gray2" br="$4" borderWidth={1} borderColor="$gray4" p="$4">
              <VolumeChart
                data={volumeData.byDate}
                lineColor={theme.coral10?.val || '#F43F5E'}
              />
            </Card>

            {/* Stats Cards */}
            <XStack gap="$3">
              <StatCard
                label="Total"
                value={store$.formatNumber(volumeData.total)}
                icon={<Activity size={18} color="$amber10" />}
                color="$amber"
              />
              <StatCard
                label="Daily Avg"
                value={store$.formatNumber(dailyAvg)}
                icon={<Calendar size={18} color="$coral10" />}
                color="$coral"
              />
            </XStack>

            {/* Comparison */}
            {volumeData.previousTotal > 0 && (
              <Card bg="$gray2" br="$4" borderWidth={1} borderColor="$gray4" p="$4">
                <XStack alignItems="center" gap="$3">
                  <View
                    p="$2"
                    br="$3"
                    bg={volumeData.percentChange >= 0 ? '$green3' : '$red3'}
                  >
                    {volumeData.percentChange >= 0 ? (
                      <TrendingUp size={20} color="$green10" />
                    ) : (
                      <TrendingDown size={20} color="$red10" />
                    )}
                  </View>
                  <YStack flex={1}>
                    <Text color="$gray10" fontSize="$2">
                      vs previous {period} days
                    </Text>
                    <Text
                      fontFamily="$mono"
                      fontSize={24}
                      fontWeight="700"
                      color={volumeData.percentChange >= 0 ? '$green10' : '$red10'}
                    >
                      {volumeData.percentChange >= 0 ? '+' : ''}
                      {volumeData.percentChange}%
                    </Text>
                  </YStack>
                  <YStack alignItems="flex-end">
                    <Text color="$gray10" fontSize="$2">Previous</Text>
                    <Text fontWeight="600" color="$gray11">
                      {store$.formatNumber(volumeData.previousTotal)}
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            )}

            {/* Category Breakdown */}
            <YStack gap="$3">
              <Text
                fontFamily="$display"
                fontSize={20}
                color="$gray12"
                letterSpacing={1}
              >
                BY CATEGORY
              </Text>

              {categoryBreakdown.categories
                .filter((c) => c.value > 0)
                .sort((a, b) => b.value - a.value)
                .map((category) => (
                  <CategoryBar
                    key={category.name}
                    name={CATEGORY_LABELS[category.name] || category.name}
                    value={category.value}
                    percentage={category.percentage}
                    color={CATEGORY_COLORS[category.name] || '#888'}
                    total={categoryBreakdown.total}
                  />
                ))}

              {categoryBreakdown.total === 0 && (
                <Text color="$gray10" fontSize="$3" textAlign="center" py="$4">
                  No activity in this period
                </Text>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </SafeArea>
  )
}

/**
 * Line chart for volume over time
 */
function VolumeChart({
  data,
  lineColor,
}: {
  data: Array<{ date: string; value: number }>
  lineColor: string
}) {
  const theme = useTheme()
  const screenWidth = Dimensions.get('window').width
  const chartWidth = screenWidth - 64 // padding
  const chartHeight = 160

  const padding = { top: 20, right: 10, bottom: 30, left: 40 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  // Generate points
  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth
    const y = padding.top + innerHeight - (d.value / maxValue) * innerHeight
    return { x, y, value: d.value, date: d.date }
  })

  // Create polyline string
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Grid lines
  const gridLines = [0, 0.5, 1].map((ratio) => ({
    y: padding.top + innerHeight * (1 - ratio),
    value: Math.round(maxValue * ratio),
  }))

  // Date labels
  const dateLabels = [
    { index: 0, label: formatDateLabel(data[0]?.date) },
    { index: Math.floor(data.length / 2), label: formatDateLabel(data[Math.floor(data.length / 2)]?.date) },
    { index: data.length - 1, label: formatDateLabel(data[data.length - 1]?.date) },
  ]

  const gridColor = theme.gray6?.val || '#E5E5E5'
  const textColor = theme.gray10?.val || '#888'

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Grid lines */}
      {gridLines.map((line, i) => (
        <Line
          key={i}
          x1={padding.left}
          y1={line.y}
          x2={chartWidth - padding.right}
          y2={line.y}
          stroke={gridColor}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      ))}

      {/* Y-axis labels */}
      {gridLines.map((line, i) => (
        <SvgText
          key={i}
          x={padding.left - 8}
          y={line.y + 4}
          fill={textColor}
          fontSize={10}
          textAnchor="end"
        >
          {store$.formatNumber(line.value)}
        </SvgText>
      ))}

      {/* Line */}
      {points.length > 1 && (
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Data points */}
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.value > 0 ? 4 : 2}
          fill={p.value > 0 ? lineColor : gridColor}
        />
      ))}

      {/* X-axis labels */}
      {dateLabels.map((label) => (
        <SvgText
          key={label.index}
          x={points[label.index]?.x || 0}
          y={chartHeight - 8}
          fill={textColor}
          fontSize={10}
          textAnchor="middle"
        >
          {label.label}
        </SvgText>
      ))}
    </Svg>
  )
}

/**
 * Stat card component
 */
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card flex={1} bg="$gray2" br="$4" borderWidth={1} borderColor="$gray4" p="$4">
      <YStack gap="$2">
        <XStack alignItems="center" gap="$2">
          {icon}
          <Text color="$gray10" fontSize="$2" fontWeight="500">
            {label}
          </Text>
        </XStack>
        <Text
          fontFamily="$mono"
          fontSize={32}
          fontWeight="700"
          color="$gray12"
        >
          {value}
        </Text>
      </YStack>
    </Card>
  )
}

/**
 * Category breakdown bar
 */
function CategoryBar({
  name,
  value,
  percentage,
  color,
  total,
}: {
  name: string
  value: number
  percentage: number
  color: string
  total: number
}) {
  return (
    <Card bg="$gray2" br="$4" borderWidth={1} borderColor="$gray4" p="$4">
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack alignItems="center" gap="$2">
            <View width={12} height={12} br="$2" bg={color} />
            <Text fontWeight="600" color="$gray12">
              {name}
            </Text>
          </XStack>
          <Text fontFamily="$mono" fontWeight="700" color="$gray12">
            {store$.formatNumber(value)}
          </Text>
        </XStack>
        <View height={8} br="$2" bg="$gray4" overflow="hidden">
          <View
            height="100%"
            width={`${percentage}%`}
            bg={color}
            br="$2"
          />
        </View>
        <Text color="$gray10" fontSize="$2">
          {percentage}% of total
        </Text>
      </YStack>
    </Card>
  )
}

/**
 * Format date for chart labels
 */
function formatDateLabel(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default observer(VolumeDetailPage)
