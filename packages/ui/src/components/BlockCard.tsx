import { View, Text, Image, Pressable, type PressableProps } from 'react-native';
import { cn } from '../utils/cn';
import { Avatar } from './Avatar';

export interface BlockCardProps extends Omit<PressableProps, 'children'> {
  name: string;
  thumbnailUrl?: string | null;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  likeCount?: number;
  onPress?: () => void;
}

export function BlockCard({
  name,
  thumbnailUrl,
  creatorName,
  creatorAvatarUrl,
  likeCount = 0,
  onPress,
  className,
  ...props
}: BlockCardProps & { className?: string }) {
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
      {/* Square Thumbnail */}
      <View className="relative aspect-square w-full bg-gray-100">
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl">◇</Text>
          </View>
        )}

        {/* Block Badge */}
        <View className="absolute left-2 top-2 rounded-full bg-indigo-500 px-3 py-1">
          <Text className="text-sm font-semibold text-white">Block</Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-3">
        <Text
          className="text-base font-semibold text-gray-900"
          numberOfLines={2}
        >
          {name}
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
