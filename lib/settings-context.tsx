import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useColorScheme as useSystemColorScheme } from 'react-native'
import { MMKV } from 'react-native-mmkv'
import * as Haptics from 'expo-haptics'

const SETTINGS_KEY = 'app_settings'

// Initialize MMKV storage for settings
let storage: MMKV | null = null
try {
  storage = new MMKV({ id: 'settings' })
} catch (error) {
  console.warn('[Settings] MMKV not available, settings will not persist')
}

/**
 * App settings structure
 */
export interface AppSettings {
  notifications: {
    enabled: boolean
    tagReceived: boolean
    groupInvites: boolean
    challengeReminders: boolean
    streakAlerts: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    units: 'metric' | 'imperial'
    defaultTagDuration: 12 | 24 | 48
    hapticFeedback: boolean
  }
}

/**
 * Default settings
 */
const defaultSettings: AppSettings = {
  notifications: {
    enabled: true,
    tagReceived: true,
    groupInvites: true,
    challengeReminders: true,
    streakAlerts: true,
  },
  preferences: {
    theme: 'system',
    units: 'metric',
    defaultTagDuration: 24,
    hapticFeedback: true,
  },
}

/**
 * Load settings from storage
 */
function loadSettings(): AppSettings {
  if (!storage) return defaultSettings

  try {
    const stored = storage.getString(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        notifications: { ...defaultSettings.notifications, ...parsed.notifications },
        preferences: { ...defaultSettings.preferences, ...parsed.preferences },
      }
    }
  } catch (error) {
    console.error('[Settings] Error loading:', error)
  }

  return defaultSettings
}

/**
 * Save settings to storage
 */
function saveSettings(settings: AppSettings): void {
  if (!storage) return

  try {
    storage.set(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('[Settings] Error saving:', error)
  }
}

/**
 * Settings context type
 */
interface SettingsContextType {
  settings: AppSettings
  setNotification: (key: keyof AppSettings['notifications'], value: boolean) => void
  setPreference: <K extends keyof AppSettings['preferences']>(
    key: K,
    value: AppSettings['preferences'][K]
  ) => void
  resetSettings: () => void
  // Computed values
  effectiveTheme: 'light' | 'dark'
  // Haptic helpers
  haptic: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void
  // Notification helpers
  shouldShowNotification: (type: 'tag' | 'group' | 'challenge' | 'streak') => boolean
}

const SettingsContext = createContext<SettingsContextType | null>(null)

/**
 * Settings Provider - wrap your app with this
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings)
  const systemColorScheme = useSystemColorScheme()

  // Compute effective theme based on preference
  const effectiveTheme = useMemo((): 'light' | 'dark' => {
    if (settings.preferences.theme === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light'
    }
    return settings.preferences.theme
  }, [settings.preferences.theme, systemColorScheme])

  // Update notification setting
  const setNotification = useCallback((key: keyof AppSettings['notifications'], value: boolean) => {
    setSettingsState((prev) => {
      const updated = {
        ...prev,
        notifications: { ...prev.notifications, [key]: value },
      }
      saveSettings(updated)
      return updated
    })
  }, [])

  // Update preference setting
  const setPreference = useCallback(<K extends keyof AppSettings['preferences']>(
    key: K,
    value: AppSettings['preferences'][K]
  ) => {
    setSettingsState((prev) => {
      const updated = {
        ...prev,
        preferences: { ...prev.preferences, [key]: value },
      }
      saveSettings(updated)
      return updated
    })
  }, [])

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettingsState(defaultSettings)
    saveSettings(defaultSettings)
  }, [])

  // Haptic feedback helper
  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!settings.preferences.hapticFeedback) return

    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          break
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          break
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          break
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          break
      }
    } catch (error) {
      // Haptics may not be available (e.g., simulator)
      console.warn('[Settings] Haptics not available:', error)
    }
  }, [settings.preferences.hapticFeedback])

  // Check if a notification type should be shown
  const shouldShowNotification = useCallback((type: 'tag' | 'group' | 'challenge' | 'streak'): boolean => {
    if (!settings.notifications.enabled) return false

    switch (type) {
      case 'tag':
        return settings.notifications.tagReceived
      case 'group':
        return settings.notifications.groupInvites
      case 'challenge':
        return settings.notifications.challengeReminders
      case 'streak':
        return settings.notifications.streakAlerts
      default:
        return true
    }
  }, [settings.notifications])

  const value = useMemo(() => ({
    settings,
    setNotification,
    setPreference,
    resetSettings,
    effectiveTheme,
    haptic,
    shouldShowNotification,
  }), [settings, setNotification, setPreference, resetSettings, effectiveTheme, haptic, shouldShowNotification])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * Hook to access settings
 */
export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

/**
 * Hook for just the effective theme (for components that only need theme)
 */
export function useEffectiveTheme(): 'light' | 'dark' {
  const context = useContext(SettingsContext)
  if (!context) {
    // Fallback if not in provider (e.g., in _layout before provider)
    return 'light'
  }
  return context.effectiveTheme
}

/**
 * Get settings synchronously (for notification handler which can't use hooks)
 */
export function getSettingsSync(): AppSettings {
  return loadSettings()
}
