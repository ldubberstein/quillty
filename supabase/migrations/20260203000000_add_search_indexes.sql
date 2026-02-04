-- Add full-text search indexes for blocks and patterns

-- Full-text search index for blocks (name + description)
CREATE INDEX IF NOT EXISTS blocks_search_idx ON public.blocks
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Full-text search index for patterns (title + description)
CREATE INDEX IF NOT EXISTS patterns_search_idx ON public.quilt_patterns
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Index for username prefix search
CREATE INDEX IF NOT EXISTS users_username_trgm_idx ON public.users
  USING gin(username gin_trgm_ops);

-- Enable pg_trgm extension if not already enabled (for trigram search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add composite indexes for common query patterns

-- Feed queries: status + published_at
CREATE INDEX IF NOT EXISTS blocks_feed_idx ON public.blocks (status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS patterns_feed_idx ON public.quilt_patterns (status, published_at DESC)
  WHERE status IN ('published_free', 'published_premium');

-- User content queries: creator_id + status + published_at
CREATE INDEX IF NOT EXISTS blocks_creator_idx ON public.blocks (creator_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS patterns_creator_idx ON public.quilt_patterns (creator_id, status, published_at DESC);

-- Social queries
CREATE INDEX IF NOT EXISTS likes_user_idx ON public.likes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saves_user_idx ON public.saves (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows (follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS follows_followed_idx ON public.follows (followed_id, created_at DESC);

-- Notifications query optimization
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id, read, created_at DESC)
  WHERE read = false;

-- Comments query optimization
CREATE INDEX IF NOT EXISTS comments_block_idx ON public.comments (block_id, created_at DESC)
  WHERE block_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_pattern_idx ON public.comments (pattern_id, created_at DESC)
  WHERE pattern_id IS NOT NULL;

-- Purchases query optimization
CREATE INDEX IF NOT EXISTS purchases_user_idx ON public.purchases (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_pattern_idx ON public.purchases (pattern_id);

-- Partners lookup
CREATE INDEX IF NOT EXISTS partners_user_idx ON public.partners (user_id);
CREATE INDEX IF NOT EXISTS partners_stripe_idx ON public.partners (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
