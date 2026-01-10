# fyt - Consolidated Pre-Launch Implementation Plan

## Status Overview

| Priority | Area | Status |
|----------|------|--------|
| **P0** | Core Loop Clarity | 🔴 Not Started |
| **P1** | Group Accountability | 🔴 Not Started |
| **P2** | Phone Tagging (Growth) | 🟡 Partial |
| **P3** | Polish & Launch | 🟡 In Progress |

---

## P0: Core Loop Clarity (Pre-Launch Critical)

### Rationale
User feedback shows confusion about the core mechanic. New users need to immediately understand: Tag → Respond → Tag Back.

### P0.1: Onboarding Flow

**Design approach:** App screenshots with overlay text (uses existing UI, no custom illustrations needed)
**Skippable:** Yes, show skip button on each screen

- [ ] Create `app/(auth)/onboarding/` directory
- [ ] Step 1: "Get tagged by friends" - screenshot of pending tag with overlay explaining
- [ ] Step 2: "Complete the challenge" - screenshot of completion screen with overlay
- [ ] Step 3: "Tag them back" - screenshot of tag creation with overlay
- [ ] Step 4: "Build streaks together" - screenshot of streak display with overlay
- [ ] Add `has_completed_onboarding` column to profiles table (Supabase - persists across reinstalls)
- [ ] Create migration for new column
- [ ] Show onboarding on first app launch only (check profiles.has_completed_onboarding)
- [ ] Add "How it works" button in settings to replay onboarding
- [ ] Add skip button that sets has_completed_onboarding = true

### P0.2: In-App Guidance
- [ ] Add tooltip on first tag creation: "Complete an exercise, then challenge friends to match it"
- [ ] Add "Tag back!" prompt more prominently after completing a tag
- [ ] Show "Hot potato" visual metaphor in empty states

---

## P1: Group Accountability System (Pre-Launch Critical)

### Rationale
User feedback identified need for "verified groups" with accountability. Creates FOMO and ensures committed members.

### P1.1: Database Schema
```sql
-- Migration: 045_group_accountability.sql
ALTER TABLE groups ADD COLUMN verification_mode TEXT DEFAULT 'open'; -- 'open' | 'verified'
ALTER TABLE groups ADD COLUMN max_skips INTEGER DEFAULT 3;
ALTER TABLE group_members ADD COLUMN skipped_verifications INTEGER DEFAULT 0;
ALTER TABLE group_members ADD COLUMN last_warning_at TIMESTAMPTZ;
ALTER TABLE group_members ADD COLUMN removed_reason TEXT; -- null | 'skipped_limit' | 'left' | 'kicked'
```

- [ ] Create migration `045_group_accountability.sql`
- [ ] Add RLS policies for new columns
- [ ] Create `check_and_remove_inactive_members()` RPC function
- [ ] Create trigger on tag expiry to increment `skipped_verifications`

### P1.2: Group Settings UI
- [ ] Add "Verification Mode" toggle in `group/[id]/settings.tsx`
  - **Open**: Honours system, no penalties
  - **Verified**: Proof encouraged, skip limit enforced
- [ ] Add "Max Skips Before Removal" number input (default: 3)
- [ ] Show warning banner for members at 2/3 skips
- [ ] Add "Skip count" display on member list for admins

### P1.3: Skip Tracking Logic

**Skip triggers:** A skip is counted when a member:
1. Fails to complete a tag sent TO the group, OR
2. Completes but fails to verify (no proof) in a verified group

**Rejoin rules:**
- Admin must re-invite removed members
- Can rejoin immediately IF they upload a verified completion first
- All group streaks for that user are deducted/reset on removal

- [ ] When tag expires without completion (for group tags only):
  - If group is `verified` mode, increment `skipped_verifications`
  - If completion exists but no proof in verified group, also increment
  - If skip count >= `max_skips`, auto-remove member
  - Send push notification warning at (max_skips - 1)
- [ ] Reset skip count option for admins (forgiveness button in member list)
- [ ] Show "You've been removed" screen with reason and "Request Rejoin" option
- [ ] Rejoin flow: requires uploading verified completion before rejoining
- [ ] On removal: deduct/reset user's group streaks, keep completion history

### P1.4: Verification Emphasis
- [ ] In verified groups, make proof upload more prominent (not buried)
- [ ] Show "Verified ✓" badge on completions with proof
- [ ] Allow group admins to mark completions as "unverified" (flag system)

---

## P2: Invite Non-Users (Growth Mechanic)

### Rationale
User feedback: "Can I tag people who don't have the app?" This is viral growth 101.

### Important Constraints
> **⚠️ NO PHONE NUMBER SIGNUP**: Current release uses email auth only. Phone number signup is NOT supported.
>
> **⚠️ NO SMS SENDING**: We do NOT send SMS invites (expensive at scale, compliance headaches). Users share via native share sheet instead.

### P2.1: Invite Link System

**Domain:** `fyt.it.com`
**Expiry:** 30 days from creation
**Code strategy:** One code per tag (reuse same code when sharing same tag multiple times)

- [ ] Create `invite_links` table:
  ```sql
  CREATE TABLE invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- short code e.g. "abc123"
    inviter_id UUID REFERENCES profiles(id) NOT NULL,
    tag_id UUID REFERENCES tags(id), -- optional: link to specific tag
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0
  );
  ```
- [ ] Generate short unique codes (6 chars, URL-safe)
- [ ] Reuse existing code if sharing same tag again (check for existing invite_link with same tag_id + inviter_id)
- [ ] Track clicks and conversions for analytics
- [ ] Add index on (tag_id, inviter_id) for quick lookup

### P2.2: Native Share Integration
- [ ] In Step 3 (recipient selection), add "Invite a Friend" button
- [ ] Get or create invite link (reuse if same tag)
- [ ] Open native share sheet with pre-filled message:
  ```
  🏷️ I just did {value} {exercise} - can you match it?

  Download fyt and find out: https://fyt.it.com/i/{code}
  ```
- [ ] User chooses channel: iMessage, WhatsApp, Instagram, etc.
- [ ] Track which links were created (not who received - we don't know)

### P2.3: Deep Link Handling
- [ ] Handle `fyt.it.com/i/{code}` web redirect → App Store / Play Store
- [ ] Handle `fyt://invite/{code}` in-app deep link
- [ ] On app open with invite code:
  - Store code in local storage (MMKV)
  - Increment `invite_links.clicks`
  - Show during/after onboarding: "You were invited by {name}!"
  - If linked to tag: show that tag after signup

### P2.4: New User Experience
- [ ] After signup, check for stored invite code
- [ ] Link new user to inviter (for analytics/referral tracking)
- [ ] If invite was tag-specific: show that tag with extended 48h deadline
- [ ] Show "Your friend {name} is waiting!" prompt

### P2.5: Share Flow Prominence
- [ ] Add share button to home screen header
- [ ] Add "Invite Friends" card in empty states
- [ ] Show viral prompt after every 3rd tag completion: "Know someone who'd love this?"
- [ ] Add share option on tag completion success screen

---

## P3: Outstanding Feature Work

### P3.1: Group-Challenge Integration (From Phase 8.5)

#### Challenge Scoping
- [ ] Update `tag/create.tsx` to accept `groupId` URL parameter
- [ ] Set `tags.group_id` when creating from group context
- [ ] Filter tag list by group membership
- [ ] Add group badge to tag cards

#### Group Leaderboards
- [ ] Create `get_group_leaderboard()` RPC if not exists
- [ ] Implement group leaderboard UI in `group/[id].tsx`
- [ ] Add time period filters (week, month, all-time)
- [ ] Show "Team Total" aggregate prominently

#### Member Management
- [ ] Create `group/[id]/settings.tsx` screen
- [ ] Implement remove member (admins only)
- [ ] Implement promote/demote admin
- [ ] Add "Leave Group" for members
- [ ] Add "Delete Group" for creators

#### Database Maintenance
- [ ] Create trigger for `member_count` auto-update
- [ ] Add indexes for group-filtered queries

### P3.2: Motivation Rebalancing (From Phase 8.6)

#### Remaining UI Work
- [ ] Lottie celebration animations for completions (source from LottieFiles.com - free assets)
- [ ] Confetti for ALL completions, extra flair for beating/PR
- [ ] Home screen widget: "Recent PRs" or improvement streak

#### Leaderboard Enhancements
- [ ] Add "Consistency" tab showing streak length
- [ ] Add "Your Stats" section at top before rankings
- [ ] De-emphasize medals (smaller icons)

#### Group Celebration
- [ ] "Team Total" prominent display
- [ ] Show "X tags completed this week as a group"
- [ ] Add reactions on completions (fire, clap, muscle)

### P3.3: Notifications (From Phase 9)

**Implementation:** Supabase Edge Function + pg_cron for scheduled notifications

#### Scheduled Reminders
- [ ] Create Edge Function `send-scheduled-notifications`
- [ ] Set up pg_cron job to run every 15 minutes
- [ ] 6h warning: "Tag expiring soon!"
- [ ] 1h warning: "Last chance to keep your streak!"
- [ ] Streak milestone celebration notifications
- [ ] Daily digest (opt-in)

#### Group Completion Notifications
- [ ] When ANY member completes a group tag, notify ALL other group members
- [ ] Message: "{name} just completed {exercise}! 💪"
- [ ] Deep link to the tag detail screen
- [ ] Respect notification preferences (can opt out of group notifications)

#### In-App Notification Center
- [ ] Create `/notifications` screen
- [ ] Show notification history
- [ ] Mark as read functionality
- [ ] Deep link to relevant content

---

## P4: Polish & Launch Prep

### P4.1: Performance & Quality
- [ ] Performance optimization pass (target: <2s load)
- [ ] Accessibility audit (VoiceOver, TalkBack)
- [ ] Error boundary implementation
- [ ] Sentry crash reporting setup

### P4.2: Visual Polish
- [ ] Audit and improve animations (target: 60fps)
- [ ] Fix layout shift issues (from feedback)
- [ ] Consistent loading states throughout

### P4.3: App Store Prep
- [ ] App store screenshots
- [ ] App store description copy
- [ ] Privacy policy & terms
- [ ] App icon finalization
- [ ] Splash screen polish

### P4.4: Testing
- [ ] Happy path E2E test (signup → tag → complete → tag back)
- [ ] Offline mode testing
- [ ] Push notification testing
- [ ] Deep link testing

---

## Backlog (Post-Launch)

These items came from user feedback but are not critical for launch:

### Location-Based Challenges
- [ ] "The London Challenge" - complete X pushups in Hyde Park
- [ ] Geo-fenced achievements
- [ ] City leaderboards

### Gamification Expansion
- [ ] Leaderboard rewards (gym membership for top monthly)
- [ ] Badges and achievements system
- [ ] Seasonal challenges

### Integrations
- [ ] Strava integration for running community
- [ ] Apple Health / Google Fit sync
- [ ] Brand partnerships (crypto rewards, etc.)

### Advanced Features
- [ ] AI form verification from video
- [ ] Motion-based rep counting
- [ ] Custom exercise creation
- [ ] Premium features (streak shields, etc.)

---

## Implementation Order

```
Week 1 (Pre-Launch Critical):
├── P0.1: Onboarding Flow
├── P0.2: In-App Guidance
├── P1.1: Group Accountability Schema
└── P1.2: Group Settings UI

Week 2:
├── P1.3: Skip Tracking Logic
├── P1.4: Verification Emphasis
├── P2.1: Invite Link System
└── P2.2: Native Share Integration

Week 3:
├── P2.3: Deep Link Handling
├── P2.4: New User Experience
├── P2.5: Share Flow Prominence
└── P3.1: Group-Challenge Integration

Week 4 (Launch Week):
├── P3.3: Notifications Polish
├── P4.1: Performance & Quality
├── P4.2: Visual Polish
└── P4.3: App Store Prep
```

---

## Key Metrics to Track Post-Launch

| Metric | Target | Why |
|--------|--------|-----|
| Tag completion rate | >60% | Core engagement |
| Tag-back rate | >40% | Viral loop working |
| 7-day streak retention | >25% | Habit formation |
| Invite link clicks | Track | Awareness of viral reach |
| Invite conversion rate | >10% | Growth mechanic (click → signup) |
| Verified group retention | >80% | Accountability working |

---

## Files Affected Summary

**New Files:**
- `app/(auth)/onboarding/` - 4 onboarding screens
- `supabase/migrations/045_group_accountability.sql`
- `supabase/migrations/046_invite_links.sql`
- `app/(auth)/notifications.tsx`
- `lib/invite-links.ts` - invite code generation and tracking

**Modified Files:**
- `app/(auth)/group/[id]/settings.tsx` - verification mode
- `app/(auth)/tag/create.tsx` - native share integration, group context
- `components/tag/` - verification badges
- `lib/legend-state/store.ts` - new observables
- `lib/notifications.ts` - scheduled notifications
- `app.json` - deep link scheme configuration

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-10 | Two-tier groups (open/verified) | User feedback: need accountability but also casual option |
| 2026-01-10 | Native share over SMS | SMS expensive at scale ($0.01-0.15/msg), compliance headaches, lower trust than messages from friends |
| 2026-01-10 | No phone number signup | Email auth only for current release - simplifies auth flow, avoids SMS OTP costs |
| 2026-01-10 | Onboarding required | User feedback showed confusion about core loop |
| 2026-01-10 | 3-skip default for verified | Balances accountability with forgiveness |
| 2026-01-10 | Invite links with tracking | Free viral growth via user's own channels, track conversions for analytics |
| 2026-01-10 | Onboarding uses screenshots | Faster than custom illustrations, shows real UI |
| 2026-01-10 | Onboarding skippable | Respect user time, some users prefer to explore |
| 2026-01-10 | Onboarding flag in Supabase | Persists across reinstalls/devices |
| 2026-01-10 | Skip = no completion OR no verification | In verified groups, both trigger accountability |
| 2026-01-10 | Admin re-invite for removed | Controlled rejoin, requires verified completion to rejoin |
| 2026-01-10 | Domain: fyt.it.com | Production domain for invite links |
| 2026-01-10 | Invite links expire in 30 days | Balance between usability and stale links |
| 2026-01-10 | One code per tag | Reuse same link for same tag, better analytics |
| 2026-01-10 | LottieFiles for animations | Free assets, no custom design needed |
| 2026-01-10 | pg_cron + Edge Functions | Supabase-native scheduled notifications |
| 2026-01-10 | Group completion notifications | All members notified when anyone completes |
