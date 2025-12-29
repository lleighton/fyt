-- Seed test tags for development
-- Creates sample tags between test users so we can test the Tags screen

DO $$
DECLARE
  user1_id UUID := 'a1111111-1111-1111-1111-111111111111'; -- alex
  user2_id UUID := 'a2222222-2222-2222-2222-222222222222'; -- maria
  user3_id UUID := 'a3333333-3333-3333-3333-333333333333'; -- chris
  user4_id UUID := 'a4444444-4444-4444-4444-444444444444'; -- sam
  pushups_id UUID;
  squats_id UUID;
  plank_id UUID;
  burpees_id UUID;
  tag1_id UUID;
  tag2_id UUID;
  tag3_id UUID;
BEGIN
  -- Get exercise IDs
  SELECT id INTO pushups_id FROM exercises WHERE name = 'Pushups' LIMIT 1;
  SELECT id INTO squats_id FROM exercises WHERE name = 'Squats' LIMIT 1;
  SELECT id INTO plank_id FROM exercises WHERE name = 'Plank' LIMIT 1;
  SELECT id INTO burpees_id FROM exercises WHERE name = 'Burpees' LIMIT 1;

  IF pushups_id IS NULL THEN
    RAISE NOTICE 'Exercises not found - skipping tag seed';
    RETURN;
  END IF;

  -- Tag 1: Alex sends pushup challenge to Maria (completed)
  INSERT INTO tags (sender_id, exercise_id, value, is_public, expires_at, created_at)
  VALUES (user1_id, pushups_id, 25, TRUE, NOW() + INTERVAL '24 hours', NOW() - INTERVAL '12 hours')
  RETURNING id INTO tag1_id;

  -- Maria completed it with 30 reps
  INSERT INTO tag_recipients (tag_id, recipient_id, status, completed_value, completed_at, created_at)
  VALUES
    (tag1_id, user1_id, 'completed', 25, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'), -- sender auto-complete
    (tag1_id, user2_id, 'completed', 30, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '12 hours')
  ON CONFLICT (tag_id, recipient_id) DO NOTHING;

  -- Tag 2: Maria sends squats challenge to Alex and Chris (pending)
  INSERT INTO tags (sender_id, exercise_id, value, is_public, expires_at, created_at)
  VALUES (user2_id, squats_id, 40, TRUE, NOW() + INTERVAL '18 hours', NOW() - INTERVAL '6 hours')
  RETURNING id INTO tag2_id;

  INSERT INTO tag_recipients (tag_id, recipient_id, status, created_at)
  VALUES
    (tag2_id, user2_id, 'completed', NOW() - INTERVAL '6 hours'), -- sender
    (tag2_id, user1_id, 'pending', NOW() - INTERVAL '6 hours'),
    (tag2_id, user3_id, 'pending', NOW() - INTERVAL '6 hours')
  ON CONFLICT (tag_id, recipient_id) DO NOTHING;

  -- Update completed_value for sender
  UPDATE tag_recipients SET completed_value = 40 WHERE tag_id = tag2_id AND recipient_id = user2_id;

  -- Tag 3: Chris sends plank challenge to Sam (expired)
  INSERT INTO tags (sender_id, exercise_id, value, is_public, expires_at, created_at)
  VALUES (user3_id, plank_id, 60, TRUE, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '26 hours')
  RETURNING id INTO tag3_id;

  INSERT INTO tag_recipients (tag_id, recipient_id, status, created_at)
  VALUES
    (tag3_id, user3_id, 'completed', NOW() - INTERVAL '26 hours'), -- sender
    (tag3_id, user4_id, 'expired', NOW() - INTERVAL '26 hours')
  ON CONFLICT (tag_id, recipient_id) DO NOTHING;

  UPDATE tag_recipients SET completed_value = 60 WHERE tag_id = tag3_id AND recipient_id = user3_id;

  RAISE NOTICE 'Created 3 test tags with various statuses';
END $$;
