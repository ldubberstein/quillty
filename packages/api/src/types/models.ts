import type { Database } from './database';

export type User = Database['public']['Tables']['users']['Row'];
export type Pattern = Database['public']['Tables']['quilt_patterns']['Row'];
export type Block = Database['public']['Tables']['blocks']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Save = Database['public']['Tables']['saves']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];

export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type PatternInsert = Database['public']['Tables']['quilt_patterns']['Insert'];
export type BlockInsert = Database['public']['Tables']['blocks']['Insert'];
export type LikeInsert = Database['public']['Tables']['likes']['Insert'];
export type SaveInsert = Database['public']['Tables']['saves']['Insert'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];
export type FollowInsert = Database['public']['Tables']['follows']['Insert'];

export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type PatternUpdate = Database['public']['Tables']['quilt_patterns']['Update'];
export type BlockUpdate = Database['public']['Tables']['blocks']['Update'];
export type CommentUpdate = Database['public']['Tables']['comments']['Update'];

// Feed item type (union of Pattern and Block for feed display)
export type FeedItem =
  | { type: 'pattern'; data: Pattern }
  | { type: 'block'; data: Block };
