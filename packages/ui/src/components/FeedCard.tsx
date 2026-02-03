import { PatternCard } from './PatternCard';
import { BlockCard } from './BlockCard';

// Types matching the API layer
interface Creator {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface PatternData {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  like_count?: number;
  status?: string;
  price?: number | null;
  creator?: Creator;
}

interface BlockData {
  id: string;
  name: string;
  thumbnail_url?: string | null;
  like_count?: number;
  creator?: Creator;
}

export type FeedItemType =
  | { type: 'pattern'; data: PatternData }
  | { type: 'block'; data: BlockData };

export interface FeedCardProps {
  item: FeedItemType;
  onPatternPress?: (patternId: string) => void;
  onBlockPress?: (blockId: string) => void;
}

export function FeedCard({ item, onPatternPress, onBlockPress }: FeedCardProps) {
  if (item.type === 'pattern') {
    const pattern = item.data;
    const isPremium = pattern.status === 'published_premium';

    return (
      <PatternCard
        title={pattern.title}
        thumbnailUrl={pattern.thumbnail_url}
        creatorName={pattern.creator?.display_name || pattern.creator?.username}
        creatorAvatarUrl={pattern.creator?.avatar_url}
        likeCount={pattern.like_count}
        isPremium={isPremium}
        price={isPremium ? pattern.price : null}
        onPress={() => onPatternPress?.(pattern.id)}
      />
    );
  }

  const block = item.data;
  return (
    <BlockCard
      name={block.name}
      thumbnailUrl={block.thumbnail_url}
      creatorName={block.creator?.display_name || block.creator?.username}
      creatorAvatarUrl={block.creator?.avatar_url}
      likeCount={block.like_count}
      onPress={() => onBlockPress?.(block.id)}
    />
  );
}
