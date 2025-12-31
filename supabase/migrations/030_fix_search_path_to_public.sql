-- ============================================
-- FIX: Change search_path from '' to 'public'
-- ============================================
-- The previous migration set search_path = '' which breaks functions
-- that reference tables without schema qualification.
--
-- Setting search_path = 'public' is still secure (prevents search path
-- injection attacks) while allowing functions to find tables in public schema.

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

-- Group management functions
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
