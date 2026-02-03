-- Quillty Initial Schema
-- ======================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_partner BOOLEAN DEFAULT FALSE,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Username validation
ALTER TABLE public.users ADD CONSTRAINT username_format
  CHECK (username ~ '^[a-z0-9_]{3,30}$');

-- ============================================================================
-- PARTNERS
-- ============================================================================

CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  total_earnings_cents INTEGER DEFAULT 0,
  available_balance_cents INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- BLOCKS
-- ============================================================================

CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_platform_block BOOLEAN DEFAULT FALSE,
  grid_size INTEGER DEFAULT 4,
  design_data JSONB NOT NULL,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  piece_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX blocks_creator_id_idx ON public.blocks(creator_id);
CREATE INDEX blocks_status_idx ON public.blocks(status);
CREATE INDEX blocks_published_at_idx ON public.blocks(published_at DESC) WHERE status = 'published';

-- ============================================================================
-- QUILT PATTERNS
-- ============================================================================

CREATE TABLE public.quilt_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published_free', 'published_premium')),
  price_cents INTEGER,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  category TEXT,
  size TEXT,
  design_data JSONB NOT NULL,
  like_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX patterns_creator_id_idx ON public.quilt_patterns(creator_id);
CREATE INDEX patterns_status_idx ON public.quilt_patterns(status);
CREATE INDEX patterns_published_at_idx ON public.quilt_patterns(published_at DESC)
  WHERE status IN ('published_free', 'published_premium');
CREATE INDEX patterns_category_idx ON public.quilt_patterns(category) WHERE category IS NOT NULL;

-- ============================================================================
-- PATTERN BLOCKS (junction table)
-- ============================================================================

CREATE TABLE public.pattern_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID NOT NULL REFERENCES public.quilt_patterns(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pattern_blocks_pattern_idx ON public.pattern_blocks(pattern_id);
CREATE INDEX pattern_blocks_block_idx ON public.pattern_blocks(block_id);

-- ============================================================================
-- SOCIAL: FOLLOWS
-- ============================================================================

CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

CREATE INDEX follows_follower_idx ON public.follows(follower_id);
CREATE INDEX follows_followed_idx ON public.follows(followed_id);

-- ============================================================================
-- SOCIAL: LIKES
-- ============================================================================

CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES public.quilt_patterns(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (pattern_id IS NOT NULL AND block_id IS NULL) OR
    (pattern_id IS NULL AND block_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX likes_user_pattern_idx ON public.likes(user_id, pattern_id) WHERE pattern_id IS NOT NULL;
CREATE UNIQUE INDEX likes_user_block_idx ON public.likes(user_id, block_id) WHERE block_id IS NOT NULL;

-- ============================================================================
-- SOCIAL: SAVES
-- ============================================================================

CREATE TABLE public.saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES public.quilt_patterns(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (pattern_id IS NOT NULL AND block_id IS NULL) OR
    (pattern_id IS NULL AND block_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX saves_user_pattern_idx ON public.saves(user_id, pattern_id) WHERE pattern_id IS NOT NULL;
CREATE UNIQUE INDEX saves_user_block_idx ON public.saves(user_id, block_id) WHERE block_id IS NOT NULL;

-- ============================================================================
-- SOCIAL: COMMENTS
-- ============================================================================

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES public.quilt_patterns(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (pattern_id IS NOT NULL AND block_id IS NULL) OR
    (pattern_id IS NULL AND block_id IS NOT NULL)
  )
);

CREATE INDEX comments_pattern_idx ON public.comments(pattern_id) WHERE pattern_id IS NOT NULL;
CREATE INDEX comments_block_idx ON public.comments(block_id) WHERE block_id IS NOT NULL;
CREATE INDEX comments_user_idx ON public.comments(user_id);

-- ============================================================================
-- COMMERCE: PURCHASES
-- ============================================================================

CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pattern_id UUID NOT NULL REFERENCES public.quilt_patterns(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  creator_earnings_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX purchases_buyer_idx ON public.purchases(buyer_id);
CREATE INDEX purchases_pattern_idx ON public.purchases(pattern_id);
CREATE UNIQUE INDEX purchases_stripe_idx ON public.purchases(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'purchase', 'payout')),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  pattern_id UUID REFERENCES public.quilt_patterns(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON public.notifications(user_id);
CREATE INDEX notifications_unread_idx ON public.notifications(user_id, created_at DESC) WHERE read = FALSE;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quilt_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users: public read, own write
CREATE POLICY "Public profiles are viewable" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Partners: own access only
CREATE POLICY "Partners can view own data" ON public.partners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Partners can update own data" ON public.partners FOR UPDATE USING (auth.uid() = user_id);

-- Blocks: public read published, own write
CREATE POLICY "Published blocks are viewable" ON public.blocks FOR SELECT
  USING (status = 'published' OR auth.uid() = creator_id);
CREATE POLICY "Users can insert own blocks" ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own blocks" ON public.blocks FOR UPDATE
  USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own blocks" ON public.blocks FOR DELETE
  USING (auth.uid() = creator_id);

-- Patterns: public read published, own write, purchased access
CREATE POLICY "Published patterns are viewable" ON public.quilt_patterns FOR SELECT USING (
  status IN ('published_free', 'published_premium')
  OR auth.uid() = creator_id
  OR EXISTS (
    SELECT 1 FROM public.purchases
    WHERE purchases.pattern_id = quilt_patterns.id
    AND purchases.buyer_id = auth.uid()
    AND purchases.status = 'completed'
  )
);
CREATE POLICY "Users can insert own patterns" ON public.quilt_patterns FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own patterns" ON public.quilt_patterns FOR UPDATE
  USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own patterns" ON public.quilt_patterns FOR DELETE
  USING (auth.uid() = creator_id);

-- Pattern blocks: follow pattern visibility
CREATE POLICY "Pattern blocks follow pattern visibility" ON public.pattern_blocks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quilt_patterns
    WHERE quilt_patterns.id = pattern_blocks.pattern_id
    AND (
      quilt_patterns.status IN ('published_free', 'published_premium')
      OR quilt_patterns.creator_id = auth.uid()
    )
  )
);

-- Follows: public read, authenticated write
CREATE POLICY "Follows are viewable" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Likes: public read, authenticated write
CREATE POLICY "Likes are viewable" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Saves: own access only
CREATE POLICY "Users can view own saves" ON public.saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save" ON public.saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave" ON public.saves FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, authenticated write
CREATE POLICY "Comments are viewable" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Purchases: own access only
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT
  USING (auth.uid() = buyer_id);

-- Notifications: own access only
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER blocks_updated_at BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER patterns_updated_at BEFORE UPDATE ON public.quilt_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), ' ', '_')) || '_' || SUBSTR(NEW.id::text, 1, 8),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update follower counts
CREATE OR REPLACE FUNCTION public.update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET follower_count = follower_count + 1 WHERE id = NEW.followed_id;
    UPDATE public.users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET follower_count = follower_count - 1 WHERE id = OLD.followed_id;
    UPDATE public.users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follower_counts();

-- Update like counts
CREATE OR REPLACE FUNCTION public.update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.pattern_id IS NOT NULL THEN
      UPDATE public.quilt_patterns SET like_count = like_count + 1 WHERE id = NEW.pattern_id;
    ELSIF NEW.block_id IS NOT NULL THEN
      UPDATE public.blocks SET like_count = like_count + 1 WHERE id = NEW.block_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.pattern_id IS NOT NULL THEN
      UPDATE public.quilt_patterns SET like_count = like_count - 1 WHERE id = OLD.pattern_id;
    ELSIF OLD.block_id IS NOT NULL THEN
      UPDATE public.blocks SET like_count = like_count - 1 WHERE id = OLD.block_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_like_counts();

-- Update comment counts
CREATE OR REPLACE FUNCTION public.update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.pattern_id IS NOT NULL THEN
      UPDATE public.quilt_patterns SET comment_count = comment_count + 1 WHERE id = NEW.pattern_id;
    ELSIF NEW.block_id IS NOT NULL THEN
      UPDATE public.blocks SET comment_count = comment_count + 1 WHERE id = NEW.block_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.pattern_id IS NOT NULL THEN
      UPDATE public.quilt_patterns SET comment_count = comment_count - 1 WHERE id = OLD.pattern_id;
    ELSIF OLD.block_id IS NOT NULL THEN
      UPDATE public.blocks SET comment_count = comment_count - 1 WHERE id = OLD.block_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_counts();
