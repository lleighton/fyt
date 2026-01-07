# Database Schema Reference

## Tables Overview

- `profiles` - User data (extends auth.users)
- `challenges` - Challenge definitions
- `challenge_participants` - Who's in which challenge
- `completions` - Workout logs
- `groups` - Teams/friend groups
- `group_members` - Group membership

## Key Relationships
```
profiles ─┬── challenges (creator_id)
          ├── completions (user_id)
          ├── challenge_participants (user_id)
          └── group_members (user_id)

challenges ─┬── challenge_participants
            └── completions

groups ─── group_members
```

## Type Definitions

After applying schema, generate types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

## Real-time Subscriptions

Enabled for: `challenges`, `completions`, `groups`, `group_members`, `challenge_participants`
```

---

Create this structure:
```
.claude/
├── plan.md
├── agents/
│   ├── code-reviewer.md
│   └── test-engineer.md
└── context/
    ├── architecture.md
    └── database.md