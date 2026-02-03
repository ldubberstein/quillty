# CLAUDE.md — Engineering & Testing Contract (Quillty)

This file is the **source of truth** for how changes should be made in this repo.

## 0) Non‑negotiables
- **Follow existing repo conventions over personal preference.**
- **Do not make edits until you complete the Pre‑Change Check (Section 1).**
- Prefer **small, reviewable diffs**. Avoid style-only churn.
- **Preserve behavior** unless the request explicitly changes it. Call out any behavior change.

---

## 1) Pre‑Change Check (REQUIRED before any edits)
Before editing any file:
1. **Locate similar code** in the same feature area and match its:
   - file structure, naming, exports
   - hook patterns, state management style (React Query)
   - error handling/logging patterns
2. Review repo configs:
   - `package.json` scripts (root and per-package)
   - `turbo.json` for task orchestration
   - Vitest configs (`vitest.config.ts` in each package)
   - ESLint/Prettier/TypeScript configs (`.eslintrc.js`, `.prettierrc`, `tsconfig.json`)
3. Identify what you will change:
   - list **exact files** you expect to touch
   - note any conventions you will follow (bullet list)
4. If conventions are unclear:
   - choose the **least surprising** approach consistent with nearby code
   - if still ambiguous, **ask a question before editing**

**Stop after this summary and wait for explicit "OK, proceed"** when the change is broad or risky.

---

## 2) Project Structure

This is a **pnpm monorepo** using Turborepo:

```
quillty/
├── apps/
│   ├── mobile/          # Expo React Native app (expo-router)
│   └── web/             # Next.js web app
├── packages/
│   ├── core/            # Pure business logic (PatternDesigner, BlockDesigner, calculations)
│   ├── api/             # React Query hooks + Supabase client
│   ├── ui/              # Shared cross-platform UI components (Nativewind)
│   └── config/          # Shared ESLint/TypeScript configs
└── supabase/            # Database migrations and snippets
```

### Key Dependencies
- **State Management**: React Query (`@tanstack/react-query`)
- **Database**: Supabase (`@supabase/supabase-js`)
- **Styling**: Nativewind (Tailwind for React Native)
- **Routing**: Expo Router (mobile), Next.js App Router (web)
- **Validation**: Zod

---

## 3) Implementation Rules
- Keep changes **minimal** and localized.
- Prefer **pure functions** and explicit types for reusable logic.
- Do not introduce new patterns (state mgmt, DI frameworks, architectural rewrites) without approval.
- Avoid deep mocking of internal modules; mock **only at boundaries**.
- Use workspace packages (`@quillty/core`, `@quillty/api`, `@quillty/ui`) for shared code.

---

## 4) Unit Testing Standards (Vitest + React Testing Library)

### What to test
- Prioritize **domain/services/state** logic (highest ROI).
- For UI, test **user-visible behavior**:
  - loading / error / empty / success states
  - primary interactions (tap/type/submit)
  - critical conditional rendering

### Determinism requirements
- No real network: mock the Supabase client boundary.
- No real time: freeze time / use fake timers when needed.
- No randomness unless seeded.
- Avoid filesystem writes (use temp dirs/mocks if unavoidable).

### Mocking policy
- Mock **external boundaries** only:
  - Supabase client (`packages/api/src/client.ts`)
  - Storage, native modules, time, UUID
- Do **not** mock the module under test or internal helpers just to satisfy coverage.
- Use `vi.hoisted()` for mocks that need to be referenced in `vi.mock()`.

### Test style
- Arrange → Act → Assert.
- Prefer clear expectations over snapshots.
- Use table-driven tests for reducers/selectors/transforms where it improves clarity.

### Test file locations
- Co-locate tests with source: `*.test.ts` / `*.test.tsx` next to the file being tested.

---

## 5) Coverage Targets (tiered)
Coverage is a guide, not a goal. Do not add low-signal tests just to raise numbers.

| Tier | Target | Packages/Folders |
|------|--------|------------------|
| **Logic-heavy** | 90% lines / 90% statements / 85% branches | `packages/core/src/**` |
| **Services** | 90% lines / 90% statements / 85% branches | `packages/api/src/**` |
| **UI** | 50% lines (behavioral focus) | `packages/ui/src/**` |
| **App** | 75% lines / 75% statements / 65% branches | `apps/mobile/app/**` |

UI components may be lower; focus on behavior coverage.

---

## 6) Mandatory Verification: run tests after major changes
A **major change** includes any change that:
- modifies domain/services/state/business logic, auth, storage, networking
- refactors across multiple files
- changes shared utilities/components used widely
- adds/upgrades dependencies

After completing a major change, you must:
1. Run the **full unit test suite**
2. Report **commands + results** (pass/fail). If failures occurred, summarize and fix.

If you cannot execute commands in this environment, say explicitly:
> "I cannot execute tests here."
Then provide:
- exact commands to run locally/CI
- expected outcome
- a short verification checklist

---

## 7) Standard Commands

### Package Management (pnpm)
```bash
pnpm install              # Install all dependencies
pnpm clean                # Clean all build artifacts and node_modules
```

### Development
```bash
pnpm dev                  # Start all dev servers (turbo)
pnpm dev:mobile           # Start Expo dev server only
pnpm dev:web              # Start Next.js dev server only
```

### Quality Checks
```bash
pnpm lint                 # Lint all packages
pnpm typecheck            # TypeScript check all packages
```

### Testing
```bash
pnpm test                 # Run all tests (turbo)
pnpm test:coverage        # Run tests with coverage reports

# Per-package testing
pnpm --filter @quillty/core test
pnpm --filter @quillty/api test
pnpm --filter @quillty/ui test
pnpm --filter mobile test

# Watch mode
pnpm --filter @quillty/api test:watch
```

### Building
```bash
pnpm build                # Build all packages
```

When reporting verification, always include the exact command(s) used.

---

## 8) Output format when you make changes
For each change batch:
- **What changed** (1–3 bullets)
- **Files touched**
- **Why it matches conventions** (reference similar files/patterns)
- **How verified** (commands + results, or commands + checklist if not runnable)

End with a completion checklist:
- ✅ Conventions followed
- ✅ Lint/typecheck status
- ✅ Unit tests run after major change
- ✅ Docs updated if needed

---

## 9) API Hook Patterns

When creating React Query hooks in `packages/api`:

```typescript
// Query hook pattern
export function usePattern(patternId?: string) {
  return useQuery({
    queryKey: ['pattern', patternId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .eq('id', patternId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!patternId,
  });
}

// Mutation hook pattern
export function useCreatePattern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PatternInsert) => {
      const { data, error } = await supabase
        .from('table_name')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patterns'] });
    },
  });
}
```

---

## 10) Component Patterns

When creating UI components in `packages/ui`:

```typescript
// Use Nativewind for styling with cn() utility
import { View, Text, Pressable } from 'react-native';
import { cn } from '../utils/cn';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
}

export function Button({ children, variant = 'primary', onPress, className }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'items-center justify-center rounded-lg px-4 py-3',
        variant === 'primary' && 'bg-brand',
        variant === 'secondary' && 'border border-gray-200 bg-white',
        className
      )}
    >
      <Text className={cn(
        'font-semibold',
        variant === 'primary' && 'text-white',
        variant === 'secondary' && 'text-gray-900'
      )}>
        {children}
      </Text>
    </Pressable>
  );
}
```
