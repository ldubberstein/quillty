# Quillty Commands Reference

Quick reference for common development commands in this repository.

## Package Management

```bash
pnpm install              # Install all dependencies
pnpm clean                # Clean all build artifacts and node_modules
```

## Development

```bash
pnpm dev                  # Start all dev servers (turbo)
pnpm dev:mobile           # Start Expo dev server only
pnpm dev:web              # Start Next.js dev server only
```

## Testing

```bash
pnpm test                 # Run all tests (turbo)
pnpm test:coverage        # Run tests with coverage reports
```

### Per-Package Testing

```bash
pnpm --filter @quillty/core test
pnpm --filter @quillty/api test
pnpm --filter @quillty/ui test
pnpm --filter mobile test
```

### Watch Mode

```bash
pnpm --filter @quillty/core test:watch
pnpm --filter @quillty/api test:watch
pnpm --filter @quillty/ui test:watch
pnpm --filter mobile test:watch
```

## Quality Checks

```bash
pnpm lint                 # Lint all packages
pnpm typecheck            # TypeScript check all packages
```

## Building

```bash
pnpm build                # Build all packages
```

## Supabase

```bash
# Start local Supabase (requires Docker)
npx supabase start

# Stop local Supabase
npx supabase stop

# Generate TypeScript types from schema
npx supabase gen types typescript --local > packages/api/src/types/database.ts

# Run migrations
npx supabase db push

# Reset database
npx supabase db reset
```

## Expo / Mobile

```bash
# Start Expo dev server
pnpm dev:mobile

# Run on iOS simulator
pnpm --filter mobile ios

# Run on Android emulator
pnpm --filter mobile android

# Clear Expo cache
pnpm --filter mobile start --clear
```

## Turborepo

```bash
# Run specific turbo task
pnpm turbo run <task>

# View dependency graph
pnpm turbo run build --graph
```
