-- Seed test users for development
-- These are fake users to test the app mechanics
-- NOTE: Run migration 018 first to make phone_number optional

DO $$
DECLARE
  user1_id UUID := 'a1111111-1111-1111-1111-111111111111';
  user2_id UUID := 'a2222222-2222-2222-2222-222222222222';
  user3_id UUID := 'a3333333-3333-3333-3333-333333333333';
  user4_id UUID := 'a4444444-4444-4444-4444-444444444444';
  user5_id UUID := 'a5555555-5555-5555-5555-555555555555';
  user6_id UUID := 'a6666666-6666-6666-6666-666666666666';
  user7_id UUID := 'a7777777-7777-7777-7777-777777777777';
  user8_id UUID := 'a8888888-8888-8888-8888-888888888888';
  user9_id UUID := 'a9999999-9999-9999-9999-999999999999';
  user10_id UUID := 'a0000000-0000-0000-0000-000000000010';
  group1_id UUID;
  group2_id UUID;
BEGIN
  -- Insert test users into auth.users
  -- Using email auth with password: 'testpass123'
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES
    (user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''),
    (user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maria@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''),
    (user3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chris@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''),
    (user4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sam@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''),
    (user5_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jordan@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''),
    (user6_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'taylor@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''),
    (user7_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'casey@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''),
    (user8_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'riley@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''),
    (user9_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jamie@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', ''),
    (user10_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'morgan@test.tagfit.app', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Insert identities for each user (required for auth to work)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES
    (user1_id, user1_id, 'alex@test.tagfit.app', jsonb_build_object('sub', user1_id, 'email', 'alex@test.tagfit.app'), 'email', NOW(), NOW(), NOW()),
    (user2_id, user2_id, 'maria@test.tagfit.app', jsonb_build_object('sub', user2_id, 'email', 'maria@test.tagfit.app'), 'email', NOW(), NOW(), NOW()),
    (user3_id, user3_id, 'chris@test.tagfit.app', jsonb_build_object('sub', user3_id, 'email', 'chris@test.tagfit.app'), 'email', NOW(), NOW(), NOW()),
    (user4_id, user4_id, 'sam@test.tagfit.app', jsonb_build_object('sub', user4_id, 'email', 'sam@test.tagfit.app'), 'email', NOW(), NOW(), NOW()),
    (user5_id, user5_id, 'jordan@test.tagfit.app', jsonb_build_object('sub', user5_id, 'email', 'jordan@test.tagfit.app'), 'email', NOW(), NOW(), NOW()),
    (user6_id, user6_id, 'taylor@test.tagfit.app', jsonb_build_object('sub', user6_id, 'email', 'taylor@test.tagfit.app'), 'email', NOW(), NOW(), NOW()),
    (user7_id, user7_id, 'casey@test.tagfit.app', jsonb_build_object('sub', user7_id, 'email', 'casey@test.tagfit.app'), 'email', NOW(), NOW(), NOW()),
    (user8_id, user8_id, 'riley@test.tagfit.app', jsonb_build_object('sub', user8_id, 'email', 'riley@test.tagfit.app'), 'email', NOW(), NOW(), NOW()),
    (user9_id, user9_id, 'jamie@test.tagfit.app', jsonb_build_object('sub', user9_id, 'email', 'jamie@test.tagfit.app'), 'email', NOW(), NOW(), NOW()),
    (user10_id, user10_id, 'morgan@test.tagfit.app', jsonb_build_object('sub', user10_id, 'email', 'morgan@test.tagfit.app'), 'email', NOW(), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles with email (no phone required after migration 018)
  INSERT INTO profiles (id, email, username, first_name, last_name, display_name, created_at, updated_at)
  VALUES
    (user1_id, 'alex@test.tagfit.app', 'alex_fitness', 'Alex', 'Johnson', 'Alex Johnson', NOW(), NOW()),
    (user2_id, 'maria@test.tagfit.app', 'maria_lifts', 'Maria', 'Garcia', 'Maria Garcia', NOW(), NOW()),
    (user3_id, 'chris@test.tagfit.app', 'chris_runner', 'Chris', 'Williams', 'Chris Williams', NOW(), NOW()),
    (user4_id, 'sam@test.tagfit.app', 'sam_strong', 'Sam', 'Brown', 'Sam Brown', NOW(), NOW()),
    (user5_id, 'jordan@test.tagfit.app', 'jordan_flex', 'Jordan', 'Davis', 'Jordan Davis', NOW(), NOW()),
    (user6_id, 'taylor@test.tagfit.app', 'taylor_gains', 'Taylor', 'Miller', 'Taylor Miller', NOW(), NOW()),
    (user7_id, 'casey@test.tagfit.app', 'casey_cardio', 'Casey', 'Wilson', 'Casey Wilson', NOW(), NOW()),
    (user8_id, 'riley@test.tagfit.app', 'riley_reps', 'Riley', 'Moore', 'Riley Moore', NOW(), NOW()),
    (user9_id, 'jamie@test.tagfit.app', 'jamie_jacked', 'Jamie', 'Taylor', 'Jamie Taylor', NOW(), NOW()),
    (user10_id, 'morgan@test.tagfit.app', 'morgan_muscle', 'Morgan', 'Anderson', 'Morgan Anderson', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

  -- Create first test group (let UUID auto-generate)
  INSERT INTO groups (name, description, creator_id, is_private, created_at, updated_at)
  VALUES (
    'Fitness Crew',
    'A group for testing fitness challenges',
    user1_id,
    FALSE,
    NOW(),
    NOW()
  )
  RETURNING id INTO group1_id;

  -- Add members to the first group
  INSERT INTO group_members (group_id, user_id, role, created_at)
  VALUES
    (group1_id, user1_id, 'admin', NOW()),
    (group1_id, user2_id, 'member', NOW()),
    (group1_id, user3_id, 'member', NOW()),
    (group1_id, user4_id, 'member', NOW()),
    (group1_id, user5_id, 'member', NOW())
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Create second test group
  INSERT INTO groups (name, description, creator_id, is_private, created_at, updated_at)
  VALUES (
    'Morning Warriors',
    'Early morning workout enthusiasts',
    user6_id,
    FALSE,
    NOW(),
    NOW()
  )
  RETURNING id INTO group2_id;

  -- Add members to the second group
  INSERT INTO group_members (group_id, user_id, role, created_at)
  VALUES
    (group2_id, user6_id, 'admin', NOW()),
    (group2_id, user7_id, 'member', NOW()),
    (group2_id, user8_id, 'member', NOW()),
    (group2_id, user9_id, 'member', NOW()),
    (group2_id, user10_id, 'member', NOW())
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RAISE NOTICE 'Created 10 test users and 2 test groups';
END $$;
