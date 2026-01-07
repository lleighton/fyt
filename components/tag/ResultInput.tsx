import { useState } from 'react'
import { Alert, ActivityIndicator } from 'react-native'
import { YStack, XStack, Text, Input, Card, Button } from 'tamagui'
import { Camera, Clock, Hash, X } from '@tamagui/lucide-icons'
import * as ImagePicker from 'expo-image-picker'

import type { Database } from '@/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface ResultInputProps {
  exercise: Exercise
  value: number | null
  onValueChange: (value: number | null) => void
  proofUri: string | null
  proofType: 'photo' | 'video' | null
  onProofChange: (uri: string | null, type: 'photo' | 'video' | null) => void
}

/**
 * Result input component for logging exercise completion
 * Supports both rep-based and time-based exercises
 */
export function ResultInput({
  exercise,
  value,
  onValueChange,
  proofUri,
  proofType,
  onProofChange,
}: ResultInputProps) {
  const [capturing, setCapturing] = useState(false)
  const isTimeBased = exercise.type === 'time'

  // Handle value input change
  const handleValueChange = (text: string) => {
    const parsed = parseInt(text, 10)
    if (text === '') {
      onValueChange(null)
    } else if (!isNaN(parsed) && parsed >= 0) {
      onValueChange(parsed)
    }
  }

  // Handle proof capture
  const handleCaptureProof = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to add proof of your workout.'
        )
        return
      }

      setCapturing(true)

      // Show options
      Alert.alert('Add Proof', 'How would you like to add proof?', [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              quality: 0.8,
              aspect: [1, 1],
            })

            if (!result.canceled && result.assets[0]) {
              onProofChange(result.assets[0].uri, 'photo')
            }
            setCapturing(false)
          },
        },
        {
          text: 'Record Video',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: 'videos',
              allowsEditing: true,
              quality: 0.7,
              videoMaxDuration: 15, // 15 seconds max
            })

            if (!result.canceled && result.assets[0]) {
              onProofChange(result.assets[0].uri, 'video')
            }
            setCapturing(false)
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              quality: 0.8,
              aspect: [1, 1],
            })

            if (!result.canceled && result.assets[0]) {
              onProofChange(result.assets[0].uri, 'photo')
            }
            setCapturing(false)
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setCapturing(false),
        },
      ])
    } catch (error) {
      console.error('Error capturing proof:', error)
      Alert.alert('Error', 'Failed to capture proof. Please try again.')
      setCapturing(false)
    }
  }

  // Remove proof
  const handleRemoveProof = () => {
    onProofChange(null, null)
  }

  // Format time display (for time-based exercises)
  const formatTimeDisplay = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }

  return (
    <YStack flex={1} gap="$4">
      {/* Exercise Summary */}
      <Card bg="$gray2" p="$4" br="$4">
        <XStack gap="$3" alignItems="center">
          <YStack
            width={56}
            height={56}
            br="$4"
            bg="$orange4"
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize={28}>{exercise.icon || '💪'}</Text>
          </YStack>
          <YStack flex={1}>
            <Text fontWeight="700" fontSize="$5">
              {exercise.name}
            </Text>
            <XStack gap="$2" alignItems="center">
              {isTimeBased ? (
                <Clock size={14} color="$gray10" />
              ) : (
                <Hash size={14} color="$gray10" />
              )}
              <Text color="$gray10" fontSize="$3">
                {isTimeBased ? 'Time-based' : 'Rep-based'}
              </Text>
            </XStack>
          </YStack>
        </XStack>
      </Card>

      {/* Value Input */}
      <YStack gap="$2">
        <Text fontWeight="600" fontSize="$4">
          {isTimeBased ? 'How long did you hold?' : 'How many did you do?'}
        </Text>
        <XStack gap="$3" alignItems="center">
          <Input
            flex={1}
            size="$6"
            keyboardType="number-pad"
            value={value?.toString() || ''}
            onChangeText={handleValueChange}
            placeholder={isTimeBased ? '60' : '50'}
            textAlign="center"
            fontSize={32}
            fontWeight="700"
          />
          <YStack
            bg="$gray3"
            px="$4"
            py="$3"
            br="$4"
            justifyContent="center"
            alignItems="center"
          >
            <Text color="$gray11" fontSize="$4" fontWeight="600">
              {isTimeBased ? 'seconds' : 'reps'}
            </Text>
          </YStack>
        </XStack>

        {/* Time display helper for time-based */}
        {isTimeBased && value && value > 0 && (
          <Text color="$gray10" textAlign="center" fontSize="$3">
            = {formatTimeDisplay(value)}
          </Text>
        )}
      </YStack>

      {/* Quick Value Pills */}
      <XStack flexWrap="wrap" gap="$2">
        {(isTimeBased
          ? [30, 45, 60, 90, 120, 180]
          : [10, 20, 25, 30, 40, 50]
        ).map((quickValue) => (
          <YStack
            key={quickValue}
            px="$3"
            py="$2"
            br="$10"
            bg={value === quickValue ? '$orange10' : '$gray3'}
            pressStyle={{ scale: 0.95, opacity: 0.8 }}
            animation="quick"
            onPress={() => onValueChange(quickValue)}
            cursor="pointer"
          >
            <Text
              color={value === quickValue ? 'white' : '$gray11'}
              fontSize="$3"
              fontWeight="600"
            >
              {isTimeBased ? formatTimeDisplay(quickValue) : quickValue}
            </Text>
          </YStack>
        ))}
      </XStack>

      {/* Proof Section */}
      <YStack gap="$2" mt="$2">
        <Text fontWeight="600" fontSize="$4">
          Add Proof (Optional)
        </Text>
        <Text color="$gray10" fontSize="$3">
          Add a photo or video to verify your workout
        </Text>

        {/* WCAG AA: $green12 provides 5.07:1 contrast on $green2 */}
        {proofUri ? (
          <Card bg="$green2" p="$3" br="$4" borderWidth={1} borderColor="$green7">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <Camera size={20} color="$green12" />
                <Text color="$green12" fontWeight="600">
                  {proofType === 'video' ? 'Video added' : 'Photo added'}
                </Text>
              </XStack>
              <Button
                size="$2"
                circular
                bg="$red10"
                icon={<X size={14} color="white" />}
                onPress={handleRemoveProof}
              />
            </XStack>
          </Card>
        ) : (
          <Button
            size="$5"
            bg="$gray3"
            icon={
              capturing ? (
                <ActivityIndicator size="small" />
              ) : (
                <Camera size={24} color="$gray11" />
              )
            }
            onPress={handleCaptureProof}
            disabled={capturing}
          >
            <Text color="$gray11" fontWeight="600">
              {capturing ? 'Opening Camera...' : 'Add Photo or Video'}
            </Text>
          </Button>
        )}
      </YStack>
    </YStack>
  )
}
