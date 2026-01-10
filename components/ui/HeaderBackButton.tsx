import { View } from 'tamagui'
import { ArrowLeft, X } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'

interface HeaderBackButtonProps {
  variant?: 'back' | 'close'
  onPress?: () => void
}

export function HeaderBackButton({
  variant = 'back',
  onPress,
}: HeaderBackButtonProps) {
  const router = useRouter()

  const handlePress = onPress || (() => router.back())
  const Icon = variant === 'close' ? X : ArrowLeft
  const label = variant === 'close' ? 'Close' : 'Go back'

  return (
    <View
      p="$2"
      br="$3"
      bg="$gray3"
      pressStyle={{ bg: '$gray4' }}
      onPress={handlePress}
      accessible={true}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Icon size={24} color="$gray12" />
    </View>
  )
}
