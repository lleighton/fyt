/**
 * Supabase Database Types
 *
 * This file is auto-generated. Do not edit manually.
 * Run `npm run supabase:types` to regenerate.
 *
 * For now, this contains placeholder types until you:
 * 1. Create your Supabase project
 * 2. Apply the migration from supabase/migrations/001_initial_schema.sql
 * 3. Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Helper types for challenge steps
 * Used for AMRAP rounds, For Time rounds, and Workout exercises
 */
export interface ChallengeStep {
  exercise: string
  type: 'reps' | 'time' | 'distance' | 'strength'
  target_value?: number
  target_unit?: string
  target_sets?: number
  target_reps?: number
  target_weight?: number
  weight_unit?: 'lbs' | 'kg'
}

export interface SetData {
  reps: number
  weight?: number
  weight_unit?: 'lbs' | 'kg'
}

export interface CompletionStepData {
  step_index: number
  exercise: string
  value: number
  unit: string
  sets?: SetData[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          phone_number: string
          username: string | null
          first_name: string | null
          last_name: string | null
          display_name: string | null
          avatar_url: string | null
          streak_count: number
          longest_streak: number
          total_completions: number
          // Tag-related fields
          tag_streak_public: number
          tag_streak_longest: number
          total_tags_sent: number
          total_tags_completed: number
          first_tag_completed_at: string | null
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: {
          id: string
          phone_number: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          streak_count?: number
          longest_streak?: number
          total_completions?: number
          tag_streak_public?: number
          tag_streak_longest?: number
          total_tags_sent?: number
          total_tags_completed?: number
          first_tag_completed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
        Update: {
          id?: string
          phone_number?: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          streak_count?: number
          longest_streak?: number
          total_completions?: number
          tag_streak_public?: number
          tag_streak_longest?: number
          total_tags_sent?: number
          total_tags_completed?: number
          first_tag_completed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
      }
      challenges: {
        Row: {
          id: string
          creator_id: string
          group_id: string | null
          title: string
          description: string | null
          challenge_type: 'amrap' | 'max_effort' | 'for_time' | 'workout'
          exercise: string
          config: Json
          is_public: boolean
          starts_at: string
          ends_at: string | null
          frequency: 'one_time' | 'daily' | 'weekly' | 'monthly'
          duration_days: number | null
          steps: ChallengeStep[] | null
          participant_count: number
          completion_count: number
          // Tag-related fields
          is_tag: boolean
          tag_id: string | null
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: {
          id?: string
          creator_id: string
          group_id?: string | null
          title: string
          description?: string | null
          challenge_type: 'amrap' | 'max_effort' | 'for_time' | 'workout'
          exercise: string
          config?: Json
          is_public?: boolean
          starts_at?: string
          ends_at?: string | null
          frequency?: 'one_time' | 'daily' | 'weekly' | 'monthly'
          duration_days?: number | null
          steps?: ChallengeStep[] | null
          participant_count?: number
          completion_count?: number
          is_tag?: boolean
          tag_id?: string | null
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
        Update: {
          id?: string
          creator_id?: string
          group_id?: string | null
          title?: string
          description?: string | null
          challenge_type?: 'amrap' | 'max_effort' | 'for_time' | 'workout'
          exercise?: string
          config?: Json
          is_public?: boolean
          starts_at?: string
          ends_at?: string | null
          frequency?: 'one_time' | 'daily' | 'weekly' | 'monthly'
          duration_days?: number | null
          steps?: ChallengeStep[] | null
          participant_count?: number
          completion_count?: number
          is_tag?: boolean
          tag_id?: string | null
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
      }
      challenge_participants: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          invited_by: string | null
          invited_phone: string | null
          status: 'pending' | 'accepted' | 'declined'
          joined_at: string | null
          best_value: number | null
          completed_by_user: boolean
          user_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          invited_by?: string | null
          invited_phone?: string | null
          status?: 'pending' | 'accepted' | 'declined'
          joined_at?: string | null
          best_value?: number | null
          completed_by_user?: boolean
          user_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          invited_by?: string | null
          invited_phone?: string | null
          status?: 'pending' | 'accepted' | 'declined'
          joined_at?: string | null
          best_value?: number | null
          completed_by_user?: boolean
          user_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      completions: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          value: number
          unit: 'reps' | 'seconds' | 'meters'
          weight: number | null
          weight_unit: 'lbs' | 'kg'
          step_data: CompletionStepData[] | null
          proof_url: string | null
          proof_type: 'photo' | 'video' | null
          verified: boolean
          verified_by: string | null
          notes: string | null
          location_lat: number | null
          location_lng: number | null
          completed_at: string
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          value: number
          unit?: 'reps' | 'seconds' | 'meters'
          weight?: number | null
          weight_unit?: 'lbs' | 'kg'
          step_data?: CompletionStepData[] | null
          proof_url?: string | null
          proof_type?: 'photo' | 'video' | null
          verified?: boolean
          verified_by?: string | null
          notes?: string | null
          location_lat?: number | null
          location_lng?: number | null
          completed_at?: string
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          value?: number
          unit?: 'reps' | 'seconds' | 'meters'
          weight?: number | null
          weight_unit?: 'lbs' | 'kg'
          step_data?: CompletionStepData[] | null
          proof_url?: string | null
          proof_type?: 'photo' | 'video' | null
          verified?: boolean
          verified_by?: string | null
          notes?: string | null
          location_lat?: number | null
          location_lng?: number | null
          completed_at?: string
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_url: string | null
          is_private: boolean
          invite_code: string
          creator_id: string | null
          member_count: number
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          avatar_url?: string | null
          is_private?: boolean
          invite_code?: string
          creator_id?: string | null
          member_count?: number
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          is_private?: boolean
          invite_code?: string
          creator_id?: string | null
          member_count?: number
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // TAG SYSTEM TABLES
      // ============================================
      exercises: {
        Row: {
          id: string
          name: string
          category: 'upper_body' | 'core' | 'lower_body' | 'full_body'
          type: 'reps' | 'time'
          unit: 'count' | 'seconds'
          description: string | null
          instructions: string | null
          icon: string | null
          difficulty: number
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'upper_body' | 'core' | 'lower_body' | 'full_body'
          type: 'reps' | 'time'
          unit: 'count' | 'seconds'
          description?: string | null
          instructions?: string | null
          icon?: string | null
          difficulty?: number
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'upper_body' | 'core' | 'lower_body' | 'full_body'
          type?: 'reps' | 'time'
          unit?: 'count' | 'seconds'
          description?: string | null
          instructions?: string | null
          icon?: string | null
          difficulty?: number
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          challenge_id: string | null
          sender_id: string
          exercise_id: string
          value: number
          proof_url: string | null
          proof_type: 'photo' | 'video' | null
          is_public: boolean
          group_id: string | null
          expires_at: string
          parent_tag_id: string | null
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: {
          id?: string
          challenge_id?: string | null
          sender_id: string
          exercise_id: string
          value: number
          proof_url?: string | null
          proof_type?: 'photo' | 'video' | null
          is_public?: boolean
          group_id?: string | null
          expires_at: string
          parent_tag_id?: string | null
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
        Update: {
          id?: string
          challenge_id?: string | null
          sender_id?: string
          exercise_id?: string
          value?: number
          proof_url?: string | null
          proof_type?: 'photo' | 'video' | null
          is_public?: boolean
          group_id?: string | null
          expires_at?: string
          parent_tag_id?: string | null
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
      }
      tag_recipients: {
        Row: {
          id: string
          tag_id: string
          recipient_id: string | null
          recipient_phone: string | null
          status: 'pending' | 'completed' | 'expired' | 'declined'
          completed_value: number | null
          completed_at: string | null
          proof_url: string | null
          proof_type: 'photo' | 'video' | null
          response_tag_id: string | null
          notified_at: string | null
          reminder_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tag_id: string
          recipient_id?: string | null
          recipient_phone?: string | null
          status?: 'pending' | 'completed' | 'expired' | 'declined'
          completed_value?: number | null
          completed_at?: string | null
          proof_url?: string | null
          proof_type?: 'photo' | 'video' | null
          response_tag_id?: string | null
          notified_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tag_id?: string
          recipient_id?: string | null
          recipient_phone?: string | null
          status?: 'pending' | 'completed' | 'expired' | 'declined'
          completed_value?: number | null
          completed_at?: string | null
          proof_url?: string | null
          proof_type?: 'photo' | 'video' | null
          response_tag_id?: string | null
          notified_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          streak_type: 'pair' | 'public' | 'group'
          partner_id: string | null
          group_id: string | null
          current_count: number
          longest_count: number
          last_activity_at: string | null
          streak_started_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          streak_type: 'pair' | 'public' | 'group'
          partner_id?: string | null
          group_id?: string | null
          current_count?: number
          longest_count?: number
          last_activity_at?: string | null
          streak_started_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          streak_type?: 'pair' | 'public' | 'group'
          partner_id?: string | null
          group_id?: string | null
          current_count?: number
          longest_count?: number
          last_activity_at?: string | null
          streak_started_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          user_id: string
          display_name: string | null
          avatar_url: string | null
          streak_count: number
          challenge_count: number
          total_completions: number
          total_value: number
          rank: number
        }
      }
    }
    Functions: {
      refresh_leaderboard: {
        Args: Record<string, never>
        Returns: void
      }
      // Tag system functions
      get_pending_tags: {
        Args: { p_user_id: string }
        Returns: {
          tag_id: string
          sender_id: string
          sender_name: string | null
          sender_avatar: string | null
          exercise_id: string
          exercise_name: string
          exercise_icon: string | null
          exercise_type: string
          exercise_unit: string
          sender_value: number
          expires_at: string
          time_remaining: string
          is_public: boolean
          group_id: string | null
          group_name: string | null
          recipient_id: string
          recipient_status: string
        }[]
      }
      get_pair_streak: {
        Args: { p_user_id: string; p_partner_id: string }
        Returns: {
          current_count: number
          longest_count: number
          last_activity_at: string | null
        }[]
      }
      update_tag_streak: {
        Args: {
          p_user_id: string
          p_streak_type: string
          p_partner_id?: string | null
          p_group_id?: string | null
        }
        Returns: void
      }
      break_tag_streak: {
        Args: {
          p_user_id: string
          p_streak_type: string
          p_partner_id?: string | null
          p_group_id?: string | null
        }
        Returns: void
      }
      expire_pending_tags: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
