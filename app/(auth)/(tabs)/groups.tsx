import { observer } from '@legendapp/state/react'
import { useRouter } from 'expo-router'
import {
  YStack,
  XStack,
  Text,
  H1,
  Button,
  Card,
  ScrollView,
  Avatar,
} from 'tamagui'
import {
  Users,
  Plus,
  Key,
  Crown,
  Lock,
  Globe,
  ChevronRight,
} from '@tamagui/lucide-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { store$, auth$ } from '@/lib/legend-state/store'

/**
 * Groups tab screen
 *
 * Shows all groups the user is a member of
 * Allows creating or joining new groups
 */
function GroupsScreen() {
  const router = useRouter()
  const session = auth$.session.get()
  const allGroups = store$.groups.get()

  // Filter to groups where user is a member
  const myGroups = allGroups
    ? Object.values(allGroups).filter((group: any) =>
        group.members?.some((m: any) => m.user_id === session?.user?.id)
      )
    : []

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <XStack px="$4" py="$3" justifyContent="space-between" alignItems="center">
          <H1 fontSize="$8">My Groups</H1>
          <XStack gap="$2">
            <Button
              size="$3"
              circular
              bg="$blue10"
              icon={<Plus size={20} color="white" />}
              onPress={() => router.push('/(auth)/group/create')}
            />
          </XStack>
        </XStack>

        <ScrollView flex={1}>
          <YStack p="$4" gap="$4">
            {/* Empty State */}
            {myGroups.length === 0 && (
              <YStack gap="$4" mt="$8">
                <YStack alignItems="center" gap="$3">
                  <YStack
                    width={100}
                    height={100}
                    bg="$gray3"
                    br="$12"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Users size={48} color="$gray10" />
                  </YStack>
                  <YStack alignItems="center" gap="$2">
                    <Text fontSize="$6" fontWeight="600" textAlign="center">
                      No Groups Yet
                    </Text>
                    <Text
                      color="$gray11"
                      textAlign="center"
                      maxWidth={300}
                      fontSize="$3"
                    >
                      Create a group to compete with friends or join an existing one
                      with an invite code
                    </Text>
                  </YStack>
                </YStack>

                <YStack gap="$3" mt="$4">
                  <Button
                    size="$5"
                    bg="$blue10"
                    icon={<Plus size={20} />}
                    onPress={() => router.push('/(auth)/group/create')}
                  >
                    Create New Group
                  </Button>
                  <Button
                    size="$5"
                    variant="outlined"
                    icon={<Key size={20} />}
                    onPress={() => router.push('/(auth)/group/join')}
                  >
                    Join with Code
                  </Button>
                </YStack>
              </YStack>
            )}

            {/* Groups List */}
            {myGroups.length > 0 && (
              <>
                {/* Quick Actions */}
                <XStack gap="$2">
                  <Button
                    flex={1}
                    size="$4"
                    bg="$blue10"
                    icon={<Plus size={18} />}
                    onPress={() => router.push('/(auth)/group/create')}
                  >
                    Create
                  </Button>
                  <Button
                    flex={1}
                    size="$4"
                    variant="outlined"
                    icon={<Key size={18} />}
                    onPress={() => router.push('/(auth)/group/join')}
                  >
                    Join
                  </Button>
                </XStack>

                {/* Groups */}
                <YStack gap="$3">
                  {myGroups.map((group: any) => {
                    const isAdmin = group.members?.some(
                      (m: any) => m.user_id === session?.user?.id && m.role === 'admin'
                    )

                    return (
                      <Card
                        key={group.id}
                        bg="$gray2"
                        p="$5"
                        br="$6"
                        borderWidth={0}
                        shadowColor="$shadowColor"
                        shadowOffset={{ width: 0, height: 2 }}
                        shadowOpacity={0.1}
                        shadowRadius={8}
                        elevation={2}
                        pressStyle={{ scale: 0.98 }}
                        animation="quick"
                        onPress={() => router.push(`/(auth)/group/${group.id}`)}
                      >
                        <XStack gap="$4" alignItems="center">
                          {/* Avatar */}
                          <Avatar circular size="$6" bg="$blue10">
                            {group.avatar_url ? (
                              <Avatar.Image src={group.avatar_url} />
                            ) : (
                              <Avatar.Fallback justifyContent="center" alignItems="center">
                                <Users size={28} color="white" />
                              </Avatar.Fallback>
                            )}
                          </Avatar>

                          {/* Info */}
                          <YStack flex={1} gap="$2">
                            <XStack gap="$2" alignItems="center">
                              <Text fontSize="$5" fontWeight="700">
                                {group.name}
                              </Text>
                              {isAdmin && <Crown size={16} color="$yellow10" />}
                            </XStack>

                            {group.description && (
                              <Text color="$gray11" fontSize="$3" numberOfLines={1}>
                                {group.description}
                              </Text>
                            )}

                            <XStack gap="$4" mt="$1">
                              <XStack gap="$1" alignItems="center">
                                <Users size={14} color="$gray11" />
                                <Text color="$gray11" fontSize="$2">
                                  {group.member_count || 0} members
                                </Text>
                              </XStack>
                              <XStack gap="$1" alignItems="center">
                                {group.is_private ? (
                                  <Lock size={14} color="$gray11" />
                                ) : (
                                  <Globe size={14} color="$gray11" />
                                )}
                                <Text color="$gray11" fontSize="$2">
                                  {group.is_private ? 'Private' : 'Public'}
                                </Text>
                              </XStack>
                            </XStack>
                          </YStack>

                          {/* Chevron */}
                          <ChevronRight size={20} color="$gray10" />
                        </XStack>
                      </Card>
                    )
                  })}
                </YStack>
              </>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  )
}

export default observer(GroupsScreen)
