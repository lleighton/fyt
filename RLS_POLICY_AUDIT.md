# RLS Policy Audit Report

## Issues Found

### 🚨 Critical - Infinite Recursion Issues

All of these have been fixed in migrations 003, 004, and 005.

#### 1. challenge_participants (FIXED in migration 003)
**Problem**: Self-referencing SELECT policy
```sql
-- BROKEN: Checks challenge_participants to view challenge_participants
CREATE POLICY "Participants are viewable" ON challenge_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM challenge_participants cp  -- ❌ RECURSION
    WHERE cp.challenge_id = challenge_participants.challenge_id
    AND cp.user_id = auth.uid()
  ) ...
```

**Fix**: Use direct checks and reference challenges table only
- Check if `user_id = auth.uid()` directly (no subquery)
- Check if user is challenge creator
- Check if challenge is public

#### 2. challenges ↔ challenge_participants (FIXED in migration 004)
**Problem**: Circular dependency
```
challenges SELECT → checks challenge_participants
                    ↓
challenge_participants SELECT → checks challenges
                    ↓
challenges SELECT → ... INFINITE LOOP
```

**Fix**: Created `is_challenge_participant()` SECURITY DEFINER function to break the cycle

#### 3. group_members (FIXED in migration 005)
**Problem**: Self-referencing SELECT policy
```sql
-- BROKEN: Checks group_members to view group_members
CREATE POLICY "Group members are viewable by group members" ON group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members gm  -- ❌ RECURSION
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  ));
```

**Fix**: Created `is_group_member()` SECURITY DEFINER function

#### 4. groups → group_members (FIXED in migration 005)
**Problem**: Could cause recursion after fixing group_members
```sql
CREATE POLICY "Groups are viewable" ON groups FOR SELECT
  USING (...
    OR EXISTS (
      SELECT 1 FROM group_members  -- Could trigger recursion
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );
```

**Fix**: Use `is_group_member()` SECURITY DEFINER function

#### 5. completions → challenge_participants (FIXED in migration 005)
**Problem**: References challenge_participants which had recursion issues
```sql
CREATE POLICY "Completions are viewable" ON completions FOR SELECT
  USING (...
    OR EXISTS (
      SELECT 1 FROM challenge_participants  -- Could trigger recursion
      WHERE challenge_id = completions.challenge_id
      AND user_id = auth.uid()
    )
  );
```

**Fix**: Use `is_challenge_participant()` SECURITY DEFINER function

## Solution Strategy

All fixes use the **SECURITY DEFINER function pattern**:

1. Create a function with `SECURITY DEFINER` that bypasses RLS
2. Mark function as `STABLE` for performance
3. Use function in policy instead of direct subquery
4. Grant EXECUTE permission to authenticated users

### Benefits:
- ✅ Breaks circular dependencies
- ✅ No infinite recursion
- ✅ Better performance (functions can be inlined/cached)
- ✅ More maintainable (DRY principle)
- ✅ Security is preserved (still checks same conditions)

## Migration Order

Run these in order:

1. `001_initial_schema.sql` - Creates all tables (if not already run)
2. `002_fix_email_auth.sql` - Adds email support
3. `003_fix_rls_infinite_recursion.sql` - Fixes challenge_participants
4. `004_fix_challenges_rls_recursion.sql` - Fixes challenges
5. `005_fix_all_rls_recursion.sql` - Fixes group_members, groups, completions

**Migration 005 is comprehensive** and fixes all remaining issues. It can be run even if 003 and 004 weren't run (it's idempotent).

## Helper Functions Created

All helper functions are in migration 005:

| Function | Purpose |
|----------|---------|
| `is_challenge_participant(challenge_id, user_id)` | Check if user is in a challenge |
| `is_group_member(group_id, user_id)` | Check if user is in a group |
| `is_group_admin(group_id, user_id)` | Check if user is group admin |
| `is_public_challenge(challenge_id)` | Check if challenge is public |
| `is_challenge_creator(challenge_id, user_id)` | Check if user created challenge |

All functions are:
- `SECURITY DEFINER` - Bypass RLS when checking
- `STABLE` - Can be cached/inlined for performance
- Granted to `authenticated` role

## Tables Reviewed

| Table | Status | Issues Found |
|-------|--------|--------------|
| profiles | ✅ Clean | No recursion, simple policies |
| groups | ⚠️ Fixed | Referenced group_members (could recurse) |
| group_members | 🚨 Fixed | Self-referencing policy |
| challenges | 🚨 Fixed | Circular dependency with challenge_participants |
| challenge_participants | 🚨 Fixed | Self-referencing + circular with challenges |
| completions | ⚠️ Fixed | Referenced challenge_participants (could recurse) |

## Testing Checklist

After running all migrations, test these operations:

- [ ] Create a challenge
- [ ] Add participants to challenge
- [ ] View challenge participants list
- [ ] Create a group
- [ ] Add members to group
- [ ] View group members list
- [ ] Log a completion
- [ ] View completions for a challenge
- [ ] View completions for a user

All should work without "infinite recursion" errors.
