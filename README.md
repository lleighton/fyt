# fyt - Claude Code Quickstart

## 🚀 Getting Started

This project is scaffolded and ready for Claude Code to continue development.

### Prerequisites

1. **Node.js 18+** installed
2. **Expo CLI**: `npm install -g expo-cli`
3. **Supabase account** at https://supabase.com

### Setup Steps

```bash
# 1. Navigate to project
cd fyt

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Create Supabase project and add credentials to .env

# 5. Apply database migrations (in Supabase SQL editor)
# Copy contents of supabase/migrations/001_initial_schema.sql

# 6. Generate types
npm run supabase:types

# 7. Start development
npx expo start
```

## 📁 Project Structure

```
.
├── CLAUDE.md                    # Main instructions for Claude Code
├── .claude/
│   ├── plan.md                  # Implementation plan with phases
│   ├── context/
│   │   ├── architecture.md      # System architecture
│   │   └── database.md          # Database schema reference
│   └── agents/
│       ├── code-reviewer.md     # Code review sub-agent
│       └── test-engineer.md     # Test writing sub-agent
├── app/                         # Expo Router pages
├── components/                  # React components
├── lib/                         # Core libraries
│   ├── supabase.ts             # Supabase client
│   └── legend-state/           # State management
├── types/                       # TypeScript types
└── supabase/migrations/        # Database migrations
```

## 🎯 Current Status

**Phase 1: Project Foundation** - IN PROGRESS

See `.claude/plan.md` for full task breakdown.

## 💡 Claude Code Tips

### Starting a Session

```
# Open project and read context
claude

# First prompt:
"Read CLAUDE.md and .claude/plan.md to understand the project.
Then continue with Phase 1 tasks."
```

### Useful Commands

- `/clear` - Clear context between tasks
- `think hard` - Extended reasoning for complex problems
- `@file.ts` - Reference specific files

### Best Practices

1. **Check plan.md** before each session
2. **Update checkboxes** as tasks complete
3. **Run type check** after changes: `npx tsc --noEmit`
4. **Test offline behavior** by toggling network

## 📋 Next Steps for Claude Code

1. Complete Phase 1 remaining tasks:
   - [ ] Verify Tamagui config works
   - [ ] Test MMKV persistence
   - [ ] Confirm Supabase connection

2. Move to Phase 2 (Auth):
   - Set up phone authentication
   - Build login/verify screens
   - Test session persistence

3. Reference `.claude/context/` files for:
   - Architecture decisions
   - Database schema details
   - Component patterns

## 🐛 Troubleshooting

### Metro bundler issues
```bash
npx expo start --clear
```

### Type errors after schema change
```bash
npm run supabase:types
```

### MMKV issues on iOS simulator
```bash
cd ios && pod install && cd ..
npx expo run:ios
```

---

Happy coding! 🏋️‍♂️💪
# fyt
