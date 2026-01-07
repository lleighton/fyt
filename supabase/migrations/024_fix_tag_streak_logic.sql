-- Fix the update_tag_streak function to properly track consecutive days
-- The original function just incremented on every call, which is wrong
-- A streak should only increment if the last activity was yesterday

CREATE OR REPLACE FUNCTION update_tag_streak(
  p_user_id UUID,
  p_streak_type TEXT,
  p_partner_id UUID DEFAULT NULL,
  p_group_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_streak_id UUID;
  v_current_count INTEGER;
  v_longest_count INTEGER;
  v_last_activity_at TIMESTAMPTZ;
  v_last_activity_date DATE;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Find existing streak record
  SELECT id, current_count, longest_count, last_activity_at
  INTO v_streak_id, v_current_count, v_longest_count, v_last_activity_at
  FROM streaks
  WHERE user_id = p_user_id
    AND streak_type = p_streak_type
    AND (partner_id IS NOT DISTINCT FROM p_partner_id)
    AND (group_id IS NOT DISTINCT FROM p_group_id);

  IF v_streak_id IS NULL THEN
    -- Create new streak (first activity ever)
    INSERT INTO streaks (user_id, streak_type, partner_id, group_id, current_count, longest_count, last_activity_at, streak_started_at)
    VALUES (p_user_id, p_streak_type, p_partner_id, p_group_id, 1, 1, NOW(), NOW());

    v_current_count := 1;
  ELSE
    -- Get the date of last activity
    v_last_activity_date := v_last_activity_at::DATE;

    IF v_last_activity_date = v_today THEN
      -- Already recorded activity today, no change to streak
      -- Just update the timestamp
      UPDATE streaks
      SET last_activity_at = NOW()
      WHERE id = v_streak_id;

      -- v_current_count stays the same

    ELSIF v_last_activity_date = v_yesterday THEN
      -- Last activity was yesterday, continue the streak!
      v_current_count := v_current_count + 1;
      IF v_current_count > v_longest_count THEN
        v_longest_count := v_current_count;
      END IF;

      UPDATE streaks
      SET current_count = v_current_count,
          longest_count = v_longest_count,
          last_activity_at = NOW()
      WHERE id = v_streak_id;

    ELSE
      -- Gap in activity (more than 1 day), reset streak to 1
      v_current_count := 1;

      UPDATE streaks
      SET current_count = 1,
          last_activity_at = NOW(),
          streak_started_at = NOW()
      WHERE id = v_streak_id;
    END IF;
  END IF;

  -- Update profile public streak if applicable
  IF p_streak_type = 'public' THEN
    UPDATE profiles
    SET tag_streak_public = v_current_count,
        tag_streak_longest = GREATEST(COALESCE(tag_streak_longest, 0), v_current_count)
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add a comment explaining the function
COMMENT ON FUNCTION update_tag_streak IS 'Updates tag streak for a user. Increments if last activity was yesterday, resets if gap > 1 day, no change if already active today.';
