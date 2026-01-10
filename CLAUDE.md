# fyt - Social Fitness App

## Project Overview
A social fitness app for short burst challenges. Users tag friends to compete in quick fitness challenges (AMRAP pushups, max effort bench, timed sprints, etc.). Think "HYROX meets Duolingo meets GitHub contribution graphs."

## Current Implementation Phase
See `.claude/plan.md` for the consolidated pre-launch implementation plan with priorities P0-P4.

## Tech Stack
- **Framework**: Expo + React Native (SDK 54)
- **UI**: Tamagui (animations, theming, premium feel)
- **State**: Legend State with MMKV (offline-first)
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **Navigation**: Expo Router (file-based)

## Bash Commands
```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator  
npx expo run:android

# Generate Supabase types
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > types/database.types.ts

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Code Style
- Use TypeScript strict mode
- Use ES modules (import/export), never CommonJS
- Destructure imports: `import { useState, useEffect } from 'react'`
- Use functional components with hooks
- Use `observer` wrapper from Legend State for reactive components
- Prefer named exports over default exports
- File naming: kebab-case for files, PascalCase for components
- Use Tamagui's `$` prefix tokens for styling: `$background`, `$color`, `$space.4`

## Architecture Patterns
- **Feature-based structure**: Group by feature, not by type
- **Colocation**: Keep related files together (component + styles + tests)
- **Barrel exports**: Use index.ts files for clean imports
- **Offline-first**: All data operations go through Legend State observables
- **Optimistic updates**: UI updates immediately, syncs in background

## State Management Rules
- All Supabase data flows through Legend State `syncedSupabase`
- Use `observer()` wrapper for components that read from observables
- Access observable values with `.get()` inside observer components
- Set values with `.set()` - this automatically triggers sync
- Use `syncState()` to check sync status (loading, error, syncing)

## Testing Strategy
- Unit tests with Jest for utilities and helpers
- Component tests with React Native Testing Library
- Integration tests for Legend State sync logic
- E2E tests with Detox (future phase)

## Git Workflow
- Branch naming: `feature/description`, `fix/description`, `chore/description`
- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- PRs require passing CI checks before merge
- Squash merge to main

## Environment Variables
Required in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Critical Constraints
- NEVER commit API keys or secrets
- ALWAYS use email auth for user identification (NO phone auth in current release)
- ALWAYS persist pending changes for offline retry
- NEVER skip the `observer()` wrapper for reactive components
- ALWAYS run `npx tsc --noEmit` before committing

## UI Patterns & Components

### Modals & Sheets
- Use Tamagui `Sheet` for bottom sheets (settings, confirmations, pickers)
- Use Tamagui `Dialog` for alerts and confirmations
- Avoid React Native Modal - use Tamagui equivalents

### Navigation
- Use Expo Router `Link` and `router.push()` for navigation
- Stack screens for detail views, tabs for main sections
- Pass params via URL: `router.push(\`/tag/\${id}\`)`

### Forms
- Use Tamagui `Input`, `TextArea`, `Switch`, `Select`
- Validate on blur, show inline errors
- Use `Controller` from react-hook-form if complex validation needed

### Lists & Cards
- Use `FlatList` for long lists (not ScrollView with map)
- Use existing card components in `components/ui/`
- Consistent spacing with Tamagui tokens: `$space.3`, `$space.4`

### Loading States
- Use skeleton loaders for content areas
- Use spinner for actions (buttons, submissions)
- Show `SyncIndicator` for offline/sync status

### Animations
- Use Tamagui `Animation` for micro-interactions
- Use Lottie for celebrations (completions, PRs, streaks)
- Source Lottie files from LottieFiles.com (free assets)

### Empty States
- Always provide empty state UI with action prompt
- Use `EmptyState` component from `components/ui/`

## Domain Configuration
- Web domain: `fyt.it.com`
- Deep link scheme: `fyt://`
- Invite links format: `https://fyt.it.com/i/{code}`
