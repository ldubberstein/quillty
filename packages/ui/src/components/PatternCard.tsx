import { View, Text, Image, Pressable, type PressableProps } from 'react-native';
import { cn } from '../utils/cn';
import { Avatar } from './Avatar';

export interface PatternCardProps extends Omit<PressableProps, 'children'> {
  title: string;
  thumbnailUrl?: string | null;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  likeCount?: number;
  isPremium?: boolean;
  price?: number | null;
  onPress?: () => void;
}

export function PatternCard({
  title,
  thumbnailUrl,
  creatorName,
  creatorAvatarUrl,
  likeCount = 0,
  isPremium = false,
  price,
  onPress,
  className,
  ...props
}: PatternCardProps & { className?: string }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-100 bg-white',
        'active:scale-[0.98] transition-transform',
        className
      )}
      {...props}
    >
      {/* Thumbnail */}
      <View className="relative aspect-[4/5] w-full bg-gray-100">
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl">🧵</Text>
          </View>
        )}

        {/* Price Badge */}
        {isPremium && price ? (
          <View className="absolute right-2 top-2 rounded-full bg-amber-500 px-3 py-1">
            <Text className="text-sm font-semibold text-white">${price}</Text>
          </View>
        ) : (
          <View className="absolute right-2 top-2 rounded-full bg-emerald-500 px-3 py-1">
            <Text className="text-sm font-semibold text-white">FREE</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-3">
        <Text
          className="text-base font-semibold text-gray-900"
          numberOfLines={2}
        >
          {title}
        </Text>

        <View className="mt-2 flex-row items-center justify-between">
          {/* Creator */}
          <View className="flex-row items-center flex-1 mr-2">
            <Avatar
              size="xs"
              src={creatorAvatarUrl}
              name={creatorName}
            />
            <Text
              className="ml-2 text-sm text-gray-600 flex-1"
              numberOfLines={1}
            >
              {creatorName || 'Unknown'}
            </Text>
          </View>

          {/* Likes */}
          <View className="flex-row items-center">
            <Text className="text-sm text-gray-500">♥</Text>
            <Text className="ml-1 text-sm text-gray-500">{likeCount}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
