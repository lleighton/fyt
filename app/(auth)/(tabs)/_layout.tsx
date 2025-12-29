import { useState, useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { Home, Zap, Users, User, Award } from '@tamagui/lucide-icons'
import { useTheme, YStack, Spinner, Text } from 'tamagui'

import { supabase } from '@/lib/supabase'
import { auth$ } from '@/lib/legend-state/store'

/**
 * Tab navigation layout
 *
 * Main app navigation with 5 tabs:
 * - Home (feed/dashboard)
 * - Tags (tag history)
 * - Groups (my groups, group invites)
 * - Leaderboard (rankings/competition)
 * - Profile (user settings)
 *
 * Also checks if user needs onboarding (missing username/first_name)
 */
export default function TabLayout() {
  const theme = useTheme()
  const router = useRouter()
  const session = auth$.session.get()

  const [checkingProfile, setCheckingProfile] = useState(true)

  // Check if user needs onboarding
  useEffect(() => {
    const checkProfile = async () => {
      if (!session?.user?.id) {
        setCheckingProfile(false)
        return
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, first_name')
          .eq('id', session.user.id)
          .single()

        // Redirect to onboarding if profile is incomplete
        if (!profile?.username || !profile?.first_name) {
          router.replace('/(auth)/onboarding/profile-setup')
          return
        }
      } catch (err) {
        console.error('Error checking profile:', err)
      } finally {
        setCheckingProfile(false)
      }
    }

    checkProfile()
  }, [session?.user?.id])

  // Show loading while checking profile
  if (checkingProfile) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" bg="$background">
        <Spinner size="large" color="$color" />
        <Text mt="$4" color="$color">Loading...</Text>
      </YStack>
    )
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.blue10.get(),
        tabBarInactiveTintColor: theme.gray10.get(),
        tabBarStyle: {
          backgroundColor: theme.background.get(),
          borderTopColor: theme.borderColor.get(),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: 'Tags',
          tabBarIcon: ({ color, size }) => <Zap color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => <Award color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
