import { View, Image, Text, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

export interface AvatarProps extends ViewProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  ...props
}: AvatarProps & { className?: string }) {
  const dimension = sizeMap[size];
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden rounded-full bg-gray-200',
        className
      )}
      style={{ width: dimension, height: dimension }}
      {...props}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={{ width: dimension, height: dimension }}
          resizeMode="cover"
        />
      ) : (
        <Text
          className={cn(
            'font-semibold text-gray-600',
            size === 'xs' && 'text-[10px]',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-xl'
          )}
        >
          {initials || '?'}
        </Text>
      )}
    </View>
  );
}
