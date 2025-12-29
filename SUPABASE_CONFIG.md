# Supabase Configuration for Email Authentication

## ⚠️ CRITICAL: Run Migrations First

**You MUST run these database migrations in order:**

### Migration 1: Initial Schema
If you haven't already, run `supabase/migrations/001_initial_schema.sql` to create all tables.

### Migration 2: Email Auth Support
Navigate to **SQL Editor** in your Supabase dashboard and paste the contents of `supabase/migrations/002_fix_email_auth.sql`. This migration:
- Makes `phone_number` nullable (so email-only users can sign up)
- Adds `email` column to profiles table
- Updates the auto-profile creation trigger

Without this migration, you'll see errors like:
- "Database setup incomplete"
- "violates not-null constraint"
- Profile not loading after login

### Migration 3: Fix Infinite Recursion in Participants (CRITICAL)
Run `supabase/migrations/003_fix_rls_infinite_recursion.sql` to fix the RLS policy bug.

Without this migration, you'll see:
- "infinite recursion detected in policy for relation challenge_participants"
- Cannot create challenges
- App crashes when trying to add participants

### Migration 4: Fix Infinite Recursion in Challenges (CRITICAL)
Run `supabase/migrations/004_fix_challenges_rls_recursion.sql` to fix the circular dependency.

The problem: `challenges` policy checks `challenge_participants`, and `challenge_participants` checks `challenges`. This creates a circular loop.

The fix uses a SECURITY DEFINER function to break the cycle.

Without this migration, you'll see:
- "infinite recursion detected in policy for relation challenges"
- Cannot view challenges
- App freezes when loading challenge data

### Migration 5: Fix ALL Remaining RLS Recursion Issues (COMPREHENSIVE)
Run `supabase/migrations/005_fix_all_rls_recursion.sql` to fix all remaining recursion issues.

**This migration is the most important** - it fixes:
- ✅ `group_members` self-referencing policy
- ✅ `groups` policy referencing `group_members`
- ✅ `completions` policy referencing `challenge_participants`
- ✅ Creates helper functions for all common checks
- ✅ Grants proper permissions

**You can run this migration even if you didn't run 003/004** - it's comprehensive and idempotent.

See `RLS_POLICY_AUDIT.md` for full details of all issues found and fixed.

### Migration 6: Add Challenge Frequency & Duration
Run `supabase/migrations/006_add_challenge_frequency_duration.sql` to add support for recurring and duration-based challenges.

**This migration adds:**
- ✅ `frequency` column (one_time, daily, weekly, monthly)
- ✅ `duration_days` column for time-limited challenges
- ✅ Backward compatibility (existing challenges default to 'one_time')

**What this enables:**
- **One-time challenges** - Single event (default)
- **Daily challenges** - Do it every day (with daily completion limit)
- **Weekly challenges** - Once per week
- **Monthly challenges** - Once per month
- **Duration-based** - Set how long the challenge runs (7, 14, 30, 90 days)

Without this migration, the challenge creation form will fail when trying to save frequency/duration data.

### Migration 7: Add Weight Tracking for Max Effort Challenges
Run `supabase/migrations/007_add_weight_to_completions.sql` to add weight tracking for strength exercises.

**This migration adds:**
- ✅ `weight` column (decimal) for weight lifted
- ✅ `weight_unit` column (lbs or kg)
- ✅ Index for efficient weight-based leaderboard queries

**What this enables:**
- **Max Effort tracking**: Log both weight AND reps (e.g., "225 lbs x 5 reps")
- **Proper leaderboards**: Ranks by estimated 1RM using Brzycki formula
- **Unit flexibility**: Support for both pounds and kilograms
- **Accurate comparison**: Compare apples-to-apples with calculated 1RM

**How it works:**
- For max effort challenges, users enter weight + reps
- System calculates estimated 1RM: `weight × (36 / (37 - reps))`
- Leaderboard ranks by estimated 1RM
- Displays: weight, reps, and calculated 1RM

Without this migration, max effort challenges can only track reps, making it impossible to properly compare strength achievements.

### Migration 8: User-Driven Challenge Completion
Run `supabase/migrations/008_add_user_challenge_completion.sql` to add smart completion tracking.

**This migration adds:**
- ✅ `completed_by_user` flag on challenge_participants
- ✅ `user_completed_at` timestamp for completion time
- ✅ Auto-completion trigger for one-time challenges
- ✅ Index for efficient completion queries

**What this fixes:**
The old system marked challenges "completed" when time ran out. The new system:
- **One-time challenges**: Completed when user logs their first result
- **Recurring challenges**: Completed when end date passes (time-based)

**How it works:**
- When user logs completion for a one-time challenge → auto-marks as completed
- Challenge moves from "Active" to "Completed" tab
- Shows "COMPLETED" badge on challenge detail page
- Prevents logging additional results (one-time = one result)
- End date is optional/informational for motivation

**Example:**
- "Max Bench Press" challenge with 7-day deadline
- User logs result on day 3 → Marked completed immediately
- Can still view in "Completed" tab and see leaderboard
- Even if deadline passes, it's based on user action, not time

Without this migration, one-time challenges would incorrectly auto-complete based on time instead of user action.

### Migration 9: Multi-Step Challenges (Hyrox-Style Workouts)
Run `supabase/migrations/009_add_multi_step_challenges.sql` to add support for multi-step challenges.

**This migration adds:**
- ✅ `steps` JSONB column to challenges table
- ✅ `step_data` JSONB column to completions table
- ✅ Validation trigger to ensure step data matches challenge steps
- ✅ GIN indexes for efficient JSON queries

**What this enables:**
- **Multi-step workouts**: Combine multiple exercises into one challenge (e.g., Hyrox)
- **Step-by-step tracking**: Log time for each individual step/exercise
- **Total time leaderboard**: Ranks participants by total completion time
- **Flexible structure**: Each step can have its own exercise type and target

**Example:**
Create a Hyrox-style challenge:
1. Step 1: 1K Run (timed)
2. Step 2: 50 Burpees (amrap)
3. Step 3: 1K Run (timed)
4. ...and so on

Users log time for each step, and the system calculates total time for the leaderboard.

**Data Structure:**
```json
// challenges.steps
[
  {
    "exercise": "1K Run",
    "type": "timed",
    "target_value": 240,
    "target_unit": "seconds"
  },
  {
    "exercise": "50 Burpees",
    "type": "amrap",
    "target_value": 50,
    "target_unit": "reps"
  }
]

// completions.step_data
[
  {
    "step_index": 0,
    "exercise": "1K Run",
    "value": 235,
    "unit": "seconds"
  },
  {
    "step_index": 1,
    "exercise": "50 Burpees",
    "value": 180,
    "unit": "seconds"
  }
]
```

Without this migration, you can only create single-exercise challenges.

### Migration 10: Simplify Challenge Type Structure (RECOMMENDED)
Run `supabase/migrations/010_simplify_challenge_types.sql` to simplify the challenge type system.

**This migration refactors:**
- ✅ Reduces from 5 confusing types to 4 clear types
- ✅ Renames `timed` → `for_time` (clearer intent)
- ✅ Merges `distance` into `for_time` (distance is just "for time" with distance units)
- ✅ Renames `multi_step` → `workout` (better describes complex programs)
- ✅ Updates database constraints
- ✅ Migrates existing challenges automatically

**New Type Structure:**
1. **AMRAP** - Max reps or rounds in time limit (can be simple or multi-round)
   - Simple: "50 pushups in 2 mins"
   - Rounds: "Cindy (5 pullups, 10 pushups, 15 squats) - AMRAP 20 mins"

2. **Max Effort** - Heaviest weight × reps (strength PRs)
   - "Max bench press (225 lbs × 5 reps)"

3. **For Time** - Fastest time to complete target (can be simple or multi-round)
   - Simple: "100 burpees for time"
   - Rounds: "5 rounds of Fran for time"

4. **Workout** - Multi-exercise circuits or structured programs
   - Sequential: "Hyrox (8 stations)"
   - Strength: "Leg Day (5 exercises with sets/reps)"

**Step Types** (for multi-exercise challenges):
- `reps` - Rep-based exercises
- `time` - Timed exercises
- `distance` - Distance-based exercises
- `strength` - Sets × reps × weight

This migration makes challenge creation significantly more intuitive while maintaining full flexibility.

---

## Required Supabase Dashboard Settings

### 1. Email Template Configuration
Navigate to: **Authentication > Email Templates > Confirm signup**

Update the template to include the OTP code:

```html
<h2>Confirm your email</h2>

<p>Your verification code is:</p>
<h1 style="font-size: 48px; letter-spacing: 8px; font-family: monospace;">{{ .Token }}</h1>

<p>Or click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>

<p>This code expires in 1 hour.</p>
```

### 2. Redirect URLs Configuration
Navigate to: **Authentication > URL Configuration > Redirect URLs**

Add these redirect URLs:

```
exp://localhost:8081
fyt://
http://localhost:8081
```

### 3. Email Settings
Navigate to: **Authentication > Providers > Email**

Ensure:
- ✅ "Enable email provider" is checked
- ✅ "Confirm email" is enabled
- ✅ "Secure email change" is enabled (optional)

### 4. Site URL
Navigate to: **Authentication > URL Configuration > Site URL**

Set to one of:
- `exp://localhost:8081` (for development)
- `fyt://` (for production)

### 5. Storage Setup for Avatars
Navigate to: **Storage** in your Supabase dashboard

Create a new bucket:
1. Click "New bucket"
2. Name: `profiles`
3. Public bucket: ✅ **Yes** (so avatar URLs are publicly accessible)
4. File size limit: 5 MB (recommended)
5. Allowed MIME types: `image/*` (optional, for security)

**Policies**: Set up these exact policies in Storage > Policies:

**Policy 1: Public Read Access**
- Target roles: `public` (or `anon`)
- Policy command: `SELECT`
- Policy definition:
```sql
bucket_id = 'profiles'
```

**Policy 2: Authenticated Upload**
- Target roles: `authenticated`
- Policy command: `INSERT`
- WITH CHECK:
```sql
bucket_id = 'profiles'
AND LOWER((storage.foldername(name))[1]) = 'avatars'
AND storage."extension"(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
AND auth.role() = 'authenticated'
```

**Policy 3: Authenticated Update**
- Target roles: `authenticated`
- Policy command: `UPDATE`
- USING:
```sql
bucket_id = 'profiles'
AND LOWER((storage.foldername(name))[1]) = 'avatars'
AND auth.role() = 'authenticated'
```

**Policy 4: Delete Own Files**
- Target roles: `authenticated`
- Policy command: `DELETE`
- USING:
```sql
bucket_id = 'profiles'
AND LOWER((storage.foldername(name))[1]) = 'avatars'
AND auth.uid()::text = split_part(name, '/', 2)
AND auth.role() = 'authenticated'
```

**Quick Setup SQL** (run in SQL Editor):
```sql
-- Public read access
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Authenticated upload (images only)
CREATE POLICY "Authenticated upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
  AND LOWER((storage.foldername(name))[1]) = 'avatars'
  AND storage."extension"(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
  AND auth.role() = 'authenticated'
);

-- Authenticated update
CREATE POLICY "Authenticated update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND LOWER((storage.foldername(name))[1]) = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Delete own files only
CREATE POLICY "Delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND LOWER((storage.foldername(name))[1]) = 'avatars'
  AND auth.uid()::text = split_part(name, '/', 2)
  AND auth.role() = 'authenticated'
);
```

## Testing the Configuration

1. Enter your email in the app
2. Check your email for both:
   - The 6-digit code to paste in the app
   - A magic link you can click (optional fallback)
3. Either paste the code OR click the link - both should work

## Migration SQL
Don't forget to run the migration in Supabase SQL Editor:

```sql
-- File: supabase/migrations/002_fix_email_auth.sql
```

Navigate to **SQL Editor** and paste the contents of `002_fix_email_auth.sql`.
