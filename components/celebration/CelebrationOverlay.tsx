import { useRef, useEffect, useCallback, useMemo } from 'react'
import { StyleSheet, Dimensions } from 'react-native'
import { View } from 'tamagui'
import LottieView from 'lottie-react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Pre-load animations
const ANIMATIONS = {
  completion: require('@/assets/animations/confetti.json'),
  exceeded: require('@/assets/animations/confetti.json'),
  pr: require('@/assets/animations/confetti-pr.json'),
}

export type CelebrationType = 'completion' | 'exceeded' | 'pr'

interface CelebrationOverlayProps {
  type: CelebrationType
  visible: boolean
  onComplete?: () => void
}

/**
 * Full-screen celebration overlay with Lottie animations
 *
 * Types:
 * - completion: Standard confetti for finishing a tag
 * - exceeded: Enhanced confetti for beating the target
 * - pr: Special celebration with stars for personal records
 */
export function CelebrationOverlay({ type, visible, onComplete }: CelebrationOverlayProps) {
  const animationRef = useRef<LottieView>(null)

  useEffect(() => {
    if (visible) {
      animationRef.current?.play()
    } else {
      animationRef.current?.reset()
    }
  }, [visible])

  const handleAnimationFinish = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  // Get animation config based on type
  const animationConfig = useMemo(() => {
    switch (type) {
      case 'pr':
        return { source: ANIMATIONS.pr, speed: 0.85 }
      case 'exceeded':
        return { source: ANIMATIONS.exceeded, speed: 1 }
      case 'completion':
      default:
        return { source: ANIMATIONS.completion, speed: 1.1 }
    }
  }, [type])

  if (!visible) return null

  return (
    <View
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={1000}
      pointerEvents="none"
      justifyContent="center"
      alignItems="center"
    >
      <LottieView
        ref={animationRef}
        source={animationConfig.source}
        style={styles.animation}
        autoPlay={false}
        loop={false}
        speed={animationConfig.speed}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="cover"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  animation: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
})
