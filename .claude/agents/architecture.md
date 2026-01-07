# Architecture Context

## System Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                            fyt App                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Tamagui   │  │ Expo Router │  │   Legend    │              │
│  │  (UI/Theme) │  │ (Navigation)│  │   State     │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                   ┌──────▼──────┐                                │
│                   │    MMKV     │ ◄── Offline Persistence        │
│                   │  (Local DB) │                                │
│                   └──────┬──────┘                                │
│                          │                                       │
│                   ┌──────▼──────┐                                │
│                   │ syncedSupa  │ ◄── Bidirectional Sync         │
│                   │   base      │                                │
│                   └──────┬──────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Supabase   │
                    │  (Backend)  │
                    ├─────────────┤
                    │ • Postgres  │
                    │ • Auth      │
                    │ • Realtime  │
                    │ • Storage   │
                    │ • Edge Fn   │
                    └─────────────┘
```

## Data Flow

### Offline-First Pattern
```
User Action → Observable.set() → MMKV (instant) → UI Updates
                                      ↓
                              Sync Queue (if offline)
                                      ↓
                              Supabase (when online)
                                      ↓
                              Realtime → Other Clients
```

### Read Flow
```
Component mounts → observable.get() → 
  1. Return cached MMKV data immediately
  2. Fetch from Supabase in background
  3. Merge updates into observable
  4. UI re-renders automatically
```

## Directory Structure
```
fyt/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Auth-required routes
│   │   ├── (tabs)/               # Bottom tab navigator
│   │   │   ├── _layout.tsx       # Tab configuration
│   │   │   ├── index.tsx         # Home/Feed
│   │   │   ├── challenges.tsx    # My Challenges
│   │   │   ├── leaderboard.tsx   # Rankings
│   │   │   └── profile.tsx       # User Profile
│   │   ├── challenge/
│   │   │   ├── [id].tsx          # Challenge detail
│   │   │   └── create.tsx        # Create challenge
│   │   └── group/
│   │       └── [id].tsx          # Group detail
│   ├── (public)/                 # Public routes
│   │   ├── login.tsx             # Phone login
│   │   └── verify.tsx            # OTP verification
│   ├── _layout.tsx               # Root layout + providers
│   └── +not-found.tsx            # 404 page
│
├── components/
│   ├── ui/                       # Base UI components
│   ├── challenges/
│   ├── leaderboard/
│   └── activity/
│
├── lib/
│   ├── supabase.ts               # Supabase client config
│   └── legend-state/
│       ├── config.ts             # Legend State global config
│       ├── store.ts              # Main observable store
│       └── computed.ts           # Derived state
│
├── hooks/
├── types/
├── constants/
└── supabase/migrations/
```

## Key Patterns

### 1. Observable Component Pattern
```typescript
import { observer } from '@legendapp/state/react'
import { store$ } from '@/lib/legend-state/store'

export const ChallengeList = observer(() => {
  const challenges = store$.challenges.get()
  
  return (
    <YStack>
      {Object.values(challenges).map(challenge => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </YStack>
  )
})
```

### 2. Optimistic Update Pattern
```typescript
import { v4 as uuidv4 } from 'uuid'
import { store$ } from '@/lib/legend-state/store'

export function createCompletion(challengeId: string, value: number) {
  const id = uuidv4()
  
  store$.completions[id].set({
    id,
    challenge_id: challengeId,
    user_id: store$.profile.id.get(),
    value,
    completed_at: new Date().toISOString(),
    created_at: null,
    updated_at: null,
    deleted: false,
  })
  
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
}
```

### 3. Sync Status Pattern
```typescript
import { syncState } from '@legendapp/state'
import { store$ } from '@/lib/legend-state/store'

export const SyncIndicator = observer(() => {
  const state = syncState(store$.completions)
  
  if (state.isSyncing.get()) return <Spinner />
  if (state.error.get()) return <ErrorIcon />
  return <CheckIcon />
})
```

### 4. Auth Guard Pattern
```typescript
// app/(auth)/_layout.tsx
import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'

export default function AuthLayout() {
  const { session, isLoading } = useAuth()
  
  if (isLoading) return <LoadingScreen />
  if (!session) return <Redirect href="/login" />
  
  return <Stack />
}
```

## Security Model

### Row Level Security
- Users can only read/write their own data
- Public challenges visible to all
- Private challenges visible to participants only
- Group data visible to members only

### Auth Flow
1. User enters phone number
2. Supabase sends OTP via SMS
3. User enters OTP
4. Session created and persisted
5. Phone number becomes unique identifier