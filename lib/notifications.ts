import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import { supabase } from './supabase'
import { getSettingsSync } from './settings-context'

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const settings = getSettingsSync()

    // Check if notifications are globally enabled
    if (!settings.notifications.enabled) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      } as Notifications.NotificationBehavior
    }

    // Check notification type from data
    const data = notification.request.content.data
    const type = data?.type as string | undefined

    // Filter by notification type preference
    let shouldShow = true
    if (type === 'tag_received' || type === 'tag_reminder') {
      shouldShow = settings.notifications.tagReceived
    } else if (type === 'group_invite' || type === 'group_update') {
      shouldShow = settings.notifications.groupInvites
    } else if (type === 'challenge_reminder') {
      shouldShow = settings.notifications.challengeReminders
    } else if (type === 'streak_alert') {
      shouldShow = settings.notifications.streakAlerts
    }

    return {
      shouldShowAlert: shouldShow,
      shouldPlaySound: shouldShow,
      shouldSetBadge: shouldShow,
    } as Notifications.NotificationBehavior
  },
})

/**
 * Register for push notifications and save token to profile
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  // Must be a physical device (push notifications don't work in simulator)
  if (!Device.isDevice) {
    console.log('[Notifications] Skipping push registration - not a physical device')
    return null
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted')
    return null
  }

  // Get Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    })
    const token = tokenData.data
    console.log('[Notifications] Push token:', token)

    // Save token to profile
    const { error } = await (supabase
      .from('profiles') as any)
      .update({ push_token: token })
      .eq('id', userId)

    if (error) {
      console.error('[Notifications] Error saving push token:', error)
    } else {
      console.log('[Notifications] Push token saved to profile')
    }

    return token
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error)
    return null
  }
}

/**
 * Set up notification listeners
 * Call this once when app starts
 */
export function setupNotificationListeners() {
  // Handle notification received while app is foregrounded
  const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Notifications] Received:', notification)
  })

  // Handle user tapping on notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[Notifications] Response:', response)

    const data = response.notification.request.content.data

    // Navigate based on notification type
    if (data?.type === 'tag_received' && data?.tagId) {
      router.push(`/(auth)/tag/${data.tagId}` as any)
    } else if (data?.type === 'group_invite') {
      // Navigate to groups tab where invitations are shown
      router.push('/(auth)/(tabs)/groups' as any)
    } else if (data?.tagId) {
      // Fallback for older tag notifications
      router.push(`/(auth)/tag/${data.tagId}` as any)
    } else if (data?.screen) {
      router.push(data.screen as any)
    }
  })

  // Return cleanup function
  return () => {
    notificationSubscription.remove()
    responseSubscription.remove()
  }
}

/**
 * Send a push notification via Expo's push service
 * This is for testing - in production, use the Edge Function
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const message = {
    to: expoPushToken,
    sound: 'default' as const,
    title,
    body,
    data,
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()
    console.log('[Notifications] Send result:', result)
    return result
  } catch (error) {
    console.error('[Notifications] Error sending:', error)
    throw error
  }
}

/**
 * Android-specific notification channel setup
 */
export async function setupAndroidNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })

    await Notifications.setNotificationChannelAsync('tags', {
      name: 'Tag Notifications',
      description: 'Notifications when someone tags you in a challenge',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    })

    await Notifications.setNotificationChannelAsync('groups', {
      name: 'Group Notifications',
      description: 'Notifications for group invitations and updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    })
  }
}
