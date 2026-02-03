import { View, ScrollView, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

export interface MasonryGridProps<T> extends Omit<ViewProps, 'children'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  numColumns?: number;
  gap?: number;
  contentContainerClassName?: string;
}

export function MasonryGrid<T>({
  data,
  renderItem,
  keyExtractor,
  numColumns = 2,
  gap = 12,
  className,
  contentContainerClassName,
  ...props
}: MasonryGridProps<T> & { className?: string }) {
  // Distribute items across columns using a greedy algorithm
  // Each column gets items in a round-robin fashion for simplicity
  const columns: T[][] = Array.from({ length: numColumns }, () => []);

  data.forEach((item, index) => {
    // Simple round-robin distribution
    // For better visual balance, you could track column heights
    const columnIndex = index % numColumns;
    columns[columnIndex].push(item);
  });

  return (
    <View className={cn('flex-1', className)} {...props}>
      <ScrollView
        contentContainerClassName={cn('flex-row', contentContainerClassName)}
        showsVerticalScrollIndicator={false}
        style={{ paddingHorizontal: gap / 2 }}
      >
        {columns.map((columnItems, columnIndex) => (
          <View
            key={`column-${columnIndex}`}
            style={{
              flex: 1,
              paddingHorizontal: gap / 2,
            }}
          >
            {columnItems.map((item, itemIndex) => {
              const originalIndex = itemIndex * numColumns + columnIndex;
              return (
                <View
                  key={keyExtractor(item, originalIndex)}
                  style={{ marginBottom: gap }}
                >
                  {renderItem(item, originalIndex)}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// A simpler version that just uses flex-wrap for web-like behavior
export function MasonryGridSimple<T>({
  data,
  renderItem,
  keyExtractor,
  gap = 12,
  className,
  ...props
}: Omit<MasonryGridProps<T>, 'numColumns'> & { className?: string }) {
  return (
    <View
      className={cn('flex-row flex-wrap', className)}
      style={{ margin: -gap / 2 }}
      {...props}
    >
      {data.map((item, index) => (
        <View
          key={keyExtractor(item, index)}
          style={{ width: '50%', padding: gap / 2 }}
        >
          {renderItem(item, index)}
        </View>
      ))}
    </View>
  );
}
