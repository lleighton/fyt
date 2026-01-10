import { useState, useEffect } from 'react'
import { Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { observer } from '@legendapp/state/react'
import { YStack, XStack, Text, Button, Card, ScrollView } from 'tamagui'
import { Plus, Target, Trophy } from '@tamagui/lucide-icons'
import { SafeArea, ScreenHeader } from '@/components/ui'
import { GoalCard, GoalCreator } from '@/components/group'

import { supabase } from '@/lib/supabase'
import { store$, auth$ } from '@/lib/legend-state/store'

interface Goal {
  id: string
  title: string
  description?: string | null
  exercise_id?: string | null
  category?: string | null
  target_value: number
  target_unit: string
  starts_at: string
  ends_at: string
  current_value: number
  status: 'active' | 'completed' | 'cancelled'
  include_variants: boolean
  exercise?: {
    id: string
    name: string
    icon: string | null
  } | null
}

/**
 * Goals Management Screen
 *
 * Allows group admins to:
 * - View all goals (active, completed, cancelled)
 * - Create new goals
 * - Cancel existing goals
 */
function GoalsScreen() {
  const router = useRouter()
  const { id: groupId } = useLocalSearchParams<{ id: string }>()
  const session = auth$.session.get()
  const groups = store$.groups.get()
  const group = groups && groupId ? (groups as any)[groupId] : null

  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreator, setShowCreator] = useState(false)
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active')

  // Check if user is admin
  const members = group?.members || []
  const isAdmin = members.some(
    (m: any) => m.user_id === session?.user?.id && m.role === 'admin'
  )

  // Fetch goals
  useEffect(() => {
    const fetchGoals = async () => {
      if (!groupId) return

      try {
        let query = (supabase
          .from('group_goals') as any)
          .select(`
            *,
            exercise:exercises (
              id,
              name,
              icon
            )
          `)
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })

        if (filter === 'active') {
          query = query.eq('status', 'active')
        } else if (filter === 'completed') {
          query = query.eq('status', 'completed')
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching goals:', error)
        } else {
          setGoals(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [groupId, filter, showCreator])

  // Handle cancel goal
  const handleCancelGoal = async (goalId: string, goalTitle: string) => {
    Alert.alert(
      'Cancel Goal',
      `Are you sure you want to cancel "${goalTitle}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await (supabase.rpc as any)('cancel_group_goal', {
                p_goal_id: goalId,
              })

              if (error) throw error

              // Refresh list
              setGoals((prev) =>
                prev.map((g) =>
                  g.id === goalId ? { ...g, status: 'cancelled' as const } : g
                )
              )

              Alert.alert('Cancelled', 'Goal has been cancelled')
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel goal')
            }
          },
        },
      ]
    )
  }

  if (showCreator) {
    return (
      <SafeArea edges={['top', 'bottom']}>
        <YStack flex={1} bg="$background">
          <ScreenHeader
            variant="close"
            title="CREATE GOAL"
            onBack={() => setShowCreator(false)}
          />

          <YStack flex={1} px="$4">
            <GoalCreator
              groupId={groupId!}
              onSuccess={() => {
                setShowCreator(false)
                setFilter('active')
              }}
              onCancel={() => setShowCreator(false)}
            />
          </YStack>
        </YStack>
      </SafeArea>
    )
  }

  return (
    <SafeArea edges={['top']}>
      <YStack flex={1} bg="$background">
        <ScreenHeader
          title="GOALS"
          rightContent={
            isAdmin ? (
              <Button
                size="$4"
                bg="$orange10"
                icon={<Plus size={20} color="white" />}
                onPress={() => setShowCreator(true)}
              >
                <Text color="white" fontWeight="600">New</Text>
              </Button>
            ) : undefined
          }
        />

        {/* Filter Tabs */}
        <XStack px="$4" gap="$2" mb="$4">
          <Button
            flex={1}
            size="$3"
            bg={filter === 'active' ? '$orange10' : '$gray3'}
            onPress={() => setFilter('active')}
          >
            <Text
              color={filter === 'active' ? 'white' : '$gray11'}
              fontWeight="600"
            >
              Active
            </Text>
          </Button>
          <Button
            flex={1}
            size="$3"
            bg={filter === 'completed' ? '$orange10' : '$gray3'}
            onPress={() => setFilter('completed')}
          >
            <Text
              color={filter === 'completed' ? 'white' : '$gray11'}
              fontWeight="600"
            >
              Completed
            </Text>
          </Button>
          <Button
            flex={1}
            size="$3"
            bg={filter === 'all' ? '$orange10' : '$gray3'}
            onPress={() => setFilter('all')}
          >
            <Text
              color={filter === 'all' ? 'white' : '$gray11'}
              fontWeight="600"
            >
              All
            </Text>
          </Button>
        </XStack>

        {/* Goals List */}
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack px="$4" gap="$3" pb="$4">
            {loading ? (
              <YStack alignItems="center" py="$6">
                <ActivityIndicator size="large" />
                <Text mt="$3" color="$gray10">Loading goals...</Text>
              </YStack>
            ) : goals.length === 0 ? (
              <Card bg="$backgroundHover" p="$6" br="$4" alignItems="center">
                {filter === 'active' ? (
                  <>
                    <Target size={48} color="$gray10" />
                    <Text color="$gray10" textAlign="center" mt="$3" fontWeight="600">
                      No active goals
                    </Text>
                    {isAdmin && (
                      <>
                        <Text color="$gray10" textAlign="center" mt="$2" fontSize="$3">
                          Create a goal to rally your group!
                        </Text>
                        <Button
                          mt="$4"
                          size="$4"
                          bg="$orange10"
                          icon={<Plus size={20} color="white" />}
                          onPress={() => setShowCreator(true)}
                        >
                          <Text color="white" fontWeight="600">Create Goal</Text>
                        </Button>
                      </>
                    )}
                  </>
                ) : filter === 'completed' ? (
                  <>
                    <Trophy size={48} color="$gray10" />
                    <Text color="$gray10" textAlign="center" mt="$3" fontWeight="600">
                      No completed goals yet
                    </Text>
                    <Text color="$gray10" textAlign="center" mt="$2" fontSize="$3">
                      Complete an active goal to see it here!
                    </Text>
                  </>
                ) : (
                  <>
                    <Target size={48} color="$gray10" />
                    <Text color="$gray10" textAlign="center" mt="$3" fontWeight="600">
                      No goals yet
                    </Text>
                  </>
                )}
              </Card>
            ) : (
              goals.map((goal) => (
                <YStack key={goal.id} gap="$2">
                  <GoalCard
                    goal={goal}
                    onPress={() =>
                      router.push(`/(auth)/group/${groupId}/goal/${goal.id}` as any)
                    }
                  />
                  {/* Cancel button for admins on active goals */}
                  {isAdmin && goal.status === 'active' && (
                    <Button
                      size="$3"
                      bg="$red3"
                      alignSelf="flex-end"
                      onPress={() => handleCancelGoal(goal.id, goal.title)}
                    >
                      <Text color="$red10" fontWeight="600" fontSize="$2">
                        Cancel Goal
                      </Text>
                    </Button>
                  )}
                </YStack>
              ))
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </SafeArea>
  )
}

export default observer(GoalsScreen)
