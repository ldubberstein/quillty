# Supabase

Supabase provides the PostgreSQL database, authentication, and file storage for Quillty.

## Purpose

1. **Database**: PostgreSQL with automatic connection pooling
2. **Authentication**: User signup, login, OAuth providers
3. **Storage**: Image uploads (thumbnails, avatars)
4. **Realtime**: WebSocket subscriptions for notifications

## Configuration

### Environment Variables

```env
# Public (client-safe)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Secret (server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Client Types

```typescript
// 1. Browser client (uses anon key, respects RLS)
// packages/api/src/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. Service client (bypasses RLS, server-only)
// apps/web/src/app/api/v1/_lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

## Database Operations

### Query Patterns

```typescript
const supabase = createServiceClient();

// Single record
const { data, error } = await supabase
  .from('blocks')
  .select('*')
  .eq('id', blockId)
  .single();

// List with pagination
const { data, error } = await supabase
  .from('blocks')
  .select('id, name, creator:users(username)')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .range(offset, offset + limit - 1);

// Insert with returning
const { data, error } = await supabase
  .from('blocks')
  .insert({ name: 'New Block', creator_id: userId })
  .select()
  .single();

// Update
const { error } = await supabase
  .from('blocks')
  .update({ name: 'Updated' })
  .eq('id', blockId);

// Delete
const { error } = await supabase
  .from('blocks')
  .delete()
  .eq('id', blockId);
```

### Joins and Relations

```typescript
// Nested select (foreign key join)
const { data } = await supabase
  .from('blocks')
  .select(`
    id,
    name,
    creator:users!blocks_creator_id_fkey(
      id,
      username,
      display_name,
      avatar_url
    )
  `)
  .eq('id', blockId)
  .single();

// Multiple relations
const { data } = await supabase
  .from('notifications')
  .select(`
    id,
    type,
    actor:users!notifications_actor_id_fkey(username),
    block:blocks!notifications_block_id_fkey(name)
  `)
  .eq('user_id', userId);
```

### Counting

```typescript
// Count only (no data)
const { count, error } = await supabase
  .from('notifications')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('read', false);
```

## Type Safety

### Generated Types

```typescript
// packages/api/src/types/database.ts
export interface Database {
  public: {
    Tables: {
      blocks: {
        Row: {
          id: string;
          name: string;
          creator_id: string;
          status: 'draft' | 'published';
          // ...
        };
        Insert: {
          name: string;
          creator_id: string;
          // ...
        };
        Update: {
          name?: string;
          // ...
        };
      };
      // ... other tables
    };
  };
}
```

### Using Types

```typescript
import type { Database } from '@quillty/api';

const supabase = createClient<Database>(url, key);

// Now fully typed:
const { data } = await supabase.from('blocks').select('*');
// data is Database['public']['Tables']['blocks']['Row'][]
```

## Authentication

### Server-Side JWT Validation

```typescript
// apps/web/src/app/api/v1/_lib/auth.ts
export async function requireAuth(request: NextRequest) {
  const token = extractToken(request);
  if (!token) throw new AuthError('No token provided');

  const supabase = createServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) throw new AuthError('Invalid token');
  return user;
}
```

### Token Extraction

```typescript
function extractToken(request: NextRequest): string | null {
  // From Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // From cookie
  const cookies = request.cookies;
  const accessToken = cookies.get('sb-access-token')?.value;
  return accessToken || null;
}
```

## Row Level Security (RLS)

RLS policies are a **backup** layer - primary authorization is in API routes.

### Example Policies

```sql
-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read published blocks
CREATE POLICY "Anyone can read published blocks" ON blocks
  FOR SELECT USING (status = 'published');

-- Users can only modify their own blocks
CREATE POLICY "Users can modify own blocks" ON blocks
  FOR ALL USING (auth.uid() = creator_id);
```

## Testing

### Mocking Supabase

```typescript
// Use vi.hoisted for proper mock lifecycle
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      data: null as unknown,
      error: null as unknown,
    },
  };
});

vi.mock('../_lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockSupabase.data,
        error: mockSupabase.error,
      }),
    })),
  })),
}));
```

### Chainable Mock Pattern

```typescript
// For complex queries with chaining
const createChainableQuery = (finalData: unknown, error: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'in', 'order', 'range', 'insert', 'update', 'delete'];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Make thenable for async resolution
  chain.then = (resolve: (value: { data: unknown; error: unknown }) => void) => {
    resolve({ data: finalData, error });
    return chain;
  };

  chain.single = vi.fn().mockResolvedValue({ data: finalData, error });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: finalData, error });

  return chain;
};
```

### Testing Auth

```typescript
// Mock successful auth
vi.mock('../_lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'user-123',
    email: 'test@example.com',
  }),
}));

// Mock auth failure
it('should return 401 when not authenticated', async () => {
  const { requireAuth } = await import('../_lib/auth');
  const authError = new Error('Authentication required');
  authError.name = 'AuthError';
  vi.mocked(requireAuth).mockRejectedValueOnce(authError);

  const response = await POST(request);
  expect(response.status).toBe(401);
});
```

## Storage

### Upload Files

```typescript
const supabase = createServiceClient();

// Upload to storage bucket
const { data, error } = await supabase.storage
  .from('thumbnails')
  .upload(`blocks/${blockId}.png`, file, {
    contentType: 'image/png',
    upsert: true,
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('thumbnails')
  .getPublicUrl(`blocks/${blockId}.png`);
```

## Best Practices

1. **Use service role only server-side**: Never expose in client code
2. **Always handle errors**: Check `error` before using `data`
3. **Use transactions for multi-step operations**: Wrap in `rpc` calls
4. **Index frequently queried columns**: Check query plans
5. **Use RLS as defense-in-depth**: Primary auth in API layer

## Migrations

```bash
# Create migration
supabase migration new add_search_indexes

# Apply locally
supabase db reset

# Push to production
supabase db push
```

### Example Migration

```sql
-- supabase/migrations/20260203000000_add_search_indexes.sql

-- Full-text search index for blocks
CREATE INDEX IF NOT EXISTS blocks_search_idx ON public.blocks
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Full-text search index for patterns
CREATE INDEX IF NOT EXISTS patterns_search_idx ON public.quilt_patterns
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```
