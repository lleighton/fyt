import { useState, useEffect, useCallback } from 'react'
import { ActivityIndicator } from 'react-native'
import {
  YStack,
  XStack,
  Text,
  Input,
  Card,
  Avatar,
  ScrollView,
} from 'tamagui'
import { Search, AtSign, User, Check } from '@tamagui/lucide-icons'
import { observer } from '@legendapp/state/react'

import { supabase } from '@/lib/supabase'
import { auth$ } from '@/lib/legend-state/store'

interface SearchResult {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
  match_type: string
}

interface UserSearchProps {
  onSelectUser: (user: SearchResult) => void
  selectedUserIds?: string[]
  placeholder?: string
  excludeCurrentUser?: boolean
}

/**
 * User search component
 * Search for users by username or name
 */
function UserSearchComponent({
  onSelectUser,
  selectedUserIds = [],
  placeholder = 'Search by username or name',
  excludeCurrentUser = true,
}: UserSearchProps) {
  const session = auth$.session.get()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Search users with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      setHasSearched(false)
      return
    }

    const searchUsers = async () => {
      setLoading(true)
      setHasSearched(true)

      try {
        const { data, error } = await (supabase.rpc as any)('search_users', {
          p_query: query,
          p_limit: 20,
          p_exclude_user_id: excludeCurrentUser ? session?.user?.id : null,
        })

        if (error) throw error
        setResults(data || [])
      } catch (err) {
        console.error('Error searching users:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [query, session?.user?.id, excludeCurrentUser])

  const getDisplayName = (user: SearchResult) => {
    if (user.first_name) {
      return `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    }
    return user.display_name || user.username
  }

  return (
    <YStack gap="$3">
      {/* Search Input */}
      <XStack
        bg="$gray2"
        br="$4"
        px="$3"
        alignItems="center"
        borderWidth={1}
        borderColor="$gray4"
      >
        <Search size={18} color="$gray10" />
        <Input
          flex={1}
          size="$4"
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          borderWidth={0}
          bg="transparent"
        />
        {loading && <ActivityIndicator size="small" />}
      </XStack>

      {/* Results */}
      {hasSearched && (
        <YStack gap="$2">
          {results.length === 0 && !loading ? (
            <Card bg="$gray2" p="$4" br="$4">
              <YStack alignItems="center" gap="$2">
                <User size={32} color="$gray10" />
                <Text color="$gray10" textAlign="center">
                  No users found for "{query}"
                </Text>
              </YStack>
            </Card>
          ) : (
            results.map((user) => {
              const isSelected = selectedUserIds.includes(user.id)
              return (
                <Card
                  key={user.id}
                  bg={isSelected ? '$orange2' : '$gray2'}
                  p="$3"
                  br="$4"
                  borderWidth={isSelected ? 2 : 0}
                  borderColor={isSelected ? '$orange10' : 'transparent'}
                  pressStyle={{ scale: 0.98, bg: isSelected ? '$orange3' : '$gray3' }}
                  animation="quick"
                  onPress={() => onSelectUser(user)}
                >
                  <XStack gap="$3" alignItems="center">
                    <Avatar circular size="$4">
                      {user.avatar_url ? (
                        <Avatar.Image src={user.avatar_url} />
                      ) : (
                        <Avatar.Fallback bg="$orange10" justifyContent="center" alignItems="center">
                          <Text color="white" fontWeight="700">
                            {(user.first_name || user.username || 'U')[0]?.toUpperCase() || 'U'}
                          </Text>
                        </Avatar.Fallback>
                      )}
                    </Avatar>

                    <YStack flex={1}>
                      <Text fontWeight="600" fontSize="$4">
                        {getDisplayName(user)}
                      </Text>
                      <XStack gap="$1" alignItems="center">
                        <AtSign size={12} color="$gray10" />
                        <Text color="$gray10" fontSize="$2">
                          {user.username}
                        </Text>
                      </XStack>
                    </YStack>

                    {isSelected && (
                      <YStack
                        width={24}
                        height={24}
                        br="$10"
                        bg="$orange10"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Check size={14} color="white" />
                      </YStack>
                    )}
                  </XStack>
                </Card>
              )
            })
          )}
        </YStack>
      )}
    </YStack>
  )
}

export const UserSearch = observer(UserSearchComponent)
