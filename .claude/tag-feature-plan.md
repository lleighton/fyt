# Tag Feature - Go-To-Market Implementation Plan

## Executive Summary

Simplify the app's initial offering by focusing on one viral mechanic: **Tags**. A Tag is a bodyweight exercise challenge you complete and then "tag" friends to match or beat. Think Snapchat streaks meets fitness accountability.

**Key Principle**: We're not removing any existing code or flexibility. We're creating a streamlined UX layer that uses the existing challenge infrastructure underneath.

---

## Core Concept

### What is a Tag?
1. User completes a bodyweight exercise (e.g., 50 pushups)
2. User "tags" one or more friends
3. Tagged friends have **24 hours** to match or beat the result
4. Completing a tag lets you "tag back" with a **different exercise**
5. Streaks build between pairs, within groups, and globally

### Streak Types
| Streak Type | Description | How It Breaks |
|-------------|-------------|---------------|
| **Pair Streak** | Between two specific users who keep tagging each other | Either person fails to respond in 24h |
| **Public Streak** | Any tags you've participated in (sent or received) | You fail to respond to any tag in 24h |
| **Group Streak** | Tags within a private group | You fail to respond to a group tag in 24h |

### Tag-Back Rules
- Optional but heavily encouraged via UI prompts
- Must be a **different exercise** than received
- Can tag **anyone** (not just original tagger) - creates open chains

---

## Bodyweight Exercise List

### Upper Body
| Exercise | Type | Unit |
|----------|------|------|
| Pushups | Reps | count |
| Diamond Pushups | Reps | count |
| Wide Pushups | Reps | count |
| Pike Pushups | Reps | count |
| Decline Pushups | Reps | count |
| Dips (chair/bench) | Reps | count |

### Core
| Exercise | Type | Unit |
|----------|------|------|
| Sit-ups | Reps | count |
| Crunches | Reps | count |
| Plank | Time | seconds |
| Side Plank (each side) | Time | seconds |
| Leg Raises | Reps | count |
| Mountain Climbers | Reps | count |
| Bicycle Crunches | Reps | count |
| Dead Bug | Reps | count |

### Lower Body
| Exercise | Type | Unit |
|----------|------|------|
| Squats | Reps | count |
| Jump Squats | Reps | count |
| Lunges (total) | Reps | count |
| Walking Lunges | Reps | count |
| Calf Raises | Reps | count |
| Wall Sit | Time | seconds |
| Glute Bridges | Reps | count |
| Single Leg Squats | Reps | count |

### Full Body
| Exercise | Type | Unit |
|----------|------|------|
| Burpees | Reps | count |
| Jumping Jacks | Reps | count |
| High Knees | Reps | count |
| Star Jumps | Reps | count |

---

## Verification System (v1)

**Approach**: Optional proof with social incentive

### How It Works
1. User completes exercise and logs result
2. Prompt: "Add proof?" with Skip option
3. If proof added:
   - Photo or short video (max 15 seconds)
   - Visible to tagger (and public if tag is public)
   - Tag gets "Verified" badge
4. Social pressure drives verification without blocking completion

### Future Enhancements (post-v1)
- Motion-based rep counting via accelerometer
- AI verification of exercise form
- Integration with fitness trackers

---

## Database Schema Changes

### New Table: `exercises`
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'upper_body', 'core', 'lower_body', 'full_body'
  type TEXT NOT NULL, -- 'reps', 'time'
  unit TEXT NOT NULL, -- 'count', 'seconds'
  description TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New Table: `tags`
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id), -- Links to existing challenge system
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  value INTEGER NOT NULL, -- reps or seconds
  proof_url TEXT, -- optional photo/video
  is_public BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL, -- 24h from creation
  parent_tag_id UUID REFERENCES tags(id), -- for tag-backs, tracks chain
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New Table: `tag_recipients`
```sql
CREATE TABLE tag_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES tags(id) NOT NULL,
  recipient_id UUID REFERENCES profiles(id), -- null if external invite
  recipient_phone TEXT, -- for external invites
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'expired'
  completed_value INTEGER, -- their result
  completed_at TIMESTAMPTZ,
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New Table: `streaks`
```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  streak_type TEXT NOT NULL, -- 'pair', 'public', 'group'
  partner_id UUID REFERENCES profiles(id), -- for pair streaks
  group_id UUID REFERENCES groups(id), -- for group streaks
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_type, partner_id, group_id)
);
```

### Updates to Existing Tables
```sql
-- Add to profiles
ALTER TABLE profiles ADD COLUMN tag_streak_public INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN tag_streak_longest INTEGER DEFAULT 0;

-- Add to challenges (for backwards compatibility)
ALTER TABLE challenges ADD COLUMN is_tag BOOLEAN DEFAULT false;
ALTER TABLE challenges ADD COLUMN tag_id UUID REFERENCES tags(id);
```

---

## UI/UX Flow

### Home Screen (Redesigned)
```
┌─────────────────────────────────────┐
│ Welcome back, Lewis                 │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │  🔥 Your Streaks               │ │
│ │  Public: 12 days               │ │
│ │  With @Jordan: 5 days          │ │
│ │  Gym Bros (group): 8 days      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ⚠️ PENDING TAGS (2)                │
│ ┌─────────────────────────────────┐ │
│ │ @Jordan tagged you!            │ │
│ │ 50 Pushups - Beat it!          │ │
│ │ ⏱️ 18h 32m remaining           │ │
│ │ [Complete Now]                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ @Alex tagged you!              │ │
│ │ 60s Plank - Beat it!           │ │
│ │ ⏱️ 4h 15m remaining            │ │
│ │ [Complete Now]                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│        [🏷️ TAG SOMEONE]            │
│          (Primary CTA)              │
├─────────────────────────────────────┤
│ Recent Activity                     │
│ • You completed @Jordan's tag       │
│ • @Alex beat your 45 pushups        │
│ • Your tag expired (missed @Sam)    │
└─────────────────────────────────────┘
```

### Tag Creation Flow
```
Step 1: Choose Exercise
┌─────────────────────────────────────┐
│ ← What exercise?                    │
├─────────────────────────────────────┤
│ 🔍 Search exercises...              │
├─────────────────────────────────────┤
│ UPPER BODY                          │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │Pushups │ │Diamond │ │ Pike   │   │
│ └────────┘ └────────┘ └────────┘   │
│ CORE                                │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │Sit-ups │ │ Plank  │ │Crunches│   │
│ └────────┘ └────────┘ └────────┘   │
│ ...                                 │
└─────────────────────────────────────┘

Step 2: Log Your Result
┌─────────────────────────────────────┐
│ ← Pushups                           │
├─────────────────────────────────────┤
│                                     │
│      How many did you do?           │
│                                     │
│          ┌─────────┐                │
│          │   50    │                │
│          └─────────┘                │
│            reps                     │
│                                     │
│   [📷 Add Proof (Optional)]         │
│                                     │
│         [Next →]                    │
└─────────────────────────────────────┘

Step 3: Tag Friends
┌─────────────────────────────────────┐
│ ← Who do you want to tag?           │
├─────────────────────────────────────┤
│ 🔍 Search friends...                │
├─────────────────────────────────────┤
│ RECENT                              │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Jordan    🔥5 day streak    ✓│ │
│ │ 👤 Alex                        ✓│ │
│ │ 👤 Sam                          │ │
│ └─────────────────────────────────┘ │
│ GROUPS                              │
│ ┌─────────────────────────────────┐ │
│ │ 👥 Gym Bros (8 members)        ✓│ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📤 Invite new friend (share link)   │
├─────────────────────────────────────┤
│ ○ Public  ● Private                 │
│                                     │
│    [🏷️ Send Tag to 3 people]       │
└─────────────────────────────────────┘
```

### Tag Completion Flow
```
┌─────────────────────────────────────┐
│ ← @Jordan's Tag                     │
├─────────────────────────────────────┤
│                                     │
│    Jordan did 50 Pushups            │
│    Can you beat it?                 │
│                                     │
│    ⏱️ 18h 32m remaining             │
│                                     │
├─────────────────────────────────────┤
│      How many did you do?           │
│                                     │
│          ┌─────────┐                │
│          │   55    │                │
│          └─────────┘                │
│            reps                     │
│                                     │
│   [📷 Add Proof (Optional)]         │
│                                     │
│       [✓ Complete Tag]              │
└─────────────────────────────────────┘

After Completion:
┌─────────────────────────────────────┐
│           🎉 Nice!                  │
│                                     │
│    You beat Jordan's 50 pushups     │
│    with 55 pushups!                 │
│                                     │
│    🔥 Streak with Jordan: 6 days    │
│                                     │
│   ┌─────────────────────────────┐   │
│   │   🏷️ Tag Back (different    │   │
│   │      exercise)              │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │   🏷️ Tag Someone Else       │   │
│   └─────────────────────────────┘   │
│                                     │
│          [Maybe Later]              │
└─────────────────────────────────────┘
```

---

## Notifications Strategy

### Push Notifications
| Event | Title | Body | Timing |
|-------|-------|------|--------|
| New Tag | "🏷️ {name} tagged you!" | "{exercise} - {value} {unit}. You have 24h!" | Immediate |
| 6h Warning | "⏰ Tag expiring soon!" | "Only 6h left to complete {name}'s {exercise} tag" | 6h before expiry |
| 1h Warning | "🚨 Last chance!" | "1 hour to keep your {X} day streak with {name}!" | 1h before expiry |
| Tag Completed | "💪 {name} beat your tag!" | "They did {value} {exercise}" | Immediate |
| Streak Milestone | "🔥 {X} day streak!" | "You and {name} are on fire!" | On achievement |
| Streak Lost | "💔 Streak ended" | "Your {X} day streak with {name} ended" | On expiry |

### Email Notifications (Digest)
- Daily summary of pending tags
- Weekly streak report
- Opt-in for immediate notifications

### In-App Notifications
- Badge count on tab bar
- Notification center with history
- Inline prompts on home screen

---

## New User Experience

### First Tag Grace Period
- **48 hours** instead of 24 for first-ever tag
- Onboarding tooltip explaining the concept
- Suggested first exercise (easy win)

### Invite Flow
1. User taps "Invite new friend"
2. Native share sheet opens with message:
   ```
   🏷️ [Name] tagged you with [X] [exercise]!

   Can you beat it? Download fyt and find out:
   [deep link with tag ID + invite code]
   ```
3. New user opens link → App Store → Downloads → Opens to pending tag
4. Auto-creates account, shows pending tag immediately

---

## Implementation Phases

### Phase T1: Database & Core Models (2-3 hours)
- [ ] Create `exercises` table with seed data
- [ ] Create `tags`, `tag_recipients`, `streaks` tables
- [ ] Add new columns to `profiles` and `challenges`
- [ ] Create RLS policies for new tables
- [ ] Generate updated TypeScript types
- [ ] Create Legend State observables for tags/exercises/streaks

### Phase T2: Exercise Selection UI (2-3 hours)
- [ ] Create exercise list component with categories
- [ ] Add search/filter functionality
- [ ] Build exercise card with icon, name, type indicator
- [ ] Create selected exercise state

### Phase T3: Tag Creation Flow (3-4 hours)
- [ ] Build tag creation wizard (3 steps)
- [ ] Exercise selection screen
- [ ] Value input screen with optional proof
- [ ] Recipient selection screen (friends, groups, invite)
- [ ] Public/private toggle
- [ ] Create tag in database

### Phase T4: Home Screen Redesign (3-4 hours)
- [ ] Redesign home with streak display
- [ ] Pending tags section with countdown timers
- [ ] Primary "Tag Someone" CTA
- [ ] Recent activity feed
- [ ] Hide other challenge types (keep accessible)

### Phase T5: Tag Completion Flow (2-3 hours)
- [ ] Tag detail screen showing sender's result
- [ ] Completion form with value input
- [ ] Optional proof capture
- [ ] Success screen with tag-back prompt
- [ ] Streak update logic

### Phase T6: Streak System (2-3 hours)
- [ ] Implement streak calculation logic
- [ ] Pair streak tracking
- [ ] Public streak tracking
- [ ] Group streak tracking
- [ ] Streak display components
- [ ] Streak milestone celebrations

### Phase T7: Notifications (3-4 hours)
- [ ] Set up Expo Push Notifications
- [ ] Implement push token registration
- [ ] Create notification triggers (Supabase functions or Edge Functions)
- [ ] 6h and 1h warning notifications
- [ ] In-app notification center

### Phase T8: Invite & Deep Linking (2-3 hours)
- [ ] Native share sheet integration
- [ ] Deep link handling for tag invites
- [ ] New user onboarding with pending tag
- [ ] 48h grace period for new users

---

## Technical Compatibility Notes

### Existing Infrastructure Reuse
- Tags use existing `challenges` table underneath (via `is_tag` flag)
- Existing `completions` table works for tag completions
- Groups integration unchanged
- Auth system unchanged
- Legend State sync architecture unchanged

### Mapping Tags to Challenges
```typescript
// When creating a tag, we also create a challenge record
const createTag = async (tagData) => {
  // 1. Create the tag record
  const tag = await supabase.from('tags').insert({...})

  // 2. Create corresponding challenge (for backwards compatibility)
  const challenge = await supabase.from('challenges').insert({
    title: `${exercise.name} Tag`,
    exercise: exercise.name,
    challenge_type: exercise.type === 'time' ? 'timed' : 'amrap',
    is_tag: true,
    tag_id: tag.id,
    ends_at: tag.expires_at,
    // ... other fields
  })

  // 3. Create tag_recipients
  await supabase.from('tag_recipients').insert(
    recipients.map(r => ({ tag_id: tag.id, recipient_id: r.id }))
  )
}
```

---

## Success Metrics

### Engagement
- Daily Active Tags (sent + completed)
- Average streak length
- Tag completion rate (% completed within 24h)
- Tag-back rate (% who tag back after completing)

### Viral/Growth
- Invites sent per user
- Invite conversion rate
- K-factor (viral coefficient)

### Retention
- D1, D7, D30 retention
- Users with active streak > 7 days
- Streak recovery rate (% who restart after breaking)

---

## Open Questions for Future

1. Should there be a "mercy rule" for very long streaks? (e.g., 2 missed tags before breaking)
2. Should we add exercise difficulty ratings?
3. Should there be seasonal/weekly challenges (curated tags)?
4. Integration with Apple Health / Google Fit for auto-verification?
5. Premium features? (custom exercises, longer proof videos, streak shields)
