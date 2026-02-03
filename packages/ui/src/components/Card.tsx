import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps & { className?: string }) {
  return (
    <View
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-100 bg-white',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
