import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'

import { supabase } from '@/lib/supabase'

export interface ImageUploadOptions {
  /** Storage bucket name (default: 'tagfit') */
  bucket?: string
  /** Storage path prefix (e.g., 'avatars', 'groups') */
  pathPrefix: string
  /** Unique identifier for the file name (e.g., user ID, group ID) */
  identifier: string
  /** Image aspect ratio (default: [1, 1]) */
  aspect?: [number, number]
  /** Image quality 0-1 (default: 0.5) */
  quality?: number
  /** Allow editing (default: true) */
  allowsEditing?: boolean
}

export interface ImageUploadResult {
  /** Public URL of the uploaded image */
  publicUrl: string
  /** Storage path of the uploaded file */
  storagePath: string
}

interface UseImageUploadReturn {
  /** Whether an upload is in progress */
  uploading: boolean
  /** Pick and upload an image from the library */
  pickAndUpload: (options: ImageUploadOptions) => Promise<ImageUploadResult | null>
  /** Take a photo and upload it */
  takeAndUpload: (options: ImageUploadOptions) => Promise<ImageUploadResult | null>
  /** Upload an existing image URI */
  uploadFromUri: (uri: string, options: ImageUploadOptions) => Promise<ImageUploadResult | null>
}

/**
 * Hook for handling image upload to Supabase Storage
 *
 * Provides a unified interface for:
 * - Picking images from library
 * - Taking photos with camera
 * - Uploading to Supabase Storage
 * - Getting public URLs
 *
 * @example
 * ```tsx
 * const { uploading, pickAndUpload } = useImageUpload()
 *
 * const handleAvatarChange = async () => {
 *   const result = await pickAndUpload({
 *     pathPrefix: 'avatars',
 *     identifier: userId,
 *   })
 *   if (result) {
 *     await updateProfile({ avatar_url: result.publicUrl })
 *   }
 * }
 * ```
 */
export function useImageUpload(): UseImageUploadReturn {
  const [uploading, setUploading] = useState(false)

  /**
   * Request media library permission
   */
  const requestLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to select an image'
      )
      return false
    }
    return true
  }

  /**
   * Request camera permission
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera access to take a photo'
      )
      return false
    }
    return true
  }

  /**
   * Upload a local image URI to Supabase Storage
   */
  const uploadToStorage = async (
    uri: string,
    options: ImageUploadOptions
  ): Promise<ImageUploadResult | null> => {
    const {
      bucket = 'tagfit',
      pathPrefix,
      identifier,
    } = options

    try {
      // Extract file extension
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${identifier}-${Date.now()}.${fileExt}`
      const filePath = `${pathPrefix}/${fileName}`

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      })

      // Decode to ArrayBuffer for Supabase
      const arrayBuffer = decode(base64)

      // Determine content type
      const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return {
        publicUrl: urlData.publicUrl,
        storagePath: filePath,
      }
    } catch (error: any) {
      console.error('[useImageUpload] Upload error:', error)
      Alert.alert('Upload Error', error.message || 'Failed to upload image')
      return null
    }
  }

  /**
   * Pick an image from the library and upload it
   */
  const pickAndUpload = useCallback(
    async (options: ImageUploadOptions): Promise<ImageUploadResult | null> => {
      const { aspect = [1, 1], quality = 0.5, allowsEditing = true } = options

      // Request permission
      const hasPermission = await requestLibraryPermission()
      if (!hasPermission) return null

      try {
        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing,
          aspect,
          quality,
        })

        if (result.canceled || !result.assets?.[0]) {
          return null
        }

        setUploading(true)
        const uploadResult = await uploadToStorage(result.assets[0].uri, options)
        return uploadResult
      } catch (error: any) {
        console.error('[useImageUpload] Pick error:', error)
        Alert.alert('Error', error.message || 'Failed to pick image')
        return null
      } finally {
        setUploading(false)
      }
    },
    []
  )

  /**
   * Take a photo with the camera and upload it
   */
  const takeAndUpload = useCallback(
    async (options: ImageUploadOptions): Promise<ImageUploadResult | null> => {
      const { aspect = [1, 1], quality = 0.5, allowsEditing = true } = options

      // Request permission
      const hasPermission = await requestCameraPermission()
      if (!hasPermission) return null

      try {
        // Launch camera
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing,
          aspect,
          quality,
        })

        if (result.canceled || !result.assets?.[0]) {
          return null
        }

        setUploading(true)
        const uploadResult = await uploadToStorage(result.assets[0].uri, options)
        return uploadResult
      } catch (error: any) {
        console.error('[useImageUpload] Camera error:', error)
        Alert.alert('Error', error.message || 'Failed to capture image')
        return null
      } finally {
        setUploading(false)
      }
    },
    []
  )

  /**
   * Upload an image from an existing URI
   */
  const uploadFromUri = useCallback(
    async (uri: string, options: ImageUploadOptions): Promise<ImageUploadResult | null> => {
      setUploading(true)
      try {
        const uploadResult = await uploadToStorage(uri, options)
        return uploadResult
      } finally {
        setUploading(false)
      }
    },
    []
  )

  return {
    uploading,
    pickAndUpload,
    takeAndUpload,
    uploadFromUri,
  }
}
