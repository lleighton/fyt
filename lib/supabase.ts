import 'react-native-url-polyfill/auto'
import * as ExpoCrypto from 'expo-crypto'
import { createClient } from '@supabase/supabase-js'

// Polyfill WebCrypto for Supabase PKCE flow
if (typeof globalThis.crypto === 'undefined') {
  ;(globalThis as any).crypto = {
    getRandomValues: (array: Uint8Array) => ExpoCrypto.getRandomValues(array),
    randomUUID: () => ExpoCrypto.randomUUID(),
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer) => {
        const hashAlgorithm = algorithm === 'SHA-256' ? ExpoCrypto.CryptoDigestAlgorithm.SHA256 : ExpoCrypto.CryptoDigestAlgorithm.SHA256
        const hash = await ExpoCrypto.digestStringAsync(
          hashAlgorithm,
          new TextDecoder().decode(data),
          { encoding: ExpoCrypto.CryptoEncoding.BASE64 }
        )
        // Convert base64 to ArrayBuffer
        const binary = atob(hash)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        return bytes.buffer
      },
    },
  }
}
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env file.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable URL detection for email confirmations
    flowType: 'pkce', // Use PKCE flow for mobile apps
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// Helper to get current session
export async function getCurrentSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
