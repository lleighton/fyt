import { useState, useMemo } from 'react'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, Card, Button, useTheme } from 'tamagui'
import Svg, { Line, Circle, Polyline, G, Text as SvgText } from 'react-native-svg'
import { completions$, tagRecipients$ } from '@/lib/legend-state/store'

type Period = 7 | 30 | 90

interface ActivityChartProps {
  defaultPeriod?: Period
}

/**
 * Activity line chart showing completions over time
 * Displays 7, 30, or 90 day views with period selector
 */
function ActivityChart({ defaultPeriod = 7 }: ActivityChartProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod)
  const theme = useTheme()

  // Get completions from observables (triggers reactivity)
  const completions = completions$.get()
  const tagRecipients = tagRecipients$.get()

  // Calculate activity data for selected period
  // Includes both challenge completions AND tag response completions
  const data = useMemo(() => {
    const result: Array<{ date: string; count: number }> = []
    const today = new Date()

    // Initialize all days with 0
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(12, 0, 0, 0) // Set to noon to avoid DST issues
      const key = date.toISOString().split('T')[0]
      if (key) {
        result.push({ date: key, count: 0 })
      }
    }

    // Count challenge completions per day
    if (completions) {
      Object.values(completions).forEach((completion: any) => {
        if (completion?.completed_at) {
          const completionDate = completion.completed_at.split('T')[0]
          const dataPoint = result.find((d) => d.date === completionDate)
          if (dataPoint) {
            dataPoint.count++
          }
        }
      })
    }

    // Count tag response completions per day
    if (tagRecipients) {
      Object.values(tagRecipients).forEach((recipient: any) => {
        if (recipient?.status === 'completed' && recipient?.completed_at) {
          const completionDate = recipient.completed_at.split('T')[0]
          const dataPoint = result.find((d) => d.date === completionDate)
          if (dataPoint) {
            dataPoint.count++
          }
        }
      })
    }

    return result
  }, [completions, tagRecipients, period])

  // Chart dimensions
  const width = 320
  const height = 140
  const padding = { top: 20, right: 10, bottom: 30, left: 30 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate max value for y-axis scaling
  const maxValue = Math.max(...data.map((d: { count: number }) => d.count), 1)

  // Generate points for the line chart
  const points = data.map((d: { date: string; count: number }, i: number) => {
    const x = padding.left + (i * chartWidth) / (data.length - 1 || 1)
    const y = padding.top + chartHeight - (d.count / maxValue) * chartHeight
    return { x, y, count: d.count, date: d.date }
  })

  // Format polyline points string
  const linePoints = points.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' ')

  // Get theme colors
  const lineColor = theme.blue10?.val || '#3b82f6'
  const gridColor = theme.gray5?.val || '#e5e7eb'
  const textColor = theme.gray11?.val || '#6b7280'

  return (
    <Card
      bg="$gray2"
      p="$5"
      br="$6"
      borderWidth={0}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={8}
      elevation={2}
    >
      <YStack gap="$4">
        {/* Header with Period Selector */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text
            color="$gray11"
            fontSize="$2"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            Activity Chart
          </Text>
          <XStack gap="$1" bg="$gray4" br="$8" p="$1">
            <Button
              size="$3"
              bg={period === 7 ? '$orange10' : 'transparent'}
              onPress={() => setPeriod(7)}
              px="$3"
              br="$6"
              borderWidth={0}
            >
              <Text color={period === 7 ? 'white' : '$gray11'} fontWeight="600" fontSize="$3">
                7d
              </Text>
            </Button>
            <Button
              size="$3"
              bg={period === 30 ? '$orange10' : 'transparent'}
              onPress={() => setPeriod(30)}
              px="$3"
              br="$6"
              borderWidth={0}
            >
              <Text color={period === 30 ? 'white' : '$gray11'} fontWeight="600" fontSize="$3">
                30d
              </Text>
            </Button>
            <Button
              size="$3"
              bg={period === 90 ? '$orange10' : 'transparent'}
              onPress={() => setPeriod(90)}
              px="$3"
              br="$6"
              borderWidth={0}
            >
              <Text color={period === 90 ? 'white' : '$gray11'} fontWeight="600" fontSize="$3">
                90d
              </Text>
            </Button>
          </XStack>
        </XStack>

        {/* Chart */}
        <YStack gap="$3">

          <Svg width={width} height={height} pointerEvents="box-none">
            {/* Y-axis grid lines */}
            {[0, 0.5, 1].map((ratio) => {
              const y = padding.top + chartHeight * (1 - ratio)
              return (
                <G key={ratio}>
                  <Line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={gridColor}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <SvgText
                    x={padding.left - 8}
                    y={y + 4}
                    fontSize="10"
                    fill={textColor}
                    textAnchor="end"
                  >
                    {Math.round(maxValue * ratio)}
                  </SvgText>
                </G>
              )
            })}

            {/* Line chart */}
            {points.length > 1 && (
              <Polyline
                points={linePoints}
                fill="none"
                stroke={lineColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {points.map((point: { x: number; y: number; count: number; date: string }, i: number) => (
              <Circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={point.count > 0 ? 4 : 2}
                fill={point.count > 0 ? lineColor : gridColor}
                stroke="white"
                strokeWidth={point.count > 0 ? 2 : 0}
              />
            ))}

            {/* X-axis labels (show first, middle, last dates) */}
            {[0, Math.floor(data.length / 2), data.length - 1].map((i) => {
              const point = points[i]
              if (!point) return null
              const date = new Date(point.date)
              const label = `${date.getMonth() + 1}/${date.getDate()}`
              return (
                <SvgText
                  key={i}
                  x={point.x}
                  y={height - 10}
                  fontSize="10"
                  fill={textColor}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              )
            })}
          </Svg>

          {/* Stats */}
          <XStack gap="$3" mt="$2">
            <YStack flex={1} bg="$orange2" p="$3" br="$4">
              <Text
                fontSize="$1"
                color="$gray11"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing={0.5}
              >
                Total
              </Text>
              <Text fontSize={32} fontWeight="700" color="$gray12" mt="$1">
                {data.reduce((sum: number, d: { count: number }) => sum + d.count, 0)}
              </Text>
              <Text fontSize="$2" color="$gray11" fontWeight="600">
                completions
              </Text>
            </YStack>
            <YStack flex={1} bg="$orange2" p="$3" br="$4">
              <Text
                fontSize="$1"
                color="$gray11"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing={0.5}
              >
                Daily Avg
              </Text>
              <Text fontSize={32} fontWeight="700" color="$gray12" mt="$1">
                {(data.reduce((sum: number, d: { count: number }) => sum + d.count, 0) / data.length).toFixed(1)}
              </Text>
              <Text fontSize="$2" color="$gray11" fontWeight="600">
                per day
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </YStack>
    </Card>
  )
}

export default observer(ActivityChart)
