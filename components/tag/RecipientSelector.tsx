import { useMemo, useState, useEffect } from 'react'
import { Share } from 'react-native'
import { YStack, XStack, Text, Card, Button, Switch, Avatar, ScrollView, Input } from 'tamagui'
import { Users, UserPlus, Share2, Check, Globe, Lock, Search, AtSign, X } from '@tamagui/lucide-icons'
import { observer } from '@legendapp/state/react'
import { ActivityIndicator } from 'react-native'

import { store$, auth$ } from '@/lib/legend-state/store'
import { supabase } from '@/lib/supabase'

interface SelectedUser {
  id: string
  username?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
}

interface RecipientSelectorProps {
  selectedFriends: string[] // user IDs
  selectedGroups: string[] // group IDs
  isPublic: boolean
  onToggleFriend: (userId: string) => void
  onToggleGroup: (groupId: string) => void
  onTogglePublic: (isPublic: boolean) => void
}

/**
 * Recipient selector for tagging friends and groups
 */
function RecipientSelectorComponent({
  selectedFriends,
  selectedGroups,
  isPublic,
  onToggleFriend,
  onToggleGroup,
  onTogglePublic,
}: RecipientSelectorProps) {
  const session = auth$.session.get()
  const groupsData = store$.groups.get()
  const streaksData = store$.streaks.get()

  // User search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Track selected users data for display
  const [selectedUsersData, setSelectedUsersData] = useState<Map<string, SelectedUser>>(new Map())

  // Debounced search
  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query || query.length < 2) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setSearching(true)
    setHasSearched(true)

    try {
      const { data, error } = await (supabase.rpc as any)('search_users', {
        p_query: query,
        p_limit: 10,
        p_exclude_user_id: session?.user?.id || null,
      })

      if (error) throw error
      setSearchResults(data || [])
    } catch (err) {
      console.error('Error searching users:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Get user's groups
  const myGroups = useMemo(() => {
    if (!groupsData || !session?.user?.id) return []

    return Object.values(groupsData).filter((group: any) => {
      return group?.members?.some((m: any) => m.user_id === session.user.id)
    })
  }, [groupsData, session])

  // Get known users from groups (people you can tag)
  const knownUsers = useMemo(() => {
    if (!session?.user?.id) return []

    const users = new Map<string, any>()

    myGroups.forEach((group: any) => {
      group?.members?.forEach((member: any) => {
        if (member.user_id !== session.user.id && member.profile) {
          // Check if we have a streak with this user
          const pairStreak = streaksData
            ? Object.values(streaksData).find(
                (s: any) =>
                  s?.streak_type === 'pair' && s?.partner_id === member.user_id
              )
            : null

          users.set(member.user_id, {
            ...member.profile,
            streak: (pairStreak as any)?.current_count || 0,
          })
        }
      })
    })

    // Sort by streak (highest first), then by name
    return Array.from(users.values()).sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak
      return (a.display_name || '').localeCompare(b.display_name || '')
    })
  }, [myGroups, streaksData, session])

  // Handle selecting a user - track their data for display
  const handleSelectUser = (user: any) => {
    const userId = user.id
    const isSelected = selectedFriends.includes(userId)

    if (isSelected) {
      // Remove from selected users data
      setSelectedUsersData((prev) => {
        const next = new Map(prev)
        next.delete(userId)
        return next
      })
    } else {
      // Add to selected users data
      setSelectedUsersData((prev) => {
        const next = new Map(prev)
        next.set(userId, {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          display_name: user.display_name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username),
          avatar_url: user.avatar_url,
        })
        return next
      })
    }

    onToggleFriend(userId)
  }

  // Sync selectedUsersData when selectedFriends changes externally
  useEffect(() => {
    // Remove any users from data that are no longer in selectedFriends
    setSelectedUsersData((prev) => {
      const next = new Map(prev)
      for (const userId of prev.keys()) {
        if (!selectedFriends.includes(userId)) {
          next.delete(userId)
        }
      }
      return next
    })
  }, [selectedFriends])

  // Handle invite new friend
  const handleInviteFriend = async () => {
    try {
      await Share.share({
        message: `Join me on fyt! Let's challenge each other to stay fit. Download the app: https://fyt.it.com`,
        title: 'Join fyt',
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  // Get display name for a selected user
  const getDisplayName = (user: SelectedUser) => {
    if (user.first_name) {
      return `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    }
    return user.display_name || user.username || 'User'
  }

  const totalSelected = selectedFriends.length + selectedGroups.length

  return (
    <YStack flex={1} gap="$4">
      {/* Public/Private Toggle */}
      <Card bg="$gray2" p="$4" br="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$3" alignItems="center" flex={1}>
            {isPublic ? (
              <Globe size={24} color="$orange10" />
            ) : (
              <Lock size={24} color="$gray10" />
            )}
            <YStack flex={1}>
              <Text fontWeight="600" fontSize="$4">
                {isPublic ? 'Public Tag' : 'Private Tag'}
              </Text>
              <Text color="$gray10" fontSize="$2">
                {isPublic
                  ? 'Anyone can see this tag'
                  : 'Only tagged people can see'}
              </Text>
            </YStack>
          </XStack>
          <Switch
            size="$4"
            checked={isPublic}
            onCheckedChange={onTogglePublic}
            backgroundColor={isPublic ? '$orange6' : '$gray5'}
          >
            <Switch.Thumb animation="quick" backgroundColor="white" />
          </Switch>
        </XStack>
      </Card>

      {/* Selected Users Chips */}
      {selectedUsersData.size > 0 && (
        <YStack gap="$2">
          <Text fontWeight="700" fontSize="$4">
            Tagged ({selectedUsersData.size})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2" pr="$4">
              {Array.from(selectedUsersData.values()).map((user) => (
                <Card
                  key={user.id}
                  bg="$orange2"
                  px="$3"
                  py="$2"
                  br="$10"
                  borderWidth={1}
                  borderColor="$orange7"
                  pressStyle={{ scale: 0.95 }}
                  animation="quick"
                  onPress={() => handleSelectUser(user)}
                >
                  <XStack gap="$2" alignItems="center">
                    <Avatar circular size="$2">
                      {user.avatar_url ? (
                        <Avatar.Image src={user.avatar_url} />
                      ) : (
                        <Avatar.Fallback bg="$orange10" justifyContent="center" alignItems="center">
                          <Text color="white" fontSize="$1" fontWeight="700">
                            {(user.first_name || user.username || 'U')[0]?.toUpperCase() || 'U'}
                          </Text>
                        </Avatar.Fallback>
                      )}
                    </Avatar>
                    <Text fontSize="$3" fontWeight="500">
                      {getDisplayName(user)}
                    </Text>
                    <X size={14} color="$orange10" />
                  </XStack>
                </Card>
              ))}
            </XStack>
          </ScrollView>
        </YStack>
      )}

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack gap="$4" pb="$4">
          {/* Search Users Section */}
          <YStack gap="$2">
            <Text fontWeight="700" fontSize="$4">
              Find Users
            </Text>
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
                placeholder="Search by @username or name"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
                borderWidth={0}
                bg="transparent"
              />
              {searching && <ActivityIndicator size="small" />}
            </XStack>

            {/* Search Results */}
            {hasSearched && (
              <YStack gap="$2">
                {searchResults.length === 0 && !searching ? (
                  <Text color="$gray10" fontSize="$3" textAlign="center" py="$2">
                    No users found for "{searchQuery}"
                  </Text>
                ) : (
                  searchResults.map((user) => (
                    <SelectableUserCard
                      key={user.id}
                      user={{
                        ...user,
                        display_name: user.first_name
                          ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
                          : user.display_name || user.username,
                      }}
                      selected={selectedFriends.includes(user.id)}
                      onToggle={() => handleSelectUser(user)}
                      showUsername={user.username}
                    />
                  ))
                )}
              </YStack>
            )}
          </YStack>

          {/* Friends from Groups Section */}
          {knownUsers.length > 0 && (
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="700" fontSize="$4">
                  From Your Groups
                </Text>
                {selectedFriends.length > 0 && (
                  <Text color="$orange10" fontSize="$3" fontWeight="600">
                    {selectedFriends.length} selected
                  </Text>
                )}
              </XStack>

              <YStack gap="$2">
                {knownUsers.map((user) => (
                  <SelectableUserCard
                    key={user.id}
                    user={user}
                    selected={selectedFriends.includes(user.id)}
                    onToggle={() => handleSelectUser(user)}
                    streak={user.streak}
                  />
                ))}
              </YStack>
            </YStack>
          )}

          {/* Groups Section */}
          {myGroups.length > 0 && (
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="700" fontSize="$4">
                  Groups
                </Text>
                {selectedGroups.length > 0 && (
                  <Text color="$purple10" fontSize="$3" fontWeight="600">
                    {selectedGroups.length} selected
                  </Text>
                )}
              </XStack>

              {myGroups.map((group: any) => (
                <SelectableGroupCard
                  key={group.id}
                  group={group}
                  selected={selectedGroups.includes(group.id)}
                  onToggle={() => onToggleGroup(group.id)}
                />
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {/* Selection Summary */}
      {totalSelected > 0 && (
        <Card bg="$orange2" p="$3" br="$4" borderWidth={1} borderColor="$orange7">
          <Text color="$orange11" fontWeight="600" textAlign="center">
            Tagging {totalSelected} {totalSelected === 1 ? 'recipient' : 'recipients'}
          </Text>
        </Card>
      )}
    </YStack>
  )
}

/**
 * Selectable user card
 */
function SelectableUserCard({
  user,
  selected,
  onToggle,
  streak,
  showUsername,
}: {
  user: any
  selected: boolean
  onToggle: () => void
  streak?: number
  showUsername?: string
}) {
  return (
    <Card
      bg={selected ? '$orange2' : '$gray2'}
      p="$3"
      br="$4"
      borderWidth={selected ? 2 : 0}
      borderColor={selected ? '$orange10' : 'transparent'}
      pressStyle={{ scale: 0.98 }}
      animation="quick"
      onPress={onToggle}
    >
      <XStack gap="$3" alignItems="center">
        <Avatar circular size="$4">
          {user.avatar_url ? (
            <Avatar.Image src={user.avatar_url} />
          ) : (
            <Avatar.Fallback bg="$orange10" justifyContent="center" alignItems="center">
              <Text color="white" fontWeight="700">
                {(user.first_name || user.display_name || 'U')[0]?.toUpperCase() || 'U'}
              </Text>
            </Avatar.Fallback>
          )}
        </Avatar>

        <YStack flex={1}>
          <Text fontWeight="600" fontSize="$4">
            {user.display_name || 'Unknown User'}
          </Text>
          {showUsername ? (
            <XStack gap="$1" alignItems="center">
              <AtSign size={12} color="$gray10" />
              <Text color="$gray10" fontSize="$2">
                {showUsername}
              </Text>
            </XStack>
          ) : streak && streak > 0 ? (
            <XStack gap="$1" alignItems="center">
              <Text fontSize={12}>🔥</Text>
              <Text color="$orange10" fontSize="$2" fontWeight="600">
                {streak} day streak
              </Text>
            </XStack>
          ) : null}
        </YStack>

        {selected && (
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
}

/**
 * Selectable group card
 */
function SelectableGroupCard({
  group,
  selected,
  onToggle,
}: {
  group: any
  selected: boolean
  onToggle: () => void
}) {
  const memberCount = group.members?.length || group.member_count || 0

  return (
    <Card
      bg={selected ? '$purple2' : '$gray2'}
      p="$3"
      br="$4"
      borderWidth={selected ? 2 : 0}
      borderColor={selected ? '$purple10' : 'transparent'}
      pressStyle={{ scale: 0.98 }}
      animation="quick"
      onPress={onToggle}
    >
      <XStack gap="$3" alignItems="center">
        <YStack
          width={44}
          height={44}
          br="$4"
          bg={selected ? '$purple4' : '$gray4'}
          justifyContent="center"
          alignItems="center"
        >
          <Users size={22} color={selected ? '$purple10' : '$gray10'} />
        </YStack>

        <YStack flex={1}>
          <Text fontWeight="600" fontSize="$4">
            {group.name}
          </Text>
          <Text color="$gray10" fontSize="$2">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Text>
        </YStack>

        {selected && (
          <YStack
            width={24}
            height={24}
            br="$10"
            bg="$purple10"
            justifyContent="center"
            alignItems="center"
          >
            <Check size={14} color="white" />
          </YStack>
        )}
      </XStack>
    </Card>
  )
}

export const RecipientSelector = observer(RecipientSelectorComponent)
