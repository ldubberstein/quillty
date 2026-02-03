import { Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '../utils/cn';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps & { className?: string }) {
  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-full',
        // Size
        size === 'sm' && 'min-h-[36px] px-4 py-2',
        size === 'md' && 'min-h-[44px] px-6 py-3',
        size === 'lg' && 'min-h-[52px] px-8 py-4',
        // Variant
        variant === 'primary' && 'bg-brand',
        variant === 'secondary' && 'border border-gray-200 bg-white',
        variant === 'ghost' && 'bg-transparent',
        className
      )}
      {...props}
    >
      <Text
        className={cn(
          'font-semibold',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg',
          variant === 'primary' && 'text-white',
          variant === 'secondary' && 'text-gray-900',
          variant === 'ghost' && 'text-gray-600'
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}
