-- ============================================
-- SECURITY FIXES MIGRATION
-- ============================================
-- Fixes:
-- 1. Function search_path mutable warnings (48 functions)
-- 2. Security definer view warning (group_member_stats)
--
-- Reference: https://supabase.com/docs/guides/database/database-linter

-- ============================================
-- FIX 1: SET search_path ON ALL FUNCTIONS
-- ============================================
-- Setting search_path = 'public' prevents search path injection attacks
-- where an attacker could create malicious objects in a schema
-- that appears earlier in the search path.
--
-- NOTE: We use 'public' instead of '' because our functions use
-- unqualified table names. Using '' would break table lookups.

-- Tag system functions
ALTER FUNCTION public.is_tag_recipient SET search_path = 'public';
ALTER FUNCTION public.complete_tag_response SET search_path = 'public';
ALTER FUNCTION public.get_tag_recipient_push_tokens SET search_path = 'public';
ALTER FUNCTION public.record_tag_send_completion SET search_path = 'public';
ALTER FUNCTION public.get_tag_leaderboard SET search_path = 'public';
ALTER FUNCTION public.is_tag_sender SET search_path = 'public';
ALTER FUNCTION public.is_tag_public SET search_path = 'public';
ALTER FUNCTION public.get_pending_tags SET search_path = 'public';
ALTER FUNCTION public.expire_pending_tags SET search_path = 'public';
ALTER FUNCTION public.update_profile_tags_sent SET search_path = 'public';
ALTER FUNCTION public.update_profile_tags_completed SET search_path = 'public';

-- Streak functions
ALTER FUNCTION public.get_pair_streak SET search_path = 'public';
ALTER FUNCTION public.break_tag_streak SET search_path = 'public';
ALTER FUNCTION public.update_tag_streak SET search_path = 'public';

-- Group functions
ALTER FUNCTION public.get_group_aggregate_stats SET search_path = 'public';
ALTER FUNCTION public.get_group_leaderboard SET search_path = 'public';
ALTER FUNCTION public.is_group_member SET search_path = 'public';
ALTER FUNCTION public.is_group_admin SET search_path = 'public';
ALTER FUNCTION public.update_group_member_count SET search_path = 'public';

-- Group invite functions
ALTER FUNCTION public.accept_group_invite SET search_path = 'public';
ALTER FUNCTION public.decline_group_invite SET search_path = 'public';
ALTER FUNCTION public.get_pending_group_invites SET search_path = 'public';
ALTER FUNCTION public.get_group_invite_push_token SET search_path = 'public';

-- Group management functions (from migration 028)
ALTER FUNCTION public.leave_group SET search_path = 'public';
ALTER FUNCTION public.delete_group SET search_path = 'public';
ALTER FUNCTION public.remove_group_member SET search_path = 'public';
ALTER FUNCTION public.change_member_role SET search_path = 'public';
ALTER FUNCTION public.regenerate_invite_code SET search_path = 'public';
ALTER FUNCTION public.get_group_pending_invites SET search_path = 'public';
ALTER FUNCTION public.cancel_group_invite SET search_path = 'public';
ALTER FUNCTION public.update_group_info SET search_path = 'public';

-- User/profile functions
ALTER FUNCTION public.generate_username_suggestion SET search_path = 'public';
ALTER FUNCTION public.handle_new_user SET search_path = 'public';
ALTER FUNCTION public.compute_display_name SET search_path = 'public';
ALTER FUNCTION public.search_users SET search_path = 'public';
ALTER FUNCTION public.is_username_available SET search_path = 'public';
ALTER FUNCTION public.is_valid_username SET search_path = 'public';
ALTER FUNCTION public.update_profile_stats SET search_path = 'public';

-- Challenge functions
ALTER FUNCTION public.is_challenge_participant SET search_path = 'public';
ALTER FUNCTION public.is_public_challenge SET search_path = 'public';
ALTER FUNCTION public.is_challenge_creator SET search_path = 'public';
ALTER FUNCTION public.update_participant_best SET search_path = 'public';
ALTER FUNCTION public.update_challenge_participant_count SET search_path = 'public';
ALTER FUNCTION public.auto_complete_one_time_challenge SET search_path = 'public';
ALTER FUNCTION public.validate_multi_step_completion SET search_path = 'public';

-- Utility functions
ALTER FUNCTION public.handle_updated_at SET search_path = 'public';
ALTER FUNCTION public.immutable_date SET search_path = 'public';


-- ============================================
-- FIX 2: REMOVE SECURITY DEFINER FROM VIEW
-- ============================================
-- Views with SECURITY DEFINER run with the permissions of the view creator,
-- bypassing RLS policies. This is a security risk.
--
-- We need to recreate the view without SECURITY DEFINER (use SECURITY INVOKER)

DROP VIEW IF EXISTS public.group_member_stats;

CREATE VIEW public.group_member_stats
WITH (security_invoker = true)
AS
SELECT
  gm.group_id,
  gm.user_id,
  gm.role,
  p.display_name,
  p.avatar_url,

  -- Total completions across all challenges
  COUNT(DISTINCT c.id) FILTER (WHERE c.deleted = false) AS total_completions,

  -- Total completions for group challenges only
  COUNT(DISTINCT c.id) FILTER (
    WHERE c.deleted = false
    AND ch.group_id = gm.group_id
  ) AS group_challenge_completions,

  -- Total points (sum of all completion values)
  COALESCE(SUM(c.value) FILTER (WHERE c.deleted = false), 0) AS total_points,

  -- Total points for group challenges only
  COALESCE(
    SUM(c.value) FILTER (
      WHERE c.deleted = false
      AND ch.group_id = gm.group_id
    ),
    0
  ) AS group_challenge_points,

  -- Average performance (average completion value)
  COALESCE(
    AVG(c.value) FILTER (WHERE c.deleted = false),
    0
  ) AS avg_performance,

  -- Number of challenges participated in
  COUNT(DISTINCT cp.challenge_id) AS challenges_participated,

  -- Number of group challenges participated in
  COUNT(DISTINCT cp.challenge_id) FILTER (
    WHERE ch.group_id = gm.group_id
  ) AS group_challenges_participated,

  -- Latest completion date
  MAX(c.completed_at) AS last_completion_at,

  -- Member since
  gm.created_at AS member_since

FROM group_members gm
  LEFT JOIN profiles p ON p.id = gm.user_id
  LEFT JOIN challenge_participants cp ON cp.user_id = gm.user_id
  LEFT JOIN challenges ch ON ch.id = cp.challenge_id
  LEFT JOIN completions c ON c.user_id = gm.user_id AND c.challenge_id = ch.id

GROUP BY
  gm.group_id,
  gm.user_id,
  gm.role,
  p.display_name,
  p.avatar_url,
  gm.created_at;

-- Re-grant permissions on the view
GRANT SELECT ON public.group_member_stats TO authenticated;

-- Add comment
COMMENT ON VIEW public.group_member_stats IS
  'Aggregated statistics for all group members across all their challenges (SECURITY INVOKER)';


-- ============================================
-- NOTE: Leaked Password Protection
-- ============================================
-- The "auth_leaked_password_protection" warning must be fixed
-- in the Supabase Dashboard, not via migration:
--
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Under "Password Options", enable "Leaked password protection"
-- 3. This checks passwords against HaveIBeenPwned.org
--
-- Reference: https://supabase.com/docs/guides/auth/password-security
