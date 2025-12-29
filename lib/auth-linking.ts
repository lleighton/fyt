import { useEffect } from 'react'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { supabase } from './supabase'

/**
 * Hook to handle deep link authentication callbacks and app navigation
 *
 * This catches:
 * - Magic link callbacks from email authentication
 * - Group invite links (fyt://group/join?code=ABC123)
 *
 * Usage: Call this hook in your root layout
 */
export function useAuthLinking() {
  const router = useRouter()

  useEffect(() => {
    // Handle the initial URL if app was opened via link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url, router)
      }
    })

    // Listen for incoming links while app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url, router)
    })

    return () => {
      subscription.remove()
    }
  }, [])
}

/**
 * Process all deep link URLs
 */
async function handleDeepLink(url: string, router: any) {
  try {
    // Parse the URL
    const parsed = Linking.parse(url)
    console.log('[Deep Link] Received:', url)
    console.log('[Deep Link] Parsed:', parsed)

    // Handle group invite links: fyt://group/join?code=ABC123
    if (parsed.path === 'group/join' && parsed.queryParams?.code) {
      const code = parsed.queryParams.code as string
      console.log('[Deep Link] Group invite with code:', code)

      // Navigate to join screen with code parameter
      setTimeout(() => {
        router.push({
          pathname: '/(auth)/group/join',
          params: { code: code.toUpperCase() },
        })
      }, 100)
      return
    }

    // Check if this is a Supabase auth callback
    if (url.includes('#access_token') || url.includes('?access_token')) {
      // Extract the fragment/query from the URL
      const urlObj = new URL(url)
      const params = new URLSearchParams(
        urlObj.hash.substring(1) || urlObj.search.substring(1)
      )

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (accessToken && type) {
        // Set the session using the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) {
          console.error('Error setting session from magic link:', error)
        } else if (data.user) {
          console.log('Successfully authenticated via magic link')

          // Create profile if needed (same logic as login.tsx)
          const profileData: any = {
            id: data.user.id,
            display_name: null,
            email: data.user.email || null,
            phone_number: data.user.phone || null,
            updated_at: new Date().toISOString(),
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData)

          if (profileError) {
            console.error('Error creating profile from magic link:', profileError)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error handling auth callback:', error)
  }
}
