import { useState, useEffect, useCallback } from 'react'
import { MMKV } from 'react-native-mmkv'

const SETTINGS_KEY = 'app_settings'

// Initialize MMKV storage for settings
let storage: MMKV | null = null
try {
  storage = new MMKV({ id: 'settings' })
} catch (error) {
  console.warn('[useSettings] MMKV not available, settings will not persist')
}

/**
 * App settings structure
 */
export interface AppSettings {
  // Notifications
  notifications: {
    enabled: boolean
    tagReceived: boolean
    groupInvites: boolean
    challengeReminders: boolean
    streakAlerts: boolean
  }
  // Preferences
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
      // Merge with defaults to handle new settings
      return {
        notifications: { ...defaultSettings.notifications, ...parsed.notifications },
        preferences: { ...defaultSettings.preferences, ...parsed.preferences },
      }
    }
  } catch (error) {
    console.error('[useSettings] Error loading settings:', error)
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
    console.error('[useSettings] Error saving settings:', error)
  }
}

/**
 * Hook for managing app settings
 * Persists to MMKV for fast, synchronous access
 */
export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings)

  // Update a single notification setting
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

  // Update a single preference setting
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

  return {
    settings,
    setNotification,
    setPreference,
    resetSettings,
  }
}
