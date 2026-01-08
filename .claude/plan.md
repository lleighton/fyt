# fyt Implementation Plan

## Problem Statement
Users want a fun, social way to stay active throughout the day with quick fitness challenges they can do anywhere. Current fitness apps are either too serious, too complex, or lack the social accountability that drives engagement.

## Objective
Build an MVP social fitness app where users can:
1. Sign up with phone number
2. Create quick fitness challenges
3. Tag friends to participate
4. Log completions with proof
5. See leaderboards and activity history
6. Get Duolingo-style engagement nudges

## Success Metrics
- User can complete full signup → create challenge → invite friend → log completion flow
- App works offline and syncs when back online
- Real-time updates when friends complete challenges
- GitHub-style activity grid displays correctly

---

## Phase 1: Project Foundation
**Status**: COMPLETED
**Estimated Duration**: 2-3 hours
**Completed**: 2025-11-27

### Tasks
- [x] Initialize Expo project with TypeScript template
- [x] Install and configure Tamagui
- [x] Install and configure Legend State with MMKV
- [x] Set up Supabase client
- [x] Create base folder structure
- [x] Configure TypeScript strict mode
- [x] Set up ESLint and Prettier
- [x] Create environment variable handling
- [x] Verify dev server starts successfully

### Acceptance Criteria
- ✓ `npx expo start` runs without errors
- ✓ Tamagui theme provider wraps app
- ✓ Legend State persistence configured with MMKV
- ✓ Supabase client configured with publishable key

### Notes
- Fixed environment variable mismatch (PUBLISHABLE_KEY vs ANON_KEY)
- Resolved TypeScript type issues with Legend State sync configuration
- Created placeholder login screen for Phase 2 auth implementation
- All dependencies installed successfully

---

## Phase 2: Database & Authentication
**Status**: COMPLETED
**Estimated Duration**: 3-4 hours
**Completed**: 2025-11-27

### Tasks
- [x] Create Supabase project (manual step - document instructions)
- [x] Design and apply database schema (SQL in `supabase/migrations/`)
- [x] Enable Row Level Security policies
- [x] Configure phone auth in Supabase dashboard (requires manual setup)
- [x] Generate TypeScript types from schema
- [x] Create auth context and hooks (auth$ observable in store)
- [x] Build phone verification UI flow
- [x] Implement session persistence (via AsyncStorage)
- [x] Add auth state listener for deep linking

### Acceptance Criteria
- ✓ User can sign up with phone number
- ✓ OTP verification works
- ✓ Session persists across app restart
- ✓ RLS defined in schema

### Notes
- Database schema created with all required tables: profiles, challenges, completions, groups, etc.
- TypeScript types generated in types/database.types.ts
- Auth observable configured with session persistence
- Login screen with full OTP flow:
  - Step 1: User enters phone number → Supabase sends OTP
  - Step 2: User enters 6-digit code → Verifies and creates session
  - Auto-creates profile on first login
  - Allows changing phone number if wrong
- **Note**: Supabase phone auth requires SMS provider configuration in dashboard

---

## Phase 3: Core State Management
**Status**: COMPLETED
**Estimated Duration**: 3-4 hours
**Completed**: 2025-11-27

### Tasks
- [x] Configure Legend State global settings
- [x] Create syncedSupabase observables for:
  - [x] profiles
  - [x] challenges
  - [x] completions
  - [x] groups
  - [x] challenge_participants
- [x] Implement offline queue with retrySync
- [x] Add sync status indicators
- [x] Create computed observables (streak, activity grid)
- [ ] Write unit tests for state logic

### Acceptance Criteria
- ✓ Data persists locally with MMKV
- ✓ Changes sync to Supabase when online
- ✓ Offline changes queue and retry configured
- ✓ Real-time updates enabled

### Notes
- Global sync config in lib/legend-state/config.ts with MMKV persistence
- All syncedSupabase observables created in lib/legend-state/store.ts
- Computed observables for activityGrid, currentStreak, and challengesByType
- SyncIndicator component shows sync status
- Retry logic configured with exponential backoff
- Unit tests remain as future enhancement

---

## Phase 4: Navigation & Layout
**Status**: COMPLETED
**Estimated Duration**: 2-3 hours
**Completed**: 2025-11-27

### Tasks
- [x] Set up Expo Router file structure
- [x] Create tab navigator (Home, Challenges, Leaderboard, Profile)
- [x] Implement auth-gated routing
- [x] Design and build common layout components:
  - [x] Header
  - [x] TabBar (styled with Tamagui theme)
  - [x] SafeAreaWrapper
- [x] Add loading states and skeletons

### Acceptance Criteria
- ✓ Unauthenticated users see login screen
- ✓ Authenticated users see tab navigation
- ✓ Auth-gated routing works
- ✓ Smooth transitions configured

### Notes
- File structure: app/(auth)/(tabs) for authenticated, app/(public) for login
- **Home tab (index.tsx)**: Activity grid, streak badge, recent challenges, quick actions
- **Challenges tab (challenges.tsx)**: Active/Completed tabs, challenge cards with time remaining, participant counts
- **Leaderboard tab (leaderboard.tsx)**: Rankings by completions and streak, medal icons for top 3, highlights current user
- **Profile tab (profile.tsx)**: User info with editable display name, stats grid (completions, streaks), settings, sign out
- Auth layout redirects to login when not authenticated
- Loading spinner shown while auth state loads
- TabBar styled with Tamagui theme colors and Lucide icons

### Settings System (Implemented)
Full settings system discovered during audit:
- **Core file**: `lib/settings-context.tsx` - MMKV-backed persistent settings
- **Theme**: Light/Dark/System with real-time OS detection
- **Notifications**: 5 granular toggles (enabled, tagReceived, groupInvites, challengeReminders, streakAlerts)
- **Preferences**: Units (metric/imperial), default tag duration (12/24/48h), haptic feedback toggle
- **Hooks**: `useSettings()`, `useEffectiveTheme()`, `getSettingsSync()`
- **UI**: Full settings interface on profile screen with expandable sections

---

## Phase 5: Challenge Creation Flow
**Status**: COMPLETED
**Estimated Duration**: 4-5 hours
**Completed**: 2025-11-27

### Tasks
- [x] Build challenge type selector (AMRAP, Max Effort, Timed, Distance)
- [x] Build exercise input with suggestions
- [x] Create challenge configuration form
- [x] Implement friend tagging UI (placeholder for future contact integration)
- [ ] Add contact picker integration (deferred)
- [x] Build challenge preview screen
- [x] Create challenge with database insert
- [ ] Send invitations (deferred - requires phone lookup system)

### Acceptance Criteria
- ✓ User can create any challenge type
- ✓ Challenge configuration is flexible
- ✓ Challenge is created and stored in database
- ⏳ Friend invitations (UI ready, backend needed)

### Notes
- **Multi-step flow**: Type selection → Exercise → Details → Invite friends
- **4 challenge types** with icons: AMRAP (⚡), Max Effort (🏋️), Timed (⏱️), Distance (📏)
- **Exercise suggestions**: Quick-pick common exercises
- **Type-specific config**: Time limits for AMRAP, target reps for Timed
- **Preview card**: Shows challenge before creation
- **Database integration**: Inserts challenge and creator as first participant
- **Friend invitations**: UI placeholder (requires contact sync or phone lookup system)

---

## Phase 6: Challenge Participation
**Status**: MOSTLY COMPLETE
**Estimated Duration**: 4-5 hours

### Tasks
- [x] Build challenge detail screen
- [x] Show participants and their progress
- [x] Create completion logging UI
- [x] Implement proof capture (camera integration) - via `useImageUpload` hook
- [x] Build completion confirmation with haptics - via `settings-context` haptic system
- [ ] Add celebration animations (Lottie) - dependency installed, not yet integrated
- [x] Real-time participant updates (via Legend State)

### Acceptance Criteria
- ✓ Can view all challenge details
- ✓ Can log completion with reps/weight/time
- ✓ Photo proof uploads available (via image picker)
- ✓ Haptic feedback on completion
- ✓ See others' completions in leaderboard
- ⏳ Animated celebrations (Lottie installed but unused)

### Notes
- **Challenge detail screen** with header, stats, and leaderboard
- **Stats cards**: Participant count, total completions
- **Log completion**: Inline form with value input and unit display
- **Leaderboard**: Ranked by best value, shows completion count
- **Ranking indicators**: Gold/silver/bronze for top 3
- **Current user highlight**: Blue border on user's row
- **Camera/Image proof**: Full implementation in `lib/hooks/useImageUpload.ts`
- **Haptics**: Full implementation in `lib/settings-context.tsx` with user preference toggle
- **Celebration**: Lottie dependency ready, needs integration for animated celebrations

---

## Phase 7: Leaderboards & Progress
**Status**: COMPLETED
**Estimated Duration**: 3-4 hours
**Completed**: 2025-11-27

### Tasks
- [x] Build challenge leaderboard component (in challenge detail screen)
- [x] Build global leaderboard screen (leaderboard tab)
- [x] Create GitHub-style activity grid (home screen)
- [x] Implement streak tracking UI (home screen, profile)
- [x] Add personal stats dashboard (profile tab)
- [ ] Build progress charts (deferred - basic stats sufficient for MVP)

### Acceptance Criteria
- ✓ Leaderboards update in real-time (via Legend State)
- ✓ Activity grid shows 365 days
- ✓ Streak count is accurate
- ✓ Stats are visually engaging

### Notes
- Most Phase 7 components were already implemented in Phases 4 and 6
- **Challenge leaderboard**: Built into challenge detail screen with ranking, medals, completion counts
- **Global leaderboard**: Leaderboard tab with sortable views (completions, streaks)
- **Activity grid**: GitHub-style 365-day grid on home screen
- **Streak tracking**: Current streak on home + longest streak on profile
- **Stats dashboard**: Profile tab with completions, streaks, challenges won
- **Charts deferred**: Basic stats cards sufficient for MVP, charts can be added later

---

## Phase 8: Groups & Social
**Status**: COMPLETED
**Estimated Duration**: 3-4 hours
**Completed**: 2025-11-27

### Tasks
- [x] Build group creation flow
- [x] Implement invite code generation
- [x] Create group detail screen
- [x] Build group join flow with invite code
- [x] Add group navigation to home screen
- [x] Create dedicated Groups tab
- [x] Add deep linking for group invites
- [ ] Build group leaderboard (placeholder added)
- [ ] Add group challenge creation (navigation ready)
- [ ] Implement group activity feed (placeholder added)

### Acceptance Criteria
- ✓ Can create public/private groups
- ✓ Invite codes work for joining
- ✓ Group detail shows members and info
- ✓ Deep links auto-open join flow with code
- ✓ Dedicated Groups tab for viewing all user's groups
- ⏳ Group challenges (navigation ready, needs scoping logic)
- ⏳ Activity feed (placeholder UI)

### Notes
- **Group Creation** (`/(auth)/group/create`):
  - Name, description, privacy toggle
  - Auto-generates 6-character invite code
  - Private/public group options
  - Creator automatically added as admin
- **Group Detail** (`/(auth)/group/[id]`):
  - Group info, avatar, stats
  - Member list with role badges (crown for admins)
  - Invite code display with copy/share
  - Tabs: Members, Leaderboard (placeholder), Activity (placeholder)
  - "Create Group Challenge" button
- **Join Group** (`/(auth)/group/join`):
  - 6-character invite code input
  - Validates code and checks membership
  - Adds user as member role
  - Auto-populates from deep link params
- **Groups Tab** (`/(auth)/(tabs)/groups.tsx`):
  - List of all user's groups
  - Empty state with create/join actions
  - Admin badge (crown icon) for admin groups
  - Shows member count, privacy status
- **Deep Linking**: `fyt://group/join?code=ABC123` auto-opens join screen
- **Tab Layout**: 5 tabs (Home, Challenges, Groups, Leaderboard, Profile)

### Architecture Analysis (2025-12-11)
Conducted deep analysis of group/challenge/leaderboard relationships:

**Findings:**
1. ❌ **Group Challenge Scoping**: Database field `challenges.group_id` exists but is never set. All challenges are global.
2. ❌ **Group Leaderboards**: No group-filtered leaderboards exist. Current leaderboard is global only.
3. ⚠️ **Member Count**: Field exists (`groups.member_count`) but no trigger/RPC to maintain it.
4. ⚠️ **Admin Permissions**: Role system exists (`group_members.role`), UI shows badges, but no management interface.

**Missing Features:**
- Challenge creation doesn't accept/use `groupId` parameter
- No visibility filtering for group challenges
- No group leaderboard views/queries
- No member management UI (remove, promote/demote)
- No database trigger for auto-updating `member_count`

---

## Phase 8.5: Group-Challenge Integration
**Status**: IN PROGRESS
**Estimated Duration**: 4-5 hours
**Started**: 2025-12-11

### Implementation Plan

#### Part 1: Group Challenge Scoping (HIGH PRIORITY)
- [ ] Update challenge creation to accept `groupId` URL parameter
- [ ] Set `challenges.group_id` when creating from group detail page
- [ ] Add group membership filter to challenge queries
- [ ] Filter challenges list by group membership
- [ ] Add group badge/indicator to challenge cards
- [ ] Show "group challenges" section in group detail page

#### Part 2: Group Leaderboards (HIGH PRIORITY)
- [ ] Create database view for group leaderboards:
  - Total completions per member
  - Average performance per member
  - Group ranking by total points
- [ ] Implement group leaderboard UI in group detail page
- [ ] Show both individual and aggregate stats
- [ ] Add time period filters (week, month, all-time)

#### Part 3: Member Management (MEDIUM PRIORITY)
- [ ] Create group settings screen
- [ ] Implement member management UI:
  - Remove member (admins only)
  - Promote to admin (admins only)
  - Demote from admin (admins only)
- [ ] Add "Leave Group" for regular members
- [ ] Add "Delete Group" for creators (with confirmation)
- [ ] Add member activity tracking

#### Part 4: Database Maintenance (LOW PRIORITY)
- [ ] Create database trigger for `member_count` auto-update
- [ ] Create database trigger for `participant_count` auto-update
- [ ] Add RPC function for bulk member operations
- [ ] Add indexes for group-filtered queries

### Acceptance Criteria
- ✓ Challenges created from groups are scoped to that group
- ✓ Only group members can see group challenges
- ✓ Group leaderboards show aggregate member stats
- ✓ Admins can manage group members
- ✓ Member counts auto-update via triggers

### Technical Notes
- **Group Challenge Flow**: Group detail → Create Challenge → Challenge has `group_id` → Only members see it
- **Filtering Logic**: Legend State sync can filter by `group_id`, but need to check user membership first
- **Leaderboard View**: Aggregate `completions` joined with `group_members` for group-specific rankings
- **Member Count Trigger**: PostgreSQL trigger on `group_members` INSERT/DELETE to update `groups.member_count`

---

## Phase 8.6: Motivation Rebalancing
**Status**: IN PROGRESS
**Priority**: HIGH (Core UX philosophy shift)
**Started**: 2026-01-07

### Strategic Context

Current implementation leans heavily competitive ("beat or lose" framing). This risks alienating users who:
- Can't match others' rep counts (beginners, different fitness levels)
- Are motivated by habit formation, not competition
- Feel discouraged when "losing" despite showing up

**Philosophy shift**: Completion is the win. Beating is a bonus achievement.

### Part 1: Completion Celebration (HIGH PRIORITY)

#### Language & Copy Updates
- [x] Change "BEAT IT!" badge → "DONE!" (primary) + "CRUSHED IT!" (if exceeded)
- [x] Update tag prompt: "Beat this" → "Can you match this?"
- [x] Change success message: "You Beat It!" → "Done!" / "Crushed It!"
- [x] Add encouraging copy for matching (not just beating): "Nice work completing the challenge!"

#### Visual Hierarchy Updates
- [x] Completion = blue badge (primary success state)
- [x] Beat target = green badge (bonus achievement)
- [ ] Personal record = purple/special badge (self-improvement) - showing in UI
- [x] Remove coral "merely matched" distinction - all completions now celebrated equally

#### Tag Detail Screen (`app/(auth)/tag/[id]/respond.tsx`)
- [x] Show "Done!" as primary status, "Crushed It!" if exceeded
- [ ] Add confetti/celebration for ALL completions, extra flair for beating (needs Lottie)
- [x] Display personal history: "Your best: X" shown in tag response screen

### Part 2: Personal Progress Tracking (HIGH PRIORITY)

#### New Data Model
- [x] Track personal bests per exercise in new `personal_records` table
- [x] Store completion history per exercise for trend tracking
- [x] Calculate improvement metrics (vs last attempt, vs personal best)
- [x] Database migration: `042_add_personal_records.sql`

#### UI Integration
- [x] Show "vs your last" on completion: "+X from your previous best!"
- [x] Personal record notifications: "New PR!" in success alert
- [x] Progress indicator on tag response: show "Your best: X" below target
- [ ] Home screen widget: "Recent PRs" or "Improvement streak" (future)

#### Tag Completion Flow Updates
- [x] After logging completion, show three outcomes:
  1. "Done!" / "Crushed It!" (always)
  2. "Exceeded target by X!" (if applicable)
  3. "New PR! +X from previous best" (if applicable)
- [x] Prioritize self-improvement message over competitive message

### Part 3: Leaderboard Reframing (MEDIUM PRIORITY)

#### Global Leaderboard (`app/(auth)/(tabs)/leaderboard.tsx`)
- [x] Rename "Win Rate" tab → "Response" (% of received tags completed)
- [x] Rename "Beaten" tab → "Completed"
- [x] Update row labels from "beaten" to "completed"
- [x] Update CTA text: "climb the leaderboard" → "stay accountable together"
- [ ] Add "Consistency" tab: streak length, completion frequency (future)
- [ ] De-emphasize medals for top 3 (smaller icons, less color contrast) (future)
- [ ] Add "Your Stats" section at top showing personal metrics before rankings (future)

#### Group Leaderboards
- [ ] Add "Team Total" prominent display (collective achievement)
- [ ] Show "X tags completed this week as a group"
- [ ] Optional: Add non-ranked "Activity" view alongside competitive rankings

### Part 4: Encouragement Mechanisms (MEDIUM PRIORITY)

#### For Lower Performers
- [ ] "Improvement badges": Celebrate consistency even at lower rep counts (future)
- [ ] "Showing up" streak: Separate from activity streak, just for responding to tags (future)
- [x] Suggested scaling: Shows "Tip: Try for X to set a new PR!" when PR < target

#### Supportive Copy Throughout
- [x] Empty states: Updated to be more encouraging
- [x] Tag expiry: "Ended" → "Completed/Finished/Time ran out" (neutral, not punishing)
- [ ] Low completion: "Keep going!" not silent judgment (future)

#### Social Encouragement
- [ ] Allow reactions on completions (fire, clap, muscle emoji) (future)
- [ ] "Cheer" button to send encouragement to pending tags (future)
- [ ] Group celebration when all members complete a tag (future)

### Part 5: Smart Defaults (LOW PRIORITY)

#### Adaptive Framing
- [ ] Track user behavior: Do they check leaderboards? Chase PRs?
- [ ] Subtly adjust home screen emphasis based on engagement patterns
- [ ] Show "Your Progress" more prominently for consistency-focused users
- [ ] Show "Rankings" more prominently for competition-focused users

### Acceptance Criteria
- All completions feel like wins (not just beating the target)
- Personal progress is visible and celebrated
- Leaderboards available but not the primary frame
- Language throughout is encouraging, not punishing
- Users with lower rep counts still feel motivated to participate

### Files Affected
- `app/(auth)/tag/[id]/index.tsx` - Tag detail & completion
- `app/(auth)/(tabs)/tags.tsx` - Tags list badges
- `app/(auth)/(tabs)/leaderboard.tsx` - Metric reframing
- `app/(auth)/group/[id].tsx` - Group leaderboard
- `components/` - Badge components, celebration animations
- `lib/legend-state/store.ts` - Personal records tracking

### Success Metrics
- Completion rate increases (more people finish tags, even if not beating)
- Streak lengths increase (people stay engaged longer)
- Retention improves for users who rarely "win" competitively
- Qualitative: Users report feeling encouraged, not defeated

---

## Phase 9: Notifications & Engagement
**Status**: MOSTLY COMPLETE
**Completed**: 2026-01-07 (discovered during audit)

### Tasks
- [x] Set up Expo Notifications - `lib/notifications.ts`
- [x] Request notification permissions - with graceful fallback
- [x] Implement push token registration - saves to `profiles.push_token`
- [x] Create notification handlers - foreground/background handling
- [ ] Build Duolingo-style reminder logic - scheduled notifications pending
- [ ] Add in-app notification center - UI pending

### Acceptance Criteria
- ✓ Push notifications arrive (infrastructure complete)
- ⏳ Streak risk reminders (needs scheduled notification triggers)
- ✓ Challenge invites can notify users (push tokens available)
- ✓ Can manage notification preferences (5 toggles in settings)

### Implementation Details
- **Core file**: `lib/notifications.ts` - complete notification lifecycle
- **Database**: `supabase/migrations/023_add_push_notifications.sql`
- **Settings**: 5 granular toggles (enabled, tagReceived, groupInvites, challengeReminders, streakAlerts)
- **Android**: Custom notification channel with vibration patterns
- **Deep linking**: Notification taps route to relevant screens
- **RPC**: `get_group_member_push_tokens` for batch sending

### Remaining Work
- Scheduled reminder notifications (streak warnings, daily nudges)
- In-app notification center/history UI
- Server-side push trigger integration (Edge Functions or backend)

---

## Phase 10: Polish & Launch Prep
**Status**: NOT STARTED
**Estimated Duration**: 3-4 hours

### Tasks
- [ ] Audit and improve animations
- [ ] Performance optimization pass
- [ ] Accessibility audit (VoiceOver, TalkBack)
- [ ] Error boundary implementation
- [ ] Crash reporting setup (Sentry)
- [ ] App store assets preparation
- [ ] Final QA testing

### Acceptance Criteria
- 60fps animations
- App loads in <2 seconds
- Accessibility score >90%
- No crashes in happy path

---

## Progress Log

| Date | Phase | Tasks Completed | Notes |
|------|-------|-----------------|-------|
| 2025-11-27 | Phase 1 | 9/9 | ✅ Project foundation complete. Fixed env vars, installed deps, resolved TypeScript errors |
| 2025-11-27 | Phase 2 | 9/9 | ✅ Full phone auth with OTP verification implemented |
| 2025-11-27 | Phase 3 | 8/9 | ✅ State management complete. Unit tests pending |
| 2025-11-27 | Phase 4 | 7/7 | ✅ All 4 tabs complete with full navigation |
| 2025-11-27 | Phase 5 | 6/8 | ✅ Challenge creation flow complete. Contact picker & invitations deferred |
| 2025-11-27 | Phase 6 | 6/7 | ✅ Camera/haptics implemented. Only Lottie animations remaining |
| 2025-11-27 | Phase 7 | 6/6 | ✅ Leaderboards mostly complete (activity grid, stats already in tabs) |
| 2025-11-27 | Phase 8 | 5/8 | ✅ Groups core complete. Group leaderboard & activity feed placeholders |
| 2026-01-07 | Phase 8.6 | 18/20 | 🚧 Parts 1-4 implemented: language, PR tracking, leaderboard, encouragement |
| 2026-01-07 | Phase 9 | 4/6 | ✅ Notifications infrastructure complete (discovered in audit). Reminders & UI pending |
| 2026-01-07 | Audit | - | 📋 Codebase audit revealed: settings system, haptics, camera, deep linking all implemented |

## Next Steps
1. **PRIORITY: Phase 8.6** - Motivation Rebalancing (completion celebration, personal progress, leaderboard reframing)
2. **Phase 8.5**: Complete Group-Challenge Integration (in progress)
3. **Phase 6 remaining**: Lottie celebration animations (dependency installed, needs integration)
4. **Phase 9 remaining**: Scheduled reminders (streak warnings), in-app notification center UI
5. **Phase 10**: Final polish & launch prep
6. **Future**: Unit tests, contact picker integration, group activity feed

## Implementation Status Summary (Post-Audit)
| Component | Status | Notes |
|-----------|--------|-------|
| Notifications | ✅ Infrastructure done | Needs scheduled triggers & notification center UI |
| Settings | ✅ Complete | Theme, haptics, notification prefs, units |
| Haptics | ✅ Complete | 6 feedback types, user preference toggle |
| Camera/Image | ✅ Complete | Full upload pipeline for avatars/proof |
| Deep Linking | ✅ Complete | Auth callbacks + group invites |
| Theme System | ✅ Complete | Light/dark/system with live switching |
| Contact Picker | ⚠️ Configured only | Dependency + permissions, no integration |
| Lottie Animations | ⚠️ Dependency only | Installed but unused |