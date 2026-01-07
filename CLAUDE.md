# fyt - Social Fitness App

## Project Overview
A social fitness app for short burst challenges. Users tag friends via phone number to compete in quick fitness challenges (AMRAP pushups, max effort bench, timed sprints, etc.). Think "HYROX meets Duolingo meets GitHub contribution graphs."

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
- ALWAYS use phone auth for user identification
- ALWAYS persist pending changes for offline retry
- NEVER skip the `observer()` wrapper for reactive components
- ALWAYS run `npx tsc --noEmit` before committing

## Current Phase
See `.claude/plan.md` for implementation phases and current progress.
