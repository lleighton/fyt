-- Migration: Add RLS Policies for Goals
-- Secure access to group_goals and goal_contributions tables

-- ============================================
-- GROUP GOALS RLS
-- ============================================
ALTER TABLE group_goals ENABLE ROW LEVEL SECURITY;

-- Group members can view goals
DO $$ BEGIN
  CREATE POLICY "Group members can view goals"
    ON group_goals FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_goals.group_id
          AND gm.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Group admins can create goals
DO $$ BEGIN
  CREATE POLICY "Group admins can create goals"
    ON group_goals FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_goals.group_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Group admins can update goals
DO $$ BEGIN
  CREATE POLICY "Group admins can update goals"
    ON group_goals FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_goals.group_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Group admins can delete goals
DO $$ BEGIN
  CREATE POLICY "Group admins can delete goals"
    ON group_goals FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_goals.group_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- GOAL CONTRIBUTIONS RLS
-- ============================================
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- Group members can view contributions
DO $$ BEGIN
  CREATE POLICY "Group members can view contributions"
    ON goal_contributions FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM group_goals gg
          JOIN group_members gm ON gm.group_id = gg.group_id
        WHERE gg.id = goal_contributions.goal_id
          AND gm.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Contributions are system-managed (via triggers), not directly inserted by users
-- But allow insert for the trigger function which runs as SECURITY DEFINER
DO $$ BEGIN
  CREATE POLICY "System can insert contributions"
    ON goal_contributions FOR INSERT
    WITH CHECK (TRUE); -- Trigger runs as SECURITY DEFINER
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- GRANT EXECUTE ON RPC FUNCTIONS
-- ============================================
-- These functions use SECURITY DEFINER so they run with elevated privileges
-- but we grant execute to authenticated users

GRANT EXECUTE ON FUNCTION get_group_exercise_totals(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_member_stats(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_activity_summary(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_active_goals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_goal_contributions(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pair_exercise_totals(UUID, UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_contributors(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_group_goal(UUID, TEXT, INTEGER, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_group_goal(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exercise_parent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exercise_variants(UUID) TO authenticated;
